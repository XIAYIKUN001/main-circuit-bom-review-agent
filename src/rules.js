import { evaluateCondition } from "./conditions.js";

export const severityRank = {
  info: 1,
  warning: 2,
  error: 3
};

function normalizeSeverity(value) {
  const severity = String(value ?? "warning").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(severityRank, severity)) {
    throw new Error(`Unsupported severity: ${value}`);
  }
  return severity;
}

function renderTemplate(template, item) {
  return String(template ?? "")
    .replaceAll("{{row}}", String(item.rowNumber))
    .replaceAll("{{designator}}", item.refLabel())
    .replaceAll("{{part}}", item.partLabel());
}

export class RuleEngine {
  constructor(rules = []) {
    this.rules = rules.map((rule) => ({
      ...rule,
      severity: normalizeSeverity(rule.severity)
    }));
  }

  review(items) {
    const findings = [];

    for (const item of items) {
      for (const rule of this.rules) {
        if (!this.shouldReport(rule, item)) {
          continue;
        }

        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          row: item.rowNumber,
          designator: item.refLabel(),
          part: item.partLabel(),
          message: renderTemplate(rule.message, item),
          recommendation: renderTemplate(rule.recommendation, item),
          tags: item.tags,
          raw: item.raw
        });
      }
    }

    return findings;
  }

  shouldReport(rule, item) {
    const when = evaluateCondition(rule.when ?? {}, item);
    if (!when) {
      return false;
    }

    if (rule.failWhen) {
      return evaluateCondition(rule.failWhen, item);
    }

    if (rule.unless) {
      return !evaluateCondition(rule.unless, item);
    }

    return true;
  }
}

export function hasFindingsAtOrAbove(findings, severity) {
  if (!severity || severity === "none") {
    return false;
  }

  const rank = severityRank[severity];
  if (!rank) {
    throw new Error(`Unsupported fail-on severity: ${severity}`);
  }

  return findings.some((finding) => severityRank[finding.severity] >= rank);
}
