/**
 * NEON TIDE — deterministic contest packager.
 *
 *     node main.ts
 *     node main.ts --output some/dir
 *
 * Copies ./game and any genuine screenshots/ into MAKEFUN_OUTPUT_DIR or
 * /output, then writes dossier.json there via the vendored buildDossier.
 *
 * Hard guarantees:
 *   - terminates quickly (a bounded directory copy and two writes)
 *   - never listens, never spawns a subprocess, never fetches, never
 *     installs, never publishes or submits anything
 *   - deterministic: same input tree, same output bytes
 *   - copies only real files that exist; invents nothing
 *
 * Screenshots policy (the no-fabrication rule): screenshots/ must hold
 * genuine renders captured from a real browser. This program only ever
 * copies real files from ./screenshots if that directory exists, and
 * tells you when there are none. It never creates, fakes, or writes
 * placeholder images, and never writes anything into a screenshots/
 * directory. When no genuine screenshots exist, dossier.json is not
 * written and the run explains exactly what is missing.
 *
 * The caps below match the official starter's gate.json exactly:
 *   text_max_bytes 163840, screenshots {max 4, max_bytes 262144},
 *   game_max_files 993, game_max_bytes 50331648, game_path_max_bytes 1000.
 * buildDossier refuses input past them, so this program fails where the
 * scorer would, before anything is handed in.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { buildDossier, DossierError } from "./vendor/makefun-game.ts";

// ---------------------------------------------------------------- options

const args = process.argv.slice(2);
const outArg = args.indexOf("--output");
const OUTPUT_DIR = resolve(
  outArg !== -1 && args[outArg + 1] ? args[outArg + 1]
    : process.env.MAKEFUN_OUTPUT_DIR ?? "/output"
);

const ROOT = import.meta.dirname ?? ".";
const GAME_DIR = join(ROOT, "game");
const SHOTS_DIR = join(ROOT, "screenshots");
const OUT_GAME = join(OUTPUT_DIR, "game");
const OUT_SHOTS = join(OUTPUT_DIR, "screenshots");
const OUT_DOSSIER = join(OUTPUT_DIR, "dossier.json");

/** The official starter's gate.json caps, exactly. */
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

// ---------------------------------------------------------------- helpers

function fail(message: string, code = 1): never {
  console.error(`main.ts: ${message}`);
  process.exitCode = code;
  process.exit(code);
}

/** A pre-copy sanity count of what will land in the output game tree. */
function countTree(dir: string): { entries: number; bytes: number } {
  let entries = 0;
  let bytes = 0;
  const walk = (d: string): void => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      entries++;
      if (e.isDirectory()) walk(join(d, e.name));
      else bytes += statSync(join(d, e.name)).size;
    }
  };
  walk(dir);
  return { entries, bytes };
}

/** Genuine screenshots found in ./screenshots: regular files, dotfiles skipped, PNG/JPEG only. */
function genuineScreenshots(dir: string): string[] {
  const found: string[] = [];
  let names: string[];
  try {
    names = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort();
  } catch {
    return found;
  }
  for (const name of names) {
    const bytes = readFileSync(join(dir, name));
    const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (isPng || isJpeg) found.push(name);
    else console.warn(`main.ts: ignoring screenshots/${name}: neither a PNG nor a JPEG (not copied)`);
  }
  return found;
}

import { readFileSync } from "node:fs";

// ---------------------------------------------------------------- go

mkdirSync(OUTPUT_DIR, { recursive: true });

if (!existsSync(GAME_DIR)) fail(`no game/ directory at ${GAME_DIR}: nothing to package`);

// 1. game/: a plain recursive copy of real files. If game/ somehow holds a
//    symbolic link or special file, the copy stops there and the vendor's
//    readGameTree (called by buildDossier below) would refuse it anyway.
const { entries, bytes } = countTree(GAME_DIR);
if (entries > CAPS.game_max_files) {
  fail(`game/: ${entries} entries, over the ${CAPS.game_max_files} allowed (game_max_files)`);
}
if (bytes > CAPS.game_max_bytes) {
  fail(`game/: ${bytes} bytes, over the ${CAPS.game_max_bytes} allowed (game_max_bytes)`);
}
cpSync(GAME_DIR, OUT_GAME, { recursive: true, verbatimSymlinks: false });

// 2. screenshots/: copy only genuine, existing captures. Never fabricate.
const shots = genuineScreenshots(SHOTS_DIR);
if (existsSync(SHOTS_DIR)) {
  if (shots.length === 0) {
    console.warn("main.ts: screenshots/ exists but holds no PNG or JPEG: nothing copied");
  } else {
    mkdirSync(OUT_SHOTS, { recursive: true });
    for (const name of shots) {
      cpSync(join(SHOTS_DIR, name), join(OUT_SHOTS, name));
      const size = statSync(join(SHOTS_DIR, name)).size;
      if (size > CAPS.screenshots.max_bytes) {
        fail(`screenshots/${name} is ${size} bytes, over the ${CAPS.screenshots.max_bytes} allowed (screenshots.max_bytes)`);
      }
    }
  }
} else {
  console.log("main.ts: no screenshots/ directory yet: run #1 (the game) is complete; genuine captures are still needed");
}

// 3. dossier.json via the vendor, with the starter's exact caps.
if (shots.length < 1) {
  console.log(
    "main.ts: no genuine screenshots found: dossier.json not written.\n" +
    "         Capture 3 or 4 real renders of the game (PNG or JPEG, the first by name the cover),\n" +
    "         place them in ./screenshots/, and run node main.ts again."
  );
} else if (shots.length > CAPS.screenshots.max) {
  fail(`screenshots/: ${shots.length} images, over the ${CAPS.screenshots.max} allowed (screenshots.max)`);
} else {
  try {
    const dossier = buildDossier(OUTPUT_DIR, CAPS);
    writeFileSync(OUT_DOSSIER, dossier);
    console.log(`main.ts: wrote ${OUT_DOSSIER} (${dossier.length} bytes)`);
  } catch (err) {
    if (err instanceof DossierError) {
      fail(`buildDossier refused the entry: ${err.message}${err.limit ? ` (limit: ${err.limit})` : ""}`);
    }
    throw err;
  }
}

console.log(`main.ts: output in ${OUTPUT_DIR}`);
console.log(`         game/        ${entries} entries, ${bytes} bytes (caps: ${CAPS.game_max_files} entries, ${CAPS.game_max_bytes} bytes)`);
console.log(`         screenshots/ ${shots.length} genuine image${shots.length === 1 ? "" : "s"} copied`);
console.log(`         dossier.json ${existsSync(OUT_DOSSIER) ? "written" : "not written (no genuine screenshots yet)"}`);

process.exit(0);
