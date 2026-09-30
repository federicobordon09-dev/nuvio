# leadgen

Prospecting tool for vibe-coded sales outreach: find local businesses on
Google, detect which ones **do not have a website**, and generate a
prioritized contact document (Markdown + CSV).

It uses the official **Places API (New)** — the same data behind Google
Maps — so there is no scraping and nothing breaks when Google changes the UI.

## How it works

1. Searches by text (`pizzeria in La Consulta, Mendoza`) or by radius
   (`--lat/--lng/--radius`).
2. Requests only the fields that matter: name, address, phone, rating,
   review count, website, business status.
3. Drops permanently closed places. By default it keeps **only businesses
   with no registered website** (add `--all` to keep everyone).
4. Scores each lead and sorts them:

   | Signal | Points |
   |---|---|
   | No website | +50 |
   | Rating >= 4.0 | +20 |
   | Reviews >= 20 (or >= 5) | +15 (or +8) |
   | Has phone number | +10 |
   | Still operating | +5 |

   Tiers: **Hot** >= 75, **Warm** >= 50, **Low** below that.
5. Writes `leads/<search>_<timestamp>.md` and `.csv`.

## Requirements

- Node.js 18+ (uses native `fetch`; tested on Node 24).
- A Google Cloud project with the **Places API (New)** enabled, billing
  attached, and an API key.

## One-time Google Cloud setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and
   create (or pick) a project.
2. **APIs & Services → Library →** search *Places API (New)* → **Enable**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Restrict the key: *Application restrictions* → HTTP referrers is not
   useful here, so use *API restrictions* → **Places API (New)** only.
5. Export it before running:

   ```powershell
   $env:GOOGLE_PLACES_API_KEY = "AIza..."
   # or keep it in .env (gitignored) and pass --env-file=.env
   ```

## Usage

```powershell
# Offline demo, no key needed
node leadgen.mjs --mock --type pizzeria --near "La Consulta, Mendoza"

# Real search: text mode
node leadgen.mjs --type restaurant --near "Godoy Cruz, Mendoza" --min-rating 4
node leadgen.mjs --q "cafes in Mendoza, Argentina" --max 40

# Real search: radius mode
node leadgen.mjs --type bar --lat -32.92 --lng -68.84 --radius 4000

# Keep businesses that DO have a website too
node leadgen.mjs --type pizzeria --near "Mendoza" --all
```

### Flags

| Flag | Meaning |
|---|---|
| `--q "<text>"` | Free-text search |
| `--type <t> --near "<place>"` | Text search built from type + place |
| `--type <t> --lat --lng [--radius]` | Radius search (meters, default 3000) |
| `--all` | Keep businesses that already have a website |
| `--min-rating <n>` / `--min-reviews <n>` | Drop weak leads |
| `--max <n>` | Max results (default 60; the API returns 20 per page) |
| `--out <dir>` | Output directory (default `./leads`) |
| `--mock` | Run offline with built-in fixtures |

## Costs

Searches bill at the **Pro** SKU because of `websiteUri`/phone/rating
fields: Google's price list includes a free monthly allowance of several
thousand Pro searches, then roughly **USD 32 per 1,000** requests. One run
of this tool costs 1 request per 20 results (a typical 60-result run =
3 requests). See the current
[Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
before relying on the numbers.

## Output

- **Markdown**: summary + sorted table with tier, score, phone, rating,
  reviews, address and a Google Maps link.
- **CSV**: same rows, for spreadsheets/CRMs.

## Limitations (honest ones)

- "Has website" is whatever **Google has registered**. A business whose
  only online presence is an Instagram profile usually counts as
  *having* a website. Open the links and confirm manually before
  discarding a lead.
- In `--mock` mode the map links do not resolve (fake place ids).
- The API does not verify that a listed website is alive — a dead domain
  still counts as *has website*.
