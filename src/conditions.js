function toRegExp(spec, defaultFlags = "i") {
  if (typeof spec === "string") {
    return new RegExp(spec, defaultFlags);
  }

  if (spec && typeof spec.pattern === "string") {
    return new RegExp(spec.pattern, spec.flags ?? defaultFlags);
  }

  throw new Error(`Invalid regex condition: ${JSON.stringify(spec)}`);
}

function isMissing(value) {
  return String(value ?? "").trim() === "";
}

export function evaluateCondition(condition, item) {
  if (!condition || Object.keys(condition).length === 0) {
    return true;
  }

  if (Array.isArray(condition.all)) {
    return condition.all.every((part) => evaluateCondition(part, item));
  }

  if (Array.isArray(condition.any)) {
    return condition.any.some((part) => evaluateCondition(part, item));
  }

  if (condition.not) {
    return !evaluateCondition(condition.not, item);
  }

  if (Object.prototype.hasOwnProperty.call(condition, "fieldMissing")) {
    return isMissing(item.get(condition.fieldMissing));
  }

  if (Object.prototype.hasOwnProperty.call(condition, "fieldPresent")) {
    return !isMissing(item.get(condition.fieldPresent));
  }

  if (condition.fieldMatches) {
    const { field, pattern, flags } = condition.fieldMatches;
    return new RegExp(pattern, flags ?? "i").test(item.get(field));
  }

  if (condition.textMatches) {
    return toRegExp(condition.textMatches).test(item.allText());
  }

  if (Object.prototype.hasOwnProperty.call(condition, "hasTag")) {
    return item.tags.includes(condition.hasTag);
  }

  if (Object.prototype.hasOwnProperty.call(condition, "quantityLessThan")) {
    const quantity = item.quantity();
    return !Number.isFinite(quantity) || quantity < Number(condition.quantityLessThan);
  }

  if (condition.quantityNotInteger === true) {
    const quantity = item.quantity();
    return !Number.isInteger(quantity);
  }

  throw new Error(`Unsupported condition: ${JSON.stringify(condition)}`);
}
