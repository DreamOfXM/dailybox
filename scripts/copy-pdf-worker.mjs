// 构建/开发前把 pdfjs 的 worker 复制到 public/，供 PDF 转图片在静态站点下按 BASE_PATH 加载。
// 该产物被 .gitignore 忽略，不入库；npm 会在 dev/build 前自动执行（predev/prebuild）。
import { copyFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = resolve(root, "public/pdf.worker.min.mjs");

if (existsSync(src)) {
  copyFileSync(src, dest);
  console.log("[copy-pdf-worker] public/pdf.worker.min.mjs ready");
} else {
  console.warn("[copy-pdf-worker] 未找到 pdfjs worker，PDF 转图片可能不可用（先 npm install）");
}
