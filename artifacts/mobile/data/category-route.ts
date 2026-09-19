export function parseCategoryTagOverlayRoute(route: string): {
  categoryId: string;
  tag: string;
  source?: "editorial";
} | null {
  const [path, query = ""] = route.split("?", 2);
  const match = path.match(/^\/category-tag\/([^/]+)\/(.+)$/);
  if (!match) return null;
  const source = query
    .split("&")
    .map((part) => part.split("=", 2))
    .find(([key]) => decodeURIComponent(key) === "source")?.[1];
  return {
    categoryId: decodeURIComponent(match[1]),
    tag: decodeURIComponent(match[2]),
    source: source && decodeURIComponent(source) === "editorial" ? "editorial" : undefined,
  };
}