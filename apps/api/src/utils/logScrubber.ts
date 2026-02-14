/**
 * Scrub PII/PHI from log messages. Never log raw emails, names, IDs in production.
 */
const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{10,}\b/g, // Phone-like numbers
];

export function scrubMessage(msg: string): string {
  let out = msg;
  for (const re of PII_PATTERNS) {
    out = out.replace(re, '[REDACTED]');
  }
  return out;
}

export function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {};
  const sensitiveKeys = ['email', 'password', 'ssn', 'phone', 'token', 'secret'];
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some((sk) => k.toLowerCase().includes(sk))) {
      scrubbed[k] = '[REDACTED]';
    } else if (typeof v === 'string') {
      scrubbed[k] = scrubMessage(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      scrubbed[k] = scrubObject(v as Record<string, unknown>);
    } else {
      scrubbed[k] = v;
    }
  }
  return scrubbed;
}
