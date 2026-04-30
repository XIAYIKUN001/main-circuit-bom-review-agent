import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, rowsToObjects } from "../src/csv.js";
import { BomReviewAgent } from "../src/agent.js";

test("CSV parser handles quoted fields", () => {
  const rows = parseCsv('Value,Description,Quantity\n"10M, 2W","Divider resistor",2\n');
  assert.deepEqual(rows, [
    ["Value", "Description", "Quantity"],
    ["10M, 2W", "Divider resistor", "2"]
  ]);
});

test("agent flags high-voltage item without voltage rating", () => {
  const agent = new BomReviewAgent({
    rules: [
      {
        id: "hv-rating-required",
        severity: "error",
        when: { hasTag: "high_voltage" },
        unless: {
          textMatches: {
            pattern: "\\b\\d+(?:\\.\\d+)?\\s*(?:kv|vdc|vac|v)\\b",
            flags: "i"
          }
        },
        message: "High-voltage related parts must show a voltage rating.",
        recommendation: "Add the voltage rating."
      }
    ]
  });

  const report = agent.auditRows([
    {
      Value: "250M",
      Description: "High voltage divider resistor",
      Designator: "R1",
      Quantity: "1"
    }
  ]);

  assert.equal(report.summary.error, 1);
  assert.equal(report.findings[0].ruleId, "hv-rating-required");
});

test("agent accepts high-voltage item with voltage and power rating", () => {
  const agent = new BomReviewAgent();
  const report = agent.auditRows([
    {
      Value: "10M 2W 10kV",
      Description: "High voltage bleeder resistor",
      Designator: "R1",
      Quantity: "1"
    }
  ]);

  assert.equal(report.summary.error, 0);
});

test("agent detects duplicate designators across rows", () => {
  const agent = new BomReviewAgent();
  const report = agent.auditRows([
    { Value: "10k", Description: "Pull down", Designator: "R1 R2", Quantity: "2" },
    { Value: "4.7k", Description: "Feedback", Designator: "R2", Quantity: "1" }
  ]);

  assert.ok(report.findings.some((finding) => finding.ruleId === "duplicate-designator"));
});

test("rowsToObjects maps CSV headers to objects", () => {
  const objects = rowsToObjects(parseCsv("Value,Quantity\nMOV,1\n"));
  assert.deepEqual(objects, [{ Value: "MOV", Quantity: "1" }]);
});
