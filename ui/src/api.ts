export type Memory = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const BASE_PATH = "/api/memories";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Unknown error");
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

/** Creates a new memory with the given data. The server generates the ID and timestamps. */
export async function createMemory(memory: Omit<Memory, "id" | "createdAt" | "updatedAt">): Promise<Memory> {
  const res = await fetch(BASE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memory),
  });
  return handleResponse(res);
}

/**
 * List all memories, optionally filtering by search term and/or tags.
 * e.g. search request: `GET /api/memories?search=hello&tags=work,personal`
 */
export async function listMemories(search?: string, tags?: string[]): Promise<Memory[]> {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (tags?.length) params.append("tags", tags.join(","));

  const res = await fetch(`${BASE_PATH}?${params.toString()}`);
  return handleResponse(res);
}

/** Update an existing memory by ID. Only the provided fields are updated; others remain unchanged. */
export async function updateMemory(
  id: string,
  data: Partial<Omit<Memory, "id" | "createdAt" | "updatedAt">>,
): Promise<Memory> {
  const res = await fetch(`${BASE_PATH}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

/** Delete a memory by ID. Returns no content on success. */
export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${BASE_PATH}/${id}`, { method: "DELETE" });
  await handleResponse(res);
}
