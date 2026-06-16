# 📸 Tumblr Poster CLI

> CLI tool for posting images to Tumblr via the official Tumblr API. Part of the [Naaza](https://github.com/The-Aetheris) content generation pipeline.
>
> **Upstream:** [quotes-maker](https://github.com/The-Aetheris/quotes-maker) generates quote images → **tumblr-poster** distributes them to Tumblr.

## Features

- 📸 Post images (PNG/JPG/GIF/WEBP) to any Tumblr blog
- 🏷️ Tags support (comma-separated)
- ♿ Alt text for accessibility
- 🔄 OAuth 1.0a authentication via official `tumblr.js` library
- 🧪 Dry-run mode for validation without posting
- 📋 List blogs & check auth status
- 📝 NPF (Neue Post Format) — Tumblr's modern post format

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example → .env and fill in your Tumblr OAuth credentials
cp .env.example .env
# Get credentials: https://www.tumblr.com/oauth/apps → Explore API → Allow → Show keys

# 3. Verify auth
node index.mjs auth --check

# 4. Post an image
node index.mjs post \
  --image ./output/quote.png \
  --caption "Stay hungry, stay foolish" \
  --tags "quotes,motivation,daily" \
  --blog your-blog-name
```

## Usage

### Post an Image

```bash
node index.mjs post \
  --image <path>           # Image file path (required)
  --blog <name>            # Target blog (or set TUMBLR_DEFAULT_BLOG)
  --caption <text>         # Post caption
  --tags <t1,t2,...>       # Comma-separated tags
  --alt-text <text>        # Image alt text (accessibility)
  --dry-run                # Validate without posting
```

### Check Authentication

```bash
node index.mjs auth --check
```

### List Available Blogs

```bash
node index.mjs blogs
```

## Configuration

Create a `.env` file in the project root:

```env
TUMBLR_CONSUMER_KEY=your_consumer_key
TUMBLR_CONSUMER_SECRET=your_consumer_secret
TUMBLR_TOKEN=your_oauth_token
TUMBLR_TOKEN_SECRET=your_oauth_token_secret
TUMBLR_DEFAULT_BLOG=your-blog-name   # optional
```

Get your credentials from [Tumblr OAuth Apps](https://www.tumblr.com/oauth/apps):

1. Register an application (or use existing)
2. Click **"Explore API"** → **"Allow"**
3. Redirect to API console → **"Show keys"**
4. Copy all four keys to `.env`

## Tech Stack

- **Runtime:** Node.js >= 18 (ESM)
- **API Library:** [`tumblr.js`](https://www.npmjs.com/package/tumblr.js) v5 — official Tumblr JS client
- **Post Format:** NPF (Neue Post Format)
- **Auth:** OAuth 1.0a

## Project Structure

```
tumblr-poster/
├── index.mjs           # CLI entry point
├── lib/
│   ├── config.mjs      # .env loader + credential validation
│   ├── client.mjs      # tumblr.js client setup + auth check
│   └── poster.mjs      # NPF photo post logic
├── .env.example        # Credential template
├── .gitignore
├── package.json
└── README.md
```

## Pipeline Integration

```
quotes-maker (generate)  →  tumblr-poster (distribute)  →  Tumblr blog
       ↓                              ↓
   output/*.png              node index.mjs post --image ...
```

## License

MIT © The Aetheris
