import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatAsMoney(
  number: number,
  locale = "en-US",
  currencyCode = "USD",
  additionalOptions = {},
) {
  if (typeof number !== "number" || isNaN(number)) {
    console.error("Invalid input: 'number' must be a valid number.");
    return "Invalid input";
  }

  const defaultOptions = {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };

  if (number % 1 === 0) {
    defaultOptions.minimumFractionDigits = 0;
    defaultOptions.maximumFractionDigits = 0;
  } else {
    defaultOptions.minimumFractionDigits = 2;
  }

  const formatter = new Intl.NumberFormat(locale, {
    ...additionalOptions,
  });

  return formatter.format(number);
}
