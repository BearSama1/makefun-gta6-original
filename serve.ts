/**
 * NEON TIDE — local preview server (development convenience only).
 *
 *     node serve.ts
 *     node serve.ts --port 3000
 *
 * Serves ./game as static files, bound to localhost only. It never
 * opens a browser and never touches the network beyond that loopback
 * listener. The game itself makes no network requests of any kind;
 * any static file server works equally well.
 *
 * This is NOT the contest runner — see main.ts for the deterministic
 * packager that produces the output directory and dossier.json.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname ?? ".", "game");

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const PORT = Number(
  portArg !== -1 && args[portArg + 1] ? args[portArg + 1] : process.env.PORT ?? 8080
);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

function send(res: ServerResponse, status: number, body: string | Buffer, type: string): void {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(body);
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    // Only GET/HEAD; ignore query strings entirely.
    if (req.method !== "GET" && req.method !== "HEAD") {
      send(res, 405, "Method Not Allowed", "text/plain; charset=utf-8");
      return;
    }

    // Resolve the requested path inside ./game and refuse anything that
    // tries to escape the game directory (e.g. /../main.ts).
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const filePath = normalize(join(ROOT, pathname));
    if (!filePath.startsWith(ROOT + sep) && filePath !== ROOT) {
      send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
    if (req.method === "HEAD") {
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end();
    } else {
      send(res, 200, data, type);
    }
  } catch {
    send(res, 404, "404 Not Found", "text/plain; charset=utf-8");
  }
});

// Localhost only: the preview is for the machine running it, nobody else.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`NEON TIDE preview — serving ${ROOT}`);
  console.log(`  ->  http://localhost:${PORT}   (open it yourself; Ctrl+C to stop)`);
});
