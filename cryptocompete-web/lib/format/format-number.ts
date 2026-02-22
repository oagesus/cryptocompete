import Decimal from "decimal.js-light";

export function getLocaleSeparators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.89);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  return { group, decimal };
}

export function sanitizeInput(value: string, groupSep: string, decimalSep: string, currentValue?: string): string | null {
  const otherSep = decimalSep === "." ? "," : ".";

  const hasExistingDecimal = value.includes(decimalSep);
  let cleanValue = value;

  if (!hasExistingDecimal && cleanValue.includes(otherSep)) {
    const otherCount = (cleanValue.match(new RegExp(`\\${otherSep}`, "g")) || []).length;
    if (otherCount === 1) {
      cleanValue = cleanValue.replace(otherSep, decimalSep);
    }
  }

  const groupRegex = new RegExp(`\\${groupSep}`, "g");
  cleanValue = cleanValue.replace(groupRegex, "");

  const allowedRegex = new RegExp(`^[0-9\\${decimalSep}]*$`);
  if (!allowedRegex.test(cleanValue)) return null;
  const decimalRegex = new RegExp(`\\${decimalSep}`, "g");
  if ((cleanValue.match(decimalRegex) || []).length > 1) return null;

  const newDigitCount = cleanValue.replace(new RegExp(`\\${decimalSep}`, "g"), "").length;
  const prevDigitCount = currentValue ? currentValue.replace(/[^0-9]/g, "").length : 0;

  if (newDigitCount > 20 && newDigitCount > prevDigitCount) return null;

  return cleanValue.replace(decimalSep, ".");
}

export function formatInputNumber(value: string, groupSep: string, decimalSep: string): string {
  if (!value || value === ".") return value.replace(".", decimalSep);

  const parts = value.split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);

  if (parts.length === 2) {
    return `${formattedInteger}${decimalSep}${decimalPart}`;
  }
  return formattedInteger;
}

export function formatInputNumberRaw(value: string, decimalSep: string): string {
  if (!value || value === ".") return value.replace(".", decimalSep);
  return value.replace(".", decimalSep);
}

export function formatRawAmount(raw: string, groupSep: string, decimalSep: string, decimals: number, trimZeros: boolean = false): string {
  const parts = raw.split(".");
  const integerPart = parts[0];
  let decimalPart = (parts[1] ?? "").padEnd(decimals, "0").slice(0, decimals);
  if (trimZeros) {
    decimalPart = decimalPart.replace(/0+$/, "");
  }
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSep);
  if (!decimalPart) return formattedInteger;
  return `${formattedInteger}${decimalSep}${decimalPart}`;
}

function isValidDecimal(value: string): boolean {
  if (!value || value === ".") return false;
  return isFinite(parseFloat(value));
}

export function isGreaterThanRaw(a: string, b: string): boolean {
  if (!isValidDecimal(a) || !isValidDecimal(b)) return false;
  return new Decimal(a).gt(new Decimal(b));
}

export function isLessThanRaw(a: string, b: string): boolean {
  if (!isValidDecimal(a) || !isValidDecimal(b)) return false;
  return new Decimal(a).lt(new Decimal(b));
}

export function divideDecimalRaw(numerator: string, denominator: string, precision: number): string {
  if (!isValidDecimal(numerator) || !isValidDecimal(denominator) || denominator === "0") return "0";
  return new Decimal(numerator).div(new Decimal(denominator)).toFixed(precision);
}

export function multiplyDecimalRaw(a: string, b: string, precision: number): string {
  if (!isValidDecimal(a) || !isValidDecimal(b)) return "0";
  return new Decimal(a).mul(new Decimal(b)).toFixed(precision);
}

export function getPriceDecimals(price: number): number {
  if (price >= 10) return 2;
  if (price >= 0.01) return 6;
  return 8;
}