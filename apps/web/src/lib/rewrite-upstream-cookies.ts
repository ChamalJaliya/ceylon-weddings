const DROP = new Set(["domain", "samesite", "secure"]);

/** Scope upstream Set-Cookie to this host so Safari will store it. */
export function rewriteSetCookie(header: string, secure: boolean): string {
  const parts = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      const name = part.split("=")[0]?.trim().toLowerCase();
      return Boolean(name) && !DROP.has(name);
    });
  parts.push("SameSite=Lax");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
