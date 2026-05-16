import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.join(__dirname, "..", "..");

export const uploadDir = path.join(serverRoot, "uploads");
export const outputDir = path.join(serverRoot, "output");

export const ensureStorageDirs = () => {
  [uploadDir, outputDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export const toPublicUrl = (folder, filename) => {
  const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl.replace(/\/$/, "")}/${folder}/${filename}`;
};
