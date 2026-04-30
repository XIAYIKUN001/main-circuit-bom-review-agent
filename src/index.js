#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { BomReviewAgent } from "./agent.js";
import { hasFindingsAtOrAbove } from "./rules.js";
import { reportToJson, reportToMarkdown } from "./report.js";

function printHelp() {
  console.log(`Main Circuit BOM Review Agent

Usage:
  bom-review-agent <bom.csv|bom.json> [options]
  node src/index.js <bom.csv|bom.json> [options]

Options:
  --rules <file>       JSON rule file. Uses built-in rules when omitted.
  --format <format>    markdown or json. Default: markdown.
  --output <file>      Write report to a file. Defaults to stdout.
  --fail-on <level>    none, info, warning, or error. Default: none.
  --help               Show this help.

Examples:
  node src/index.js examples/main-circuit-bom.csv
  node src/index.js examples/main-circuit-bom.csv --format json --output report.json
  node src/index.js examples/main-circuit-bom.csv --rules examples/rules.main-circuit.json --fail-on error
`);
}

function parseArgs(argv) {
  const options = {
    format: "markdown",
    failOn: "none"
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--rules") {
      options.rules = argv[++i];
    } else if (arg === "--format") {
      options.format = argv[++i];
    } else if (arg === "--output") {
      options.output = argv[++i];
    } else if (arg === "--fail-on") {
      options.failOn = argv[++i];
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  options.bomPath = positional[0];
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.bomPath) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const agent = await BomReviewAgent.fromRuleFile(options.rules);
  const report = await agent.auditFile(options.bomPath);
  const format = String(options.format).toLowerCase();

  let output;
  if (format === "markdown" || format === "md") {
    output = reportToMarkdown(report);
  } else if (format === "json") {
    output = reportToJson(report);
  } else {
    throw new Error(`Unsupported format: ${options.format}`);
  }

  if (options.output) {
    await writeFile(options.output, output, "utf8");
  } else {
    process.stdout.write(output);
  }

  if (hasFindingsAtOrAbove(report.findings, String(options.failOn).toLowerCase())) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
