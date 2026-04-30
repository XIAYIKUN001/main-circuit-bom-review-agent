import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsv, rowsToObjects } from "./csv.js";
import { defaultRules } from "./default-rules.js";

export async function loadBomFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const text = await readFile(filePath, "utf8");

  if (extension === ".csv") {
    return rowsToObjects(parseCsv(text));
  }

  if (extension === ".json") {
    const payload = JSON.parse(text);
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload.items)) {
      return payload.items;
    }
    throw new Error("JSON BOM must be an array or an object with an items array.");
  }

  throw new Error(`Unsupported BOM file extension: ${extension}. Use CSV or JSON.`);
}

export async function loadRuleConfig(filePath) {
  if (!filePath) {
    return defaultRules;
  }

  const text = await readFile(filePath, "utf8");
  const config = JSON.parse(text);
  if (!Array.isArray(config.rules)) {
    throw new Error("Rule config must contain a rules array.");
  }
  return config;
}
