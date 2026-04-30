export const defaultRules = {
  name: "Built-in generic main-circuit rules",
  fieldAliases: {},
  rules: [
    {
      id: "missing-designator",
      severity: "error",
      failWhen: { fieldMissing: "designator" },
      message: "The BOM row has no reference designator.",
      recommendation: "Add schematic references such as R1, C1, Q1, or T1."
    },
    {
      id: "missing-part",
      severity: "error",
      failWhen: { fieldMissing: "part" },
      message: "The BOM row has no part value or part number.",
      recommendation: "Add an electrical value, manufacturer part number, or controlled internal part number."
    },
    {
      id: "missing-quantity",
      severity: "error",
      failWhen: { fieldMissing: "quantity" },
      message: "The BOM row has no quantity.",
      recommendation: "Add the required quantity from the schematic BOM export."
    },
    {
      id: "invalid-quantity",
      severity: "error",
      when: { fieldPresent: "quantity" },
      failWhen: { any: [{ quantityLessThan: 1 }, { quantityNotInteger: true }] },
      message: "Quantity must be a positive integer.",
      recommendation: "Check the BOM export and merge strategy for this line."
    },
    {
      id: "generic-placeholder-part",
      severity: "warning",
      failWhen: {
        fieldMatches: {
          field: "part",
          pattern: "^(?:tbd|n/?a|mov|ntc|ptc|tvs|diode|mosfet|capacitor|cap|resistor|res|inductor|transformer|connector)$",
          flags: "i"
        }
      },
      message: "The part field looks like a generic placeholder.",
      recommendation: "Replace placeholders with a real value, rating, package, or manufacturer part number."
    },
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
      recommendation: "Add rated voltage, insulation rating, creepage requirement, or an exact manufacturer part number."
    },
    {
      id: "power-resistor-wattage-required",
      severity: "warning",
      when: {
        all: [
          { hasTag: "resistor" },
          {
            any: [
              { hasTag: "power" },
              { hasTag: "high_voltage" },
              { textMatches: { pattern: "\\b(?:sense|bleeder|divider|shunt|snubber|inrush|output)\\b", flags: "i" } }
            ]
          }
        ]
      },
      unless: {
        textMatches: {
          pattern: "\\b\\d+(?:\\.\\d+)?\\s*w\\b",
          flags: "i"
        }
      },
      message: "Power or high-voltage resistor rows should include wattage.",
      recommendation: "Add continuous power, pulse power if relevant, and derating assumptions."
    },
    {
      id: "capacitor-voltage-rating-required",
      severity: "warning",
      when: { hasTag: "capacitor" },
      unless: {
        textMatches: {
          pattern: "\\b\\d+(?:\\.\\d+)?\\s*(?:kv|vdc|vac|v)\\b",
          flags: "i"
        }
      },
      message: "Capacitor rows should include voltage rating.",
      recommendation: "Add DC or AC voltage rating, dielectric type, tolerance, and package."
    },
    {
      id: "semiconductor-voltage-rating-required",
      severity: "warning",
      when: { hasTag: "semiconductor" },
      unless: {
        textMatches: {
          pattern: "\\b\\d+(?:\\.\\d+)?\\s*(?:kv|vdc|vac|v)\\b",
          flags: "i"
        }
      },
      message: "Semiconductor rows should include voltage rating or exact part number.",
      recommendation: "Add blocking voltage, current rating, package, and datasheet part number."
    },
    {
      id: "transformer-spec-required",
      severity: "warning",
      when: { hasTag: "transformer" },
      unless: {
        textMatches: {
          pattern: "\\b(?:turns|ratio|core|primary|secondary|isolation|insulation|va|\\d+\\s*w)\\b",
          flags: "i"
        }
      },
      message: "Transformer rows need a controlled custom specification.",
      recommendation: "Add core type, material, turns ratio, insulation target, frequency range, and vendor drawing reference."
    },
    {
      id: "connector-rating-required",
      severity: "info",
      when: { hasTag: "connector" },
      unless: {
        textMatches: {
          pattern: "\\b\\d+(?:\\.\\d+)?\\s*(?:a|kv|vdc|vac|v)\\b",
          flags: "i"
        }
      },
      message: "Connector rows should include current or voltage rating.",
      recommendation: "Add pitch, current, voltage, wire gauge, and mounting type."
    }
  ]
};
