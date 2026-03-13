const ROUTE_SLUG_OVERRIDES: Record<string, string> = {
  Dashboard: "",
};

function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export function createPageUrl(pageName: string) {
  const override = ROUTE_SLUG_OVERRIDES[pageName];
  const slug = override !== undefined ? override : toKebabCase(pageName);
  return `/${slug}`.replace(/\/+$/, "") || "/";
}
