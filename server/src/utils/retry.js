export async function withRetry(fn, { retries = 3, baseMs = 50, label = "operation" } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const transient =
        e?.code === "P2034" ||
        e?.code === "P1008" ||
        /timeout|deadlock|ECONNRESET|EAI_AGAIN/i.test(String(e?.message || ""));
      if (!transient || attempt === retries - 1) throw e;
      const delay = baseMs * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
