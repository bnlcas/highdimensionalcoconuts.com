# Art Blaster! leaderboard

GitHub Pages only serves static files, so high scores live in a tiny Cloudflare Worker with a
D1 (SQLite) database. Both are on Cloudflare's free tier. Until it's deployed, the game keeps a
local leaderboard in each browser.

## Deploy (about 5 minutes)

```sh
cd Work/ArtBlaster/leaderboard
npx wrangler login                         # opens a browser to sign in to Cloudflare
npx wrangler d1 create art-blaster         # prints a database_id
# paste that id into wrangler.toml (database_id = "...")
npx wrangler d1 execute art-blaster --remote --file=schema.sql
npx wrangler secret put SALT               # any random string; used to hash IPs for rate limiting
npx wrangler deploy                        # prints https://art-blaster-leaderboard.<you>.workers.dev
```

Then set `LEADERBOARD_URL` at the top of `../src/leaderboard.js` to that URL (no trailing slash),
commit, and push.

## What it checks

- Only timed runs, with a whole-dollar bill no bigger than the entire museum (`MAX_BILL`).
- Names are cleaned (no control characters or angle brackets) and cut to 18 characters.
  Words in `BLOCKLIST` turn a name into "Anonymous Billionaire".
- One submission per IP every 20 seconds. IPs are stored only as salted hashes.
- POSTs are accepted only from the origins in `ALLOWED_ORIGINS`.

A static game can't prove a score is real, so a determined cheater could still post a fake one.
This keeps out the obvious junk. To remove a score:

```sh
npx wrangler d1 execute art-blaster --remote --command "DELETE FROM scores WHERE id = 123"
npx wrangler d1 execute art-blaster --remote --command "SELECT id, name, bill FROM scores ORDER BY bill DESC LIMIT 30"
```

## Test locally

`node test.mjs` runs the Worker against Node's built-in SQLite (Node 22+).
