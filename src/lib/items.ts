type ItemsResponse = { subjects: string[]; bodies: string[] };

export async function fetchItems(): Promise<ItemsResponse> {
  try {
    const res = await fetch("/api/items");
    if (!res.ok) return { subjects: [], bodies: [] };
    return (await res.json()) as ItemsResponse;
  } catch {
    return { subjects: [], bodies: [] };
  }
}
