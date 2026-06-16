#!/usr/bin/env node

/**
 * Tumblr Poster CLI — Full NPF Support
 *
 * Commands:
 *   post photo   — Post an image with optional caption
 *   post text    — Post a text article
 *   post link    — Post a link
 *   post quote   — Post a quote
 *   auth --check — Verify credentials
 *   blogs        — List your Tumblr blogs
 *
 * Post state options (all post types):
 *   --state published|queue|draft|private
 *   --publish-on "2026-06-20T10:00:00Z"  (requires --state queue)
 *   --slug custom-url-slug
 */

import { getClient } from './lib/client.mjs';
import { postPhoto, postText, postLink, postQuote } from './lib/poster.mjs';
import { loadConfig } from './lib/config.mjs';

// ─── Argument Parsing ───────────────────────────────────────────────

function parseArgs(raw) {
  const args = { _: [] };
  let i = 0;

  while (i < raw.length) {
    const arg = raw[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const next = raw[i + 1];

      if (next === undefined || next.startsWith('--')) {
        args[key] = true; // boolean flag
        i++;
      } else {
        args[key] = next;
        i += 2;
      }
    } else {
      args._.push(arg);
      i++;
    }
  }

  return args;
}

function parseTags(tagsInput) {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput;
  return tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
}

function resolveBlog(args) {
  const config = loadConfig();
  const blog = args.blog || config.defaultBlog;
  if (!blog) {
    console.error('❌ No blog specified. Use --blog <name> or set TUMBLR_DEFAULT_BLOG in .env');
    process.exit(1);
  }
  return blog;
}

// ─── Post Subcommands ───────────────────────────────────────────────

async function cmdPostPhoto(args) {
  if (!args.image) {
    console.error('❌ post photo requires: --image <path>');
    process.exit(1);
  }

  const blog = resolveBlog(args);
  const tags = parseTags(args.tags);

  console.log(`📸 Posting photo...${args.dryRun ? ' (dry run)' : ''}\n`);

  const response = await postPhoto({
    imagePath: args.image,
    blog,
    caption: args.caption,
    imageCaption: args.imageCaption,
    tags,
    altText: args.altText,
    state: args.state,
    publishOn: args.publishOn,
    slug: args.slug,
    sourceUrl: args.sourceUrl,
    dryRun: args.dryRun === true,
  });

  if (!args.dryRun) {
    console.log('\n✅ Posted successfully!');
    console.log(`   Post ID: ${response.id || '(unknown)'}`);
  }
}

async function cmdPostText(args) {
  if (!args.body) {
    console.error('❌ post text requires: --body <text>');
    console.error('   Tip: Use quotes. Separate paragraphs with \\n\\n');
    process.exit(1);
  }

  const blog = resolveBlog(args);
  const tags = parseTags(args.tags);

  console.log(`📝 Posting text article...${args.dryRun ? ' (dry run)' : ''}\n`);

  const response = await postText({
    blog,
    title: args.title,
    body: args.body,
    tags,
    state: args.state,
    publishOn: args.publishOn,
    slug: args.slug,
    sourceUrl: args.sourceUrl,
    dryRun: args.dryRun === true,
  });

  if (!args.dryRun) {
    console.log('\n✅ Posted successfully!');
    console.log(`   Post ID: ${response.id || '(unknown)'}`);
  }
}

async function cmdPostLink(args) {
  if (!args.url) {
    console.error('❌ post link requires: --url <url>');
    process.exit(1);
  }

  const blog = resolveBlog(args);
  const tags = parseTags(args.tags);

  console.log(`🔗 Posting link...${args.dryRun ? ' (dry run)' : ''}\n`);

  const response = await postLink({
    blog,
    url: args.url,
    title: args.title,
    description: args.description,
    caption: args.caption,
    tags,
    state: args.state,
    publishOn: args.publishOn,
    slug: args.slug,
    sourceUrl: args.sourceUrl,
    dryRun: args.dryRun === true,
  });

  if (!args.dryRun) {
    console.log('\n✅ Posted successfully!');
    console.log(`   Post ID: ${response.id || '(unknown)'}`);
  }
}

async function cmdPostQuote(args) {
  if (!args.quote) {
    console.error('❌ post quote requires: --quote <text>');
    process.exit(1);
  }

  const blog = resolveBlog(args);
  const tags = parseTags(args.tags);

  console.log(`💬 Posting quote...${args.dryRun ? ' (dry run)' : ''}\n`);

  const response = await postQuote({
    blog,
    quote: args.quote,
    source: args.source,
    tags,
    state: args.state,
    publishOn: args.publishOn,
    slug: args.slug,
    sourceUrl: args.sourceUrl,
    dryRun: args.dryRun === true,
  });

  if (!args.dryRun) {
    console.log('\n✅ Posted successfully!');
    console.log(`   Post ID: ${response.id || '(unknown)'}`);
  }
}

