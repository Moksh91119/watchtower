const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiOptions = RequestInit & {
  token?: string | null;
};

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(options.headers);

  if (fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong";

    try {
      const data = await response.json();

      if (typeof data.error === "string") {
        message = data.error;
      }
    } catch {
      // Ignore invalid error responses.
    }

    const error = new Error(message);

    (error as Error & { status?: number }).status = response.status;

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
