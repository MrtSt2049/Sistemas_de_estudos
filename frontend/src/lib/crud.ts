import { apiRequest } from "@/lib/api-client";

export interface Page<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

/** Monta a query string ignorando filtros vazios. */
export function toQuery(params: QueryParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

/** Percorre todas as páginas; use somente em listas pequenas (cadastros de referência). */
export async function fetchAll<T>(path: string, params: QueryParams = {}): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const query = toQuery({ ...params, page, page_size: 100 });
    const result = await apiRequest<Page<T>>(`${path}${query}`);
    items.push(...result.results);
    if (!result.next) return items;
  }
}
