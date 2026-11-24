# NEON TIDE

[![make.fun gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/)
[![rank](https://make.fun/badge/gta6-01/BearSama1/makefun-gta6-original/rank.svg)](https://make.fun/)
[![reward](https://make.fun/badge/gta6-01/BearSama1/makefun-gta6-original/reward.svg)](https://make.fun/)

An offline, self-contained, top-down arcade game set in an original neon
harbour city on the night a typhoon makes landfall. You carry emergency
medical supplies from the harbour to the hospital while the flood rises —
**take the fast flooded canal route, or the long safe hillside route.**

## Run it

Requires Node.js **22.18+** (the servers use built-in TypeScript type
stripping, so `serve.ts` and `main.ts` run directly — no build step, no
dependencies).

### Play (preview server)

```bash
node serve.ts            # serves ./game on http://localhost:8080
node serve.ts --port 3000
```

Binds to `127.0.0.1` only and never auto-opens a browser — open
`http://localhost:8080` yourself. Any static file server works equally
well; the game is a single self-contained file with zero network requests.

### Package (contest runner)

```bash
node main.ts                        # output to MAKEFUN_OUTPUT_DIR or /output
node main.ts --output some/dir
```

Deterministic and offline: copies `game/` and any genuine `screenshots/`
into the output directory and writes `dossier.json` there via the
vendored `buildDossier` (caps matching the official starter's gate:
text 163840 bytes, screenshots max 4 × 262144 bytes, game 993 files /
50331648 bytes / 1000-byte paths). Never listens, spawns, fetches,
installs, publishes, or submits. `npm run package` does the same.

**Screenshots are never fabricated.** `main.ts` only copies real PNG/JPEG
captures from `./screenshots/`; when there are none, it says so and
writes no `dossier.json`. See "Genuine captures" below.

## How to play

| Input | Action |
|---|---|
| WASD / arrows | move on foot / drive |
| SHIFT | sprint (stamina) |
| F | enter / exit nearby vehicle |
| E | interact: pick up supplies, deliver, rescue cats, grab lanterns, raid customs carts |
| SPACE | brake (in car) |
| P | pause |
| M | mute |
| R | quick restart (after win/loss) |
| C | continue saved run (title screen) |

### The loop

1. **On foot from the harbour.** Sprinting drains stamina; wading through
   floodwater is slow and deep water on foot is deadly.
2. **Pick up the supplies** at the Typhoon Spire (yellow blip).
3. **Choose a route** — the minimap shows both: cyan (fast, through the
   flooded canal districts) and green (safe, around the hillside). The
   choice is recorded when you cross the Lantern Bridge or swing north.
4. **Deliver** to Mercy Ridge Hospital before the timer runs out.
5. **Quick restart (R)** resets the run with the same city (seeded RNG —
   identical layout every run, fair comparison between attempts) while
   keeping your landmark discoveries.

### The core tension

- **Fast route (canal):** shorter, but the districts around the canal are
  low-lying and flood first. Deep water stalls the engine in ~2 seconds
  and wading on foot soaks the supplies. There's a risk bonus if you take
  it and survive.
- **Safe route (hillside):** longer, stays dry, but the timer keeps
  ticking and the typhoon keeps pushing the tide in.

### Side activities

- **7 landmarks** to discover (harbour depot, hospital, Typhoon Spire,
  Lantern Bridge, fish market, Storm Shrine, Lucky Cat Arcade) —
  discoveries persist across restarts.
- **6 storm cats** to rescue (bonus at delivery, on-foot E near them).
- **16 storm lanterns** to collect (+speed each, cargo protection flavor).
- **Customs carts** (optional arcade mischief, purely fictional): press E
  near a striped cart to raid it. Your wanted stars (★★★) rise, one
  harbour patrol cart spawns and chases arcade-style, and the heat clears
  predictably — break ~430 m away for 4 s, or simply wait out the decay.
  The patrol can side-swipe you (a harmless shake) but never damages
  cargo, blocks the route, or fails the mission. The legal relief
  delivery is fully playable without ever touching a cart.
- **Ambient traffic** drives the road grid on the correct lanes, brakes
  for you and each other, and avoids deep floodwater.

### Save / continue

The run auto-saves to `localStorage` every ~5 s. The title screen offers
**C — continue** (with a summary of the saved run) next to a fresh start.
The save clears when a run ends (won or lost), a stale/dead save is
refused, and if storage is blocked the game simply notes it and plays
normally — no errors, no disruption to start or restart.

## Scoring

Base $1200 + supplies-intact bonus (up to $600) + time remaining + route
risk bonus (fast route only) + $90 per cat. Loss states: time out, cargo
soaked through, drowned on foot, van flooded.

## Genuine captures (what remains before submission)

The entry needs 3–4 real renders of the game before `node main.ts` can
write a complete `dossier.json`:

1. Play `node serve.ts` in desktop Chrome
2. Capture 3 or 4 actual gameplay screenshots (title screen plus
   gameplay — on foot, driving, and a route choice make a good set),
   PNG or JPEG, each under 256 KiB, the first by name the cover
3. Save them into `./screenshots/` (e.g. `1-title.png`, `2-street.png`,
   `3-driving.png`, `4-route.png`)
4. Run `node main.ts` — it copies them to the output directory and
   writes `dossier.json`

Until then, `main.ts` packages the game, reports that no genuine
screenshots exist, and writes no dossier. Nothing is faked, and nothing
is written into `screenshots/` by any tooling.

### Shortest exact paths to three distinct capture states

With `node serve.ts` open in Chrome (intro skips with a click or ENTER):

**State 1 — typhoon-night street level (on foot, ~40 s):**
1. Click/ENTER past the title, click again to skip the intro
2. Walk west along the harbour road (A / ←) with traffic and rain around
   you; the first customs cart sits at the roadside ~350 m north (orange
   dot on the minimap)
3. Capture on the sidewalk with neon buildings, traffic and the tide
   meter visible

**State 2 — driving with the route choice (~2 min):**
1. From the start, walk/DASH north to the Typhoon Spire (yellow blip,
   ~1000 m: sprint SHIFT up the vertical roads; or F into any parked car
   and drive)
2. Press E at the spire plaza — supplies loaded, timer starts, both
   routes appear on the minimap (cyan = fast canal, green = safe
   hillside)
3. F into the yellow delivery van parked at the plaza and drive —
   capture with the compass, timer, cargo bar, both route lines and the
   speedometer on screen

**State 3 — wanted stars + patrol (optional arcade, ~1 min):**
1. From the start, raid the customs cart at (3390, 3160) — press E at
   the striped cart ~350 m north of the spawn (orange minimap dot)
2. Wanted ★★★ appears top-right, one white-and-blue patrol cart spawns
   and chases (red blip on the minimap)
3. Capture mid-chase; then either break 430 m away for 4 s or wait ~25 s
   and capture the "patrol gave up" message as the stars fade

### Test steps (manual, in desktop Chrome)

1. **Enter/exit vehicle**: F near the van at the spire plaza (state
   changes walk↔drive, engine sound starts/stops, exiting never traps
   you inside a building)
2. **Side exploration**: discover each landmark (walk/drive into its
   radius — discovery toast + chime); rescue a cat and collect a lantern
   with E
3. **Both routes, full deliveries**:
   - *Fast*: after loading supplies, drive west to x=1800, north across
     the Lantern Bridge (y≈1800, between x=1100–1560) — "FAST ROUTE"
     banner; continue west to the hospital (600, 1800) and press E.
     Confirm the win screen shows route FAST and a risk bonus.
   - *Safe*: after loading, drive north past y<1150 with x>2200 — "SAFE
     ROUTE" banner; follow the green line west then south to the
     hospital, press E. Confirm route SAFE, no risk bonus.
4. **Optional patrol layer**: raid a cart (E), confirm ★★★ + patrol
   spawn; verify the patrol never damages cargo or blocks road passage;
   break away >430 m for 4 s and confirm "the patrol gave up — heat
   fading" and stars decaying to zero; confirm the mission timer and
   route markers were never interrupted
5. **Save/reload**: mid-run (supplies aboard, both routes shown), reload
   the page — title screen offers "C — continue saved run (…)" with the
   correct summary; press C and confirm position, cargo, timer, route
   choice and discoveries restored; win or lose a run and reload — no
   continue offered (save cleared); with storage blocked (site data
   blocked in Chrome settings), confirm the game notes it and plays
   normally
6. **Quick restart**: after a win/loss, R starts a fresh run with the
   identical city layout (same carts, cats, lanterns), heat layer empty
7. **Packaging**: `node main.ts` with no `screenshots/` — copies game/,
   reports missing captures, writes no dossier.json; add genuine PNGs
   and re-run — dossier.json appears; run twice and compare bytes

## Files

- `game/index.html` — the entire game (self-contained, offline, original assets)
- `serve.ts` — localhost-only preview server (development convenience)
- `main.ts` — deterministic packager: copies game/ + genuine screenshots/,
  writes dossier.json (Node 22.18+, core modules only)
- `vendor/makefun-game.ts` — the official make.fun dossier library (unmodified)
- `package.json`, `LICENSE` (MIT), `README.md`

## License

MIT — see [LICENSE](LICENSE).
