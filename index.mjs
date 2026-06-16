#!/usr/bin/env node

/**
 * Tumblr Poster CLI
 * Post images to Tumblr via official API (tumblr.js, NPF format).
 * Part of the Naaza content generation pipeline.
 *
 * Usage:
 *   node index.mjs post --image <path> --caption <text> [--tags t1,t2] [--blog <name>]
 *   node index.mjs auth --check
 *   node index.mjs blogs
 */

import { loadConfig } from './lib/config.mjs';
import { getClient } from './lib/client.mjs';
import { postPhoto } from './lib/poster.mjs';

// ─── Argument Parsing ───────────────────────────────────────────────

function parseArgs(raw) {
  const args = { _: [] };
  let i = 0;

  while (i < raw.length) {
    const arg = raw[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const next = raw[i + 1];

      // Boolean flags (no value after them, or next is another flag)
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
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
  return tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// ─── Commands ───────────────────────────────────────────────────────

async function cmdAuthCheck() {
  console.log('🔍 Checking Tumblr authentication...\n');

  try {
    const { getClient: _, ...client } = { getClient };
    const tumblrClient = getClient();
    const response = await tumblrClient.userInfo();

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
    const tumblrClient = getClient();
    const response = await tumblrClient.userInfo();

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

async function cmdPost(args) {
  if (!args.image) {
    console.error('❌ Missing required flag: --image <path>');
    console.error('   Example: node index.mjs post --image ./output/quote.png --caption "Hello"');
    process.exit(1);
  }

  const config = loadConfig();
  const blog = args.blog || config.defaultBlog;

  if (!blog) {
    console.error(
      '❌ No blog specified. Use --blog <name> or set TUMBLR_DEFAULT_BLOG in .env'
    );
    process.exit(1);
  }

  const tags = parseTags(args.tags);
  const dryRun = args.dryRun === true;

  console.log(`📸 Posting to Tumblr...${dryRun ? ' (dry run)' : ''}\n`);

  try {
    const response = await postPhoto({
      imagePath: args.image,
      blog,
      caption: args.caption || '',
      tags,
      altText: args.altText,
      dryRun,
    });

    if (dryRun) {
      console.log('\n✅ Dry run complete — no post created.');
      return;
    }

    console.log('\n✅ Posted successfully!');
    console.log(`   Post ID: ${response.id || '(unknown)'}`);
    if (response.url) {
      console.log(`   URL: ${response.url}`);
    }
  } catch (error) {
    console.error('\n❌ Post failed:', error.message);
    process.exit(1);
  }
}

function cmdHelp() {
  console.log(`
📸 Tumblr Poster CLI — Post images to Tumblr

Usage:
  node index.mjs <command> [options]

Commands:
  post        Post an image to a Tumblr blog
  auth        Authentication commands
  blogs       List your Tumblr blogs
  help        Show this help message

Post Options:
  --image <path>       Path to image file (PNG/JPG/GIF/WEBP) [required]
  --caption <text>     Post caption (supports markdown)
  --tags <t1,t2,...>   Comma-separated tags
  --blog <name>        Target blog name (default: TUMBLR_DEFAULT_BLOG)
  --alt-text <text>    Image alt text for accessibility
  --dry-run            Validate without posting

Auth Options:
  --check              Verify credentials are valid

Examples:
  node index.mjs auth --check
  node index.mjs blogs
  node index.mjs post --image ./quote.png --caption "Stay hungry" --tags quotes,daily
  node index.mjs post --image ./quote.png --blog my-blog --dry-run
  `);
}

// ─── Main ───────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2));
const command = args._[0] || 'help';

switch (command) {
  case 'post':
    await cmdPost(args);
    break;
  case 'auth':
    if (args.check) {
      await cmdAuthCheck();
    } else {
      console.error('Unknown auth subcommand. Use: auth --check');
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
