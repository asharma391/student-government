import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import "./build.mjs";
const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
};
const port = Number.parseInt(process.env.PORT || "4173", 10);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const target = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!target.startsWith(root + "/")) {
      res.writeHead(403).end();
      return;
    }
    const content = await readFile(target);
    res
      .writeHead(200, {
        "Content-Type": mime[extname(target)] || "application/octet-stream",
        "Cache-Control": "no-store",
      })
      .end(content);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`Local: http://127.0.0.1:${port}`),
);
