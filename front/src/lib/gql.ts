const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function gqlRequest<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json()

  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error')
  }

  return json.data as T
}
