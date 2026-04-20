// Shared GraphQL client utility
const BACKEND = "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("acad_token");
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("acad_token");
  }
}

export async function gql<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BACKEND}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }
  return json.data as T;
}

export async function loginAndGetToken(
  email: string,
  password: string
): Promise<string> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);
  const res = await fetch(`${BACKEND}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Authentication failed");
  }
  const { access_token } = await res.json();
  return access_token;
}
