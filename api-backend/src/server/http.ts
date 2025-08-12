export class HttpError extends Error {
  constructor(public status: number, public body: unknown, public url: string) {
    super(`HTTP ${status} for ${url}`);
  }
}

export async function fetchJSON<T = unknown>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 30000);

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? safeParse(text) : undefined;

    if (!res.ok) {
      throw new HttpError(res.status, data ?? text, url);
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}


