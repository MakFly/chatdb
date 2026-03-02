const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "API Error");
  }

  return res.json();
}

export const api = {
  conversations: {
    list: () => fetchAPI("/api/v1/conversations"),
    get: (id: string) => fetchAPI(`/api/v1/conversations/${id}`),
    create: (title: string) =>
      fetchAPI("/api/v1/conversations", {
        method: "POST",
        body: JSON.stringify({ title }),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/v1/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI(`/api/v1/conversations/${id}`, { method: "DELETE" }),
    search: (q: string) =>
      fetchAPI(`/api/v1/conversations/search?q=${encodeURIComponent(q)}`),
  },
  models: {
    list: () => fetchAPI("/api/v1/models"),
  },
  providers: {
    list: () => fetchAPI("/api/v1/providers"),
    update: (id: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/v1/providers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  chat: {
    executeMutation: (connectionId: string, query: string) =>
      fetchAPI("/api/v1/chat/execute-mutation", {
        method: "POST",
        body: JSON.stringify({ connectionId, query }),
      }),
  },
  connections: {
    list: () => fetchAPI("/api/v1/connections"),
    create: (data: {
      name: string;
      host: string;
      port?: number;
      database: string;
      username: string;
      password: string;
      sslEnabled?: boolean;
    }) =>
      fetchAPI("/api/v1/connections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      fetchAPI(`/api/v1/connections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchAPI(`/api/v1/connections/${id}`, { method: "DELETE" }),
    test: (id: string) =>
      fetchAPI(`/api/v1/connections/${id}/test`, { method: "POST" }),
    analyze: (id: string) =>
      fetchAPI(`/api/v1/connection-analysis/${id}/analyze`, { method: "POST" }),
  },
  auditAnalytics: {
    get: () => fetchAPI("/api/v1/audit-analytics"),
  },
  suggestions: {
    get: (connectionId: string) =>
      fetchAPI(`/api/v1/suggestions?connectionId=${encodeURIComponent(connectionId)}`),
  },
  prompts: {
    list: () => fetchAPI("/api/v1/prompts"),
    get: (slug: string) => fetchAPI(`/api/v1/prompts/${slug}`),
    update: (slug: string, content: string) =>
      fetchAPI(`/api/v1/prompts/${slug}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      }),
    reset: (slug: string) =>
      fetchAPI(`/api/v1/prompts/${slug}/reset`, { method: "POST" }),
  },
};
