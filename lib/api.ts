const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ReferenceOption = {
  id: string;
  value: string;
  label: string;
  name?: string;
  raw?: unknown;
};

export async function apiFetch(path: string, options?: RequestInit) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL belum diatur di .env.local");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API error ${res.status}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export async function fetchReferenceOptions(resource: string): Promise<string[]> {
  const data = await apiFetch(`/references/${resource}`);

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: ReferenceOption | string) => {
      if (typeof item === "string") {
        return item;
      }

      return item.label || item.name || item.value;
    })
    .filter(Boolean);
}

export async function fetchReferenceOptionItems(resource: string): Promise<ReferenceOption[]> {
  const data = await apiFetch(`/references/${resource}`);

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: ReferenceOption | string) => {
      if (typeof item === "string") {
        return {
          id: item,
          value: item,
          label: item,
          name: item,
        };
      }

      const label = item.label || item.name || item.value;

      return {
        ...item,
        id: item.id || item.value,
        value: item.value || item.id,
        label,
        name: item.name || label,
      };
    })
    .filter((item) => item.value && item.label);
}

export async function fetchManyReferences(resources: string[]) {
  const entries = await Promise.all(
    resources.map(async (resource) => {
      return [resource, await fetchReferenceOptions(resource)] as const;
    })
  );

  return Object.fromEntries(entries) as Record<string, string[]>;
}

export async function fetchManyReferenceOptionItems(resources: string[]) {
  const entries = await Promise.all(
    resources.map(async (resource) => {
      return [resource, await fetchReferenceOptionItems(resource)] as const;
    })
  );

  return Object.fromEntries(entries) as Record<string, ReferenceOption[]>;
}
