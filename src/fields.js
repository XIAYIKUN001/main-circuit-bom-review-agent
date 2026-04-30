export const DEFAULT_FIELD_ALIASES = {
  part: ["part", "part number", "mpn", "manufacturer part number", "value", "comment"],
  description: ["description", "desc", "name", "function"],
  designator: ["designator", "refdes", "reference", "references", "ref"],
  footprint: ["footprint", "package", "case"],
  quantity: ["quantity", "qty", "count"],
  manufacturer: ["manufacturer", "mfr", "vendor"],
  supplier: ["supplier", "distributor"],
  datasheet: ["datasheet", "datasheet url", "url"]
};

export function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-./\\()[\]{}:]+/g, "");
}

export function mergeFieldAliases(baseAliases, customAliases = {}) {
  const merged = { ...baseAliases };

  for (const [field, aliases] of Object.entries(customAliases)) {
    const nextAliases = Array.isArray(aliases) ? aliases : [aliases];
    merged[field] = [...(merged[field] ?? []), ...nextAliases];
  }

  return merged;
}

function normalizeValue(value) {
  return String(value ?? "").trim();
}

function buildAliasIndex(aliases) {
  const index = new Map();
  for (const [field, names] of Object.entries(aliases)) {
    for (const name of names) {
      index.set(normalizeHeader(name), field);
    }
  }
  return index;
}

export function splitDesignators(value) {
  return normalizeValue(value)
    .split(/[,\s;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export class BomItem {
  constructor(rowNumber, raw, aliases) {
    this.rowNumber = rowNumber;
    this.raw = raw;
    this.aliases = aliases;
    this.aliasIndex = buildAliasIndex(aliases);
    this.canonical = this.buildCanonicalFields();
    this.tags = this.buildTags();
  }

  buildCanonicalFields() {
    const canonical = {};

    for (const [header, value] of Object.entries(this.raw)) {
      const normalized = normalizeHeader(header);
      const field = this.aliasIndex.get(normalized);
      if (field && !canonical[field]) {
        canonical[field] = normalizeValue(value);
      }
    }

    return canonical;
  }

  get(field) {
    return normalizeValue(this.canonical[field]);
  }

  has(field) {
    return this.get(field) !== "";
  }

  allText() {
    return Object.values(this.raw).map(normalizeValue).filter(Boolean).join(" ");
  }

  partLabel() {
    return this.get("part") || this.get("description") || "(unknown part)";
  }

  refLabel() {
    return this.get("designator") || `row ${this.rowNumber}`;
  }

  quantity() {
    const rawQuantity = this.get("quantity");
    if (!rawQuantity) {
      return Number.NaN;
    }

    const number = Number(rawQuantity.replace(/,/g, ""));
    return Number.isFinite(number) ? number : Number.NaN;
  }

  designators() {
    return splitDesignators(this.get("designator"));
  }

  buildTags() {
    const text = this.allText().toLowerCase();
    const tags = new Set();

    const checks = [
      ["high_voltage", /\b(?:hv|high voltage|k[vw]|kilovolt|divider|bleeder|multiplier|cw|output)\b/],
      ["power", /\b(?:power|bus|mains|line|inrush|snubber|bridge|rectifier|half bridge|full bridge)\b/],
      ["resistor", /\b(?:resistor|res\b|ohm|kohm|mohm|\d+\s*(?:r|k|m|ohm))\b/],
      ["capacitor", /\b(?:capacitor|cap\b|uf|nf|pf|film|ceramic|electrolytic)\b/],
      ["inductor", /\b(?:inductor|choke|coil|mh|uh)\b/],
      ["semiconductor", /\b(?:mosfet|igbt|diode|rectifier|scr|triac|transistor|tvs|bridge)\b/],
      ["transformer", /\b(?:transformer|xfmr|gate drive transformer|main transformer|isolation)\b/],
      ["connector", /\b(?:connector|terminal|header|socket|plug|jack)\b/],
      ["protection", /\b(?:fuse|mov|ntc|ptc|tvs|varistor|surge|clamp|protection)\b/]
    ];

    for (const [tag, pattern] of checks) {
      if (pattern.test(text)) {
        tags.add(tag);
      }
    }

    return [...tags].sort();
  }
}
