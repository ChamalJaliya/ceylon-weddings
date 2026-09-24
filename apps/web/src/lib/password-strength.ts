export type PasswordStrength = "empty" | "weak" | "fair" | "strong";

export type PasswordChecks = {
  length: boolean;
  mixedCase: boolean;
  number: boolean;
  symbol: boolean;
};

const SYMBOL = /[^A-Za-z0-9]/;

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= 8 && password.length <= 72,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: SYMBOL.test(password),
  };
}

export function passwordStrength(password: string): { score: number; label: PasswordStrength; checks: PasswordChecks } {
  const checks = passwordChecks(password);
  if (!password) {
    return { score: 0, label: "empty", checks };
  }
  const score = Object.values(checks).filter(Boolean).length;
  const label: PasswordStrength = score <= 1 ? "weak" : score <= 3 ? "fair" : "strong";
  return { score, label, checks };
}
