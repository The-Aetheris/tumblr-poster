---
name: tumblr-poster
description: Post content to Tumblr via CLI using the official Tumblr API. Supports photo posts, text articles, links, and quotes. Part of the Naaza content generation pipeline.
version: 2.0.0
author: The Aetheris
---

# 📸 Tumblr Poster — Agent Skill Guide

> **Purpose:** This guide teaches AI agents (like Naaza) how to post content to Tumblr using the `tumblr-poster` CLI tool.

## What This Tool Does

Takes content (image, text, link, or quote) + metadata → posts it to a Tumblr blog via the official Tumblr API using NPF (Neue Post Format).

```
Content + metadata → tumblr-poster → Live post on Tumblr
```

## Location

```
~/development/tumblr-poster/
```

## Quick Reference

All commands run from `~/development/tumblr-poster/`. Use `--blog xenna-aetheris` or set `TUMBLR_DEFAULT_BLOG` in `.env`.

### Post a Photo (Main Use Case — Naaza Pipeline)

```bash
node index.mjs post photo \
  --image <PATH_TO_IMAGE> \
  --caption "<CAPTION_TEXT>" \
  --tags "<comma,separated,tags>" \
  --blog xenna-aetheris \
  --alt-text "<accessibility description>"
```

**Example:**
```bash
node index.mjs post photo \
  --image ../quotes-maker/output/quote-001.png \
  --caption "Stay hungry, stay foolish — Steve Jobs" \
  --tags "quotes,motivation,daily" \
  --blog xenna-aetheris \
  --alt-text "Quote: Stay hungry, stay foolish"
```

### Post a Text Article

```bash
node index.mjs post text \
  --title "Article Title" \
  --body "First paragraph.

Second paragraph." \
  --tags "articles,writing" \
  --blog xenna-aetheris
```

Separate paragraphs with `\n\n` (double newline).

### Post a Link

```bash
node index.mjs post link \
  --url https://example.com \
  --title "Link Title" \
  --description "Short description" \
  --tags "links,interesting" \
  --blog xenna-aetheris
```

If `--title` and `--description` are omitted, Tumblr auto-fetches them from the URL.

### Post a Quote

```bash
node index.mjs post quote \
  --quote "Simplicity is the ultimate sophistication." \
  --source "Leonardo da Vinci" \
  --tags "quotes,wisdom" \
  --blog xenna-aetheris
```

### Other Commands

```bash
# Check if credentials are valid
node index.mjs auth --check

# List available blogs
node index.mjs blogs

# Show help
node index.mjs help
```

## All Flags Reference

### Photo Post (`post photo`)

| Flag | Required | Description |
|------|----------|-------------|
| `--image <path>` | ✅ | Path to image (PNG/JPG/GIF/WEBP) |
| `--caption <text>` | — | Caption text (rendered above image) |
| `--image-caption <text>` | — | Native NPF caption (below image, max 4096) |
| `--alt-text <text>` | — | Accessibility description |
| `--blog <name>` | ✅* | Target blog (*or set TUMBLR_DEFAULT_BLOG) |

### Text Post (`post text`)

| Flag | Required | Description |
|------|----------|-------------|
| `--body <text>` | ✅ | Article body (paragraphs split by `\n\n`) |
| `--title <text>` | — | Article title (rendered as heading) |
| `--blog <name>` | ✅* | Target blog |

### Link Post (`post link`)

| Flag | Required | Description |
|------|----------|-------------|
| `--url <url>` | ✅ | Link URL |
| `--title <text>` | — | Link title (max 140 chars, auto-fetched if omitted) |
| `--description <text>` | — | Link description (max 140 chars) |
| `--caption <text>` | — | Caption above the link |
| `--blog <name>` | ✅* | Target blog |

### Quote Post (`post quote`)

| Flag | Required | Description |
|------|----------|-------------|
| `--quote <text>` | ✅ | The quote text |
| `--source <text>` | — | Attribution (e.g. "Albert Einstein") |
| `--blog <name>` | ✅* | Target blog |

### Common Flags (All Post Types)

| Flag | Description | Default |
|------|-------------|---------|
| `--tags <t1,t2,...>` | Comma-separated tags | *(none)* |
| `--state <state>` | `published` \| `queue` \| `draft` \| `private` | `published` |
| `--publish-on <iso>` | Schedule date (ISO 8601, requires `--state queue`) | *(none)* |
| `--slug <text>` | Custom URL slug | *(auto)* |
| `--source-url <url>` | Source attribution URL | *(none)* |
| `--dry-run` | Validate without posting | `false` |

## Scheduling & States

```bash
# Add to queue
node index.mjs post photo --image ./img.png --state queue --blog xenna-aetheris

# Schedule for specific time (requires --state queue)
node index.mjs post photo --image ./img.png --state queue \
  --publish-on "2026-06-20T10:00:00Z" --blog xenna-aetheris

# Save as draft
node index.mjs post text --body "Work in progress" --state draft --blog xenna-aetheris

# Private post
node index.mjs post photo --image ./img.png --state private --blog xenna-aetheris
```

## Testing Before Posting

Always use `--dry-run` first if unsure:

```bash
node index.mjs post photo --image ./img.png --blog xenna-aetheris --dry-run
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing Tumblr credentials` | `.env` file missing or incomplete. Check `.env.example` |
| `Authentication failed` | OAuth tokens expired. Re-generate at https://www.tumblr.com/oauth/apps → Explore API |
| `Image not found` | Check file path — use absolute paths if relative doesn't work |
| `Unsupported image format` | Use PNG, JPG, GIF, or WEBP only |
| `No blog specified` | Use `--blog <name>` or set `TUMBLR_DEFAULT_BLOG` in `.env` |

## Naaza Pipeline Integration

```
Step 1: quotes-maker generates image
    ↓
    ~/development/quotes-maker/output/quote-XXX.png

Step 2: tumblr-poster posts to Tumblr
    ↓
    cd ~/development/tumblr-poster
    node index.mjs post photo \
      --image ../quotes-maker/output/quote-XXX.png \
      --caption "..." --tags "..." --blog xenna-aetheris

Step 3: Confirm success ✅
```

## Tech Details

- **Runtime:** Node.js ESM (`"type": "module"`) >= 18
- **API Library:** `tumblr.js` v5.0.1 (official, by Tumblr)
- **Post Format:** NPF (Neue Post Format) — Tumblr's modern content blocks
- **Auth:** OAuth 1.0a (consumer key/secret + token/secret)
- **Rate Limits:** 250 posts/day, 250 images/day, 1000 queue limit per blog

---

*Maintained by Nooku — The Aetheris Engineering*