// ─── Other Commands ─────────────────────────────────────────────────

async function cmdAuthCheck() {
  console.log('🔍 Checking Tumblr authentication...\n');

  try {
    const client = getClient();
    const response = await client.userInfo();

    const user = response.user;
    console.log(`✅ Authenticated as: ${user.name}`);
    console.log(`   Blogs: ${user.blogs.length}`);
    console.log(`   Following: ${user.following}`);
    console.log(`   Likes: ${user.likes}`);

    if (user.blogs.length > 0) {
      console.log('\n   Your blogs:');
      for (const blog of user.blogs) {
        console.log(`   • ${blog.name} — ${blog.title || '(no title)'} (${blog.url})`);
      }
    }
    console.log('\n✨ Credentials are valid.');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    process.exit(1);
  }
}

async function cmdBlogs() {
  console.log('📋 Fetching your Tumblr blogs...\n');

  try {
    const client = getClient();
    const response = await client.userInfo();

    const blogs = response.user.blogs;
    if (blogs.length === 0) {
      console.log('No blogs found. Create one at https://www.tumblr.com/new/blog');
      return;
    }

    console.log(`Found ${blogs.length} blog(s):\n`);
    for (const blog of blogs) {
      console.log(`  ${blog.name}`);
      console.log(`    Title: ${blog.title || '(no title)'}`);
      console.log(`    URL:   ${blog.url}`);
      console.log(`    Posts: ${blog.posts}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Failed to fetch blogs:', error.message);
    process.exit(1);
  }
}

// ─── Help ───────────────────────────────────────────────────────────

function cmdHelp() {
  console.log(`
📸 Tumblr Poster CLI — Full NPF Support

Usage:
  node index.mjs <command> [options]

Commands:
  post photo   Post an image
  post text    Post a text article
  post link    Post a link
  post quote   Post a quote
  auth --check Verify credentials
  blogs        List your Tumblr blogs
  help         Show this help

Photo Options:
  --image <path>        Image file path [required]
  --caption <text>      Caption (text block above image)
  --image-caption <t>   Native NPF image caption (below image, max 4096)
  --alt-text <text>     Image alt text (accessibility)
  --blog <name>         Target blog (or set TUMBLR_DEFAULT_BLOG)

Text Options:
  --title <text>        Article title (rendered as heading)
  --body <text>         Article body [required] (split paragraphs with \\n\\n)

Link Options:
  --url <url>           Link URL [required]
  --title <text>        Link title (max 140 chars, auto-fetched if omitted)
  --description <text>  Link description (max 140 chars)
  --caption <text>      Caption text above the link

Quote Options:
  --quote <text>        The quote [required]
  --source <text>       Attribution (e.g. "Albert Einstein")

Common Options (all post types):
  --tags <t1,t2,...>    Comma-separated tags
  --state <state>       published | queue | draft | private (default: published)
  --publish-on <iso>    Schedule date (ISO 8601, requires --state queue)
  --slug <text>         Custom URL slug
  --source-url <url>    Source attribution URL
  --dry-run             Validate without posting

Examples:
  # Photo post
  node index.mjs post photo --image ./quote.png --caption "Stay hungry" --tags quotes,daily

  # Text article
  node index.mjs post text --title "My Thoughts" --body "Paragraph 1\\n\\nParagraph 2"

  # Link post
  node index.mjs post link --url https://example.com --title "Cool Site"

  # Quote post
  node index.mjs post quote --quote "Less is more" --source "Mies van der Rohe"

  # Schedule a post
  node index.mjs post photo --image ./quote.png --state queue --publish-on "2026-06-20T10:00:00Z"
  `);
}

// ─── Main ───────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || 'help';
const subcommand = args._[1];

try {
  switch (command) {
    case 'post':
      switch (subcommand) {
        case 'photo':
          await cmdPostPhoto(args);
          break;
        case 'text':
          await cmdPostText(args);
          break;
        case 'link':
          await cmdPostLink(args);
          break;
        case 'quote':
          await cmdPostQuote(args);
          break;
        default:
          console.error(`Unknown post type: ${subcommand || '(missing)'}`);
          console.error('Available: photo, text, link, quote');
          console.error('Example: node index.mjs post photo --image ./img.png');
          process.exit(1);
      }
      break;

    case 'auth':
      if (args.check) {
        await cmdAuthCheck();
      } else {
        console.error('Use: node index.mjs auth --check');
        process.exit(1);
      }
      break;

    case 'blogs':
      await cmdBlogs();
      break;

    case 'help':
    case '--help':
    case '-h':
      cmdHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      cmdHelp();
      process.exit(1);
  }
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
}
