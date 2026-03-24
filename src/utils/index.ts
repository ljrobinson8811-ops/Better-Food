export function createPageUrl(pageName: string) {
    const raw = String(pageName || "").trim();
  
    if (!raw) {
      return "/";
    }
  
    if (raw.startsWith("/")) {
      return raw;
    }
  
    const [pathPart, queryPart = ""] = raw.split("?");
    const normalizedPath = pathPart.replace(/ /g, "-");
  
    return queryPart ? `/${normalizedPath}?${queryPart}` : `/${normalizedPath}`;
  }