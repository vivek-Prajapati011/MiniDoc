import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const STORAGE_PATH = path.resolve(path.join(__dirname, "../Storage"));

// Securely resolve and validate path
export function getSafePath(relPath = "") {
  const fullPath = path.resolve(path.join(STORAGE_PATH, relPath));
  if (!fullPath.startsWith(STORAGE_PATH)) {
    throw new Error("Invalid path (path traversal attempt detected)");
  }
  return fullPath;
}
