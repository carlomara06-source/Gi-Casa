// Server-side contact redaction for chat messages — ported 1:1 from the
// prototype's pushChat() regexes so phone numbers and emails never reach
// the database, not just the UI.

const PHONE_RE = /(\+?\d[\d\s.-]{7,}\d)/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;

export function containsContactInfo(text: string): boolean {
  return PHONE_RE.test(text) || EMAIL_RE.test(text);
}

export function redactContactInfo(text: string): { body: string; wasRedacted: boolean } {
  let redacted = false;
  const body = text
    .replace(PHONE_RE, () => {
      redacted = true;
      return "••• nascosto •••";
    })
    .replace(EMAIL_RE, () => {
      redacted = true;
      return "••• nascosto •••";
    });
  return { body, wasRedacted: redacted };
}
