import { severityRank } from "./rules.js";

function escapeMarkdown(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

export function createReport({ name, items, findings }) {
  const counts = {
    totalItems: items.length,
    totalFindings: findings.length,
    error: 0,
    warning: 0,
    info: 0
  };

  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  const sortedFindings = [...findings].sort((a, b) => {
    const bySeverity = severityRank[b.severity] - severityRank[a.severity];
    return bySeverity || a.row - b.row || a.ruleId.localeCompare(b.ruleId);
  });

  return {
    name,
    generatedAt: new Date().toISOString(),
    summary: counts,
    findings: sortedFindings
  };
}

export function reportToJson(report) {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function reportToMarkdown(report) {
  const lines = [
    `# ${report.name}`,
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Items reviewed: ${report.summary.totalItems}`,
    `- Findings: ${report.summary.totalFindings}`,
    `- Errors: ${report.summary.error}`,
    `- Warnings: ${report.summary.warning}`,
    `- Info: ${report.summary.info}`,
    "",
    "## Findings",
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("No findings.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("| Severity | Rule | Row | Ref | Part | Message | Recommendation |");
  lines.push("|---|---|---:|---|---|---|---|");

  for (const finding of report.findings) {
    lines.push(
      [
        finding.severity.toUpperCase(),
        finding.ruleId,
        finding.row,
        escapeMarkdown(finding.designator),
        escapeMarkdown(finding.part),
        escapeMarkdown(finding.message),
        escapeMarkdown(finding.recommendation)
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |")
    );
  }

  lines.push("");
  return lines.join("\n");
}
