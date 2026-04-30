import { DEFAULT_FIELD_ALIASES, BomItem, mergeFieldAliases } from "./fields.js";
import { loadBomFile, loadRuleConfig } from "./loaders.js";
import { RuleEngine } from "./rules.js";
import { createReport } from "./report.js";

class SchemaAgent {
  review(items) {
    const findings = [];
    const ownerByDesignator = new Map();

    for (const item of items) {
      for (const designator of item.designators()) {
        const key = designator.toUpperCase();
        const owner = ownerByDesignator.get(key);
        if (owner && owner.rowNumber !== item.rowNumber) {
          findings.push({
            ruleId: "duplicate-designator",
            severity: "error",
            row: item.rowNumber,
            designator: item.refLabel(),
            part: item.partLabel(),
            message: `Designator ${designator} appears in multiple BOM rows.`,
            recommendation: `Merge duplicate designator ${designator} into one BOM line or fix the schematic export.`,
            tags: item.tags,
            raw: item.raw
          });
        } else {
          ownerByDesignator.set(key, item);
        }
      }
    }

    return findings;
  }
}

class RuleReviewAgent {
  constructor(rules) {
    this.engine = new RuleEngine(rules);
  }

  review(items) {
    return this.engine.review(items);
  }
}

export class BomReviewAgent {
  constructor(config = {}) {
    this.config = config;
    this.name = config.name ?? "Main Circuit BOM Review";
    this.aliases = mergeFieldAliases(DEFAULT_FIELD_ALIASES, config.fieldAliases ?? {});
    this.schemaAgent = new SchemaAgent();
    this.ruleReviewAgent = new RuleReviewAgent(config.rules ?? []);
  }

  static async fromRuleFile(filePath) {
    const config = await loadRuleConfig(filePath);
    return new BomReviewAgent(config);
  }

  async auditFile(filePath) {
    const rows = await loadBomFile(filePath);
    return this.auditRows(rows);
  }

  auditRows(rows) {
    const items = rows.map((row, index) => new BomItem(index + 2, row, this.aliases));
    const findings = [
      ...this.schemaAgent.review(items),
      ...this.ruleReviewAgent.review(items)
    ];

    return createReport({
      name: this.name,
      items,
      findings
    });
  }
}
