const BASE = "http://127.0.0.1:8000";

export default function makeFullUrl(path) {
  if (!path) return null;

  if (path.startsWith("http")) return path;

  if (!path.startsWith("/")) path = "/" + path;

  return BASE + path;
}
