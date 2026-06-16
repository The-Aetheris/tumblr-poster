---
name: tumblr-poster
description: Post images to Tumblr via CLI using the official Tumblr API. Part of the Naaza content generation pipeline — takes images from quotes-maker and posts them to a Tumblr blog.
version: 1.0.0
author: The Aetheris
---

# 📸 Tumblr Poster — Agent Skill Guide

> **Purpose:** This guide teaches AI agents (like Naaza) how to post images to Tumblr using the `tumblr-poster` CLI tool.

## What This Tool Does

Takes an image file + caption + tags → posts it to a Tumblr blog via the official Tumblr API.

```
Image file → tumblr-poster → Live post on Tumblr
```

## Location

```
~/development/tumblr-poster/
```

## Prerequisites

1. **Node.js >= 18** installed
2. **`.env` file** at `~/development/tumblr-poster/.env` with valid Tumblr OAuth credentials
3. **Image file** ready to post (PNG, JPG, GIF, or WEBP)

## Commands

### 1. Post an Image

This is the main command. Posts an image to Tumblr.

```bash
cd ~/development/tumblr-poster

node index.mjs post \
  --image <PATH_TO_IMAGE> \
  --caption "<CAPTION_TEXT>" \
  --tags "<comma,separated,tags>" \
  --blog <BLOG_NAME>
```

**Required flags:**

| Flag | Description | Example |
|------|-------------|---------|
| `--image` | Path to the image file | `../quotes-maker/output/quote-001.png` |
| `--blog` | Target Tumblr blog name | `xenna-aetheris` |

**Optional flags:**

| Flag | Description | Default |
|------|-------------|---------|
| `--caption` | Text caption for the post | *(empty)* |
| `--tags` | Comma-separated tags | *(none)* |
| `--alt-text` | Accessibility description of image | *(none)* |
| `--dry-run` | Test without actually posting | `false` |

#### Example: Post a quote image

```bash
node index.mjs post \
  --image ../quotes-maker/output/quote-001.png \
  --caption "Stay hungry, stay foolish — Steve Jobs" \
  --tags "quotes,motivation,daily,steve-jobs" \
  --blog xenna-aetheris \
  --alt-text "Quote: Stay hungry, stay foolish"
```

**Output on success:**

```
📸 Posting to Tumblr...

✅ Posted successfully!
   Post ID: 819602117598789632
```

### 2. Check Auth Status

Verify credentials are valid:

```bash
node index.mjs auth --check
```

### 3. List Available Blogs

See which Tumblr blogs you can post to:

```bash
node index.mjs blogs
```

## Important Notes

### Before Posting

- **Always test with `--dry-run` first** if you're unsure:
  ```bash
  node index.mjs post --image ./image.png --blog xenna-aetheris --dry-run
  ```
- Verify the image file exists and is not empty
- Keep captions concise — Tumblr captions can be long but shorter is better for engagement
- Use relevant tags (5-10 is ideal for Tumblr)

### Image Requirements

- **Formats:** PNG, JPG, GIF, WEBP
- **Size:** Keep under 10MB (Tumblr's limit)
- **Recommended:** 1080×1080 (square) or 1080×1350 (portrait) for best display

### Tags Best Practices

- Separate with commas: `--tags "quotes,motivation,daily"`
- 5-10 tags per post is the sweet spot
- Mix popular tags (#quotes, #art) with specific ones (#steve-jobs-quotes)

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing Tumblr credentials` | `.env` file missing or incomplete. Check `.env.example` |
| `Authentication failed` | OAuth tokens expired. Re-generate at https://www.tumblr.com/oauth/apps → Explore API |
| `Image not found` | Check the file path — use absolute paths if relative doesn't work |
| `Unsupported image format` | Use PNG, JPG, GIF, or WEBP only |

## Pipeline Integration (Naaza Workflow)

```
Step 1: quotes-maker generates image
    ↓
    output: ~/development/quotes-maker/output/quote-XXX.png

Step 2: tumblr-poster posts to Tumblr
    ↓
    cd ~/development/tumblr-poster
    node index.mjs post --image ../quotes-maker/output/quote-XXX.png \
      --caption "..." --tags "..." --blog xenna-aetheris

Step 3: Confirm success
    ↓
    Post live on Tumblr ✅
```

## Environment Variables

The `.env` file (gitignored, never committed) contains:

```env
TUMBLR_CONSUMER_KEY=...
TUMBLR_CONSUMER_SECRET=...
TUMBLR_TOKEN=...
TUMBLR_TOKEN_SECRET=...
TUMBLR_DEFAULT_BLOG=xenna-aetheris   # optional, avoids --blog flag
```

If `TUMBLR_DEFAULT_BLOG` is set, you can omit `--blog` from the post command.

## Tech Details (For Developers)

- **Runtime:** Node.js ESM (`"type": "module"`)
- **API Library:** `tumblr.js` v5.0.1 (official, by Tumblr)
- **Auth:** OAuth 1.0a (4 keys: consumer key/secret + token/secret)
- **Post Format:** NPF (Neue Post Format) — Tumblr's modern post API
- **Source:** `~/development/tumblr-poster/`

---

*Maintained by Nooku — The Aetheris Engineering*
