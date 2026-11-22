/** Use a finite numeric input or the caller's explicit fallback. */
export function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, finiteOr(value, min)));
}

/** A bounded percentage, including ranges whose finite endpoints overflow subtraction. */
export function toPercent(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  const current = clamp(value, min, max);
  const span = max - min;
  const share = Number.isFinite(span)
    ? (current - min) / span
    : (current / 2 - min / 2) / (max / 2 - min / 2);
  return clamp(share * 100, 0, 100);
}

export function roundToStep(value: number, step: number, min = 0): number {
  const increment = finiteOr(step, 1);
  if (increment <= 0) return finiteOr(value, min);
  const result = min + Math.round((finiteOr(value, min) - min) / increment) * increment;
  return Number.isFinite(result) ? Number(result.toPrecision(15)) : finiteOr(value, min);
}

function decimalParts(value: number): { coefficient: bigint; exponent: number } {
  const [mantissa = "", power = "0"] = String(value).split("e");
  const [whole = "", fraction = ""] = mantissa.split(".");
  return { coefficient: BigInt(whole + fraction), exponent: Number(power) - fraction.length };
}

/** Align the decimal operands so only the final sum is converted back to a number. */
export function addDecimalStep(value: number, step: number): number {
  const sum = value + step;
  if (!Number.isFinite(sum) || (Number.isInteger(value) && Number.isInteger(step))) return sum;
  const current = decimalParts(value);
  const increment = decimalParts(step);
  const exponent = Math.min(current.exponent, increment.exponent);
  const coefficient = current.coefficient * 10n ** BigInt(current.exponent - exponent)
    + increment.coefficient * 10n ** BigInt(increment.exponent - exponent);
  return Number(`${coefficient}e${exponent}`);
}
