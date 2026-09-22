/** Parses a request body as JSON, returning null instead of throwing on an
 * empty or malformed body (e.g. a duplicate/aborted fetch with no payload). */
export async function readJson(req: Request): Promise<unknown | null> {
  const text = await req.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
