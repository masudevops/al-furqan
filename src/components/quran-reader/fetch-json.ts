export const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw payload;
  return payload as T;
};
