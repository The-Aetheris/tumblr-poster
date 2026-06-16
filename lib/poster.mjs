import { createReadStream, existsSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { getClient } from './client.mjs';

// ─── Validation Helpers ─────────────────────────────────────────────

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp)$/;
const MAX_ALT_TEXT = 4096;
const MAX_CAPTION = 4096;

function validateImagePath(imagePath) {
  const absPath = resolve(imagePath);
  if (!existsSync(absPath)) {
    throw new Error(`Image not found: ${absPath}`);
  }
  const stat = statSync(absPath);
  if (stat.size === 0) {
    throw new Error(`Image file is empty: ${absPath}`);
  }
  if (!absPath.toLowerCase().match(IMAGE_EXTENSIONS)) {
    throw new Error(
      `Unsupported image format. Use PNG, JPG, GIF, or WEBP. Got: ${basename(absPath)}`
    );
  }
  return { absPath, stat };
}

// ─── NPF Content Block Builders ─────────────────────────────────────

/**
 * Build a text content block with optional subtype and formatting.
 *
 * @param {string} text - The text content
 * @param {object} [options]
 * @param {string} [options.subtype] - heading1, heading2, quote, indented, chat, ordered-list-item, unordered-list-item, quirky
 * @param {number} [options.indentLevel] - Nesting level 0-7
 * @returns {object} NPF text content block
 */
export function textBlock(text, { subtype, indentLevel } = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('textBlock requires a non-empty string');
  }
  const block = { type: 'text', text };
  if (subtype) block.subtype = subtype;
  if (indentLevel != null) block.indent_level = indentLevel;
  return block;
}

/**
 * Build an image content block with optional alt text and caption.
 *
 * @param {string} imagePath - Path to the image file
 * @param {object} [options]
 * @param {string} [options.altText] - Screen reader text (max 4096 chars)
 * @param {string} [options.caption] - Image caption (max 4096 chars)
 * @returns {object} NPF image content block
 */
export function imageBlock(imagePath, { altText, caption } = {}) {
  const { absPath } = validateImagePath(imagePath);

  const block = {
    type: 'image',
    media: createReadStream(absPath),
  };

  if (altText) {
    if (altText.length > MAX_ALT_TEXT) {
      throw new Error(`Alt text exceeds ${MAX_ALT_TEXT} characters`);
    }
    block.alt_text = altText;
  }

  if (caption) {
    if (caption.length > MAX_CAPTION) {
      throw new Error(`Image caption exceeds ${MAX_CAPTION} characters`);
    }
    block.caption = caption;
  }

  return block;
}

/**
 * Build a link content block.
 *
 * @param {string} url - The link URL
 * @param {object} [options]
 * @param {string} [options.title] - Link title (max 140 chars)
 * @param {string} [options.description] - Link description (max 140 chars)
 * @param {string} [options.author] - Content author
 * @param {string} [options.siteName] - Site name
 * @returns {object} NPF link content block
 */
export function linkBlock(url, { title, description, author, siteName } = {}) {
  if (!url) throw new Error('linkBlock requires a URL');

  const block = { type: 'link', url };
  if (title) block.title = title.slice(0, 140);
  if (description) block.description = description.slice(0, 140);
  if (author) block.author = author.slice(0, 140);
  if (siteName) block.site_name = siteName;
  return block;
}

// ─── Post State Helpers ─────────────────────────────────────────────

/**
 * Build post-level parameters (state, scheduling, tags, etc.)
 *
 * @param {object} options
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.state] - 'published' | 'queue' | 'draft' | 'private'
 * @param {string} [options.publishOn] - ISO 8601 date for scheduled posts (requires state='queue')
 * @param {string} [options.slug] - Custom URL slug
 * @param {string} [options.sourceUrl] - Source attribution URL
 * @returns {object} Post-level parameters for createPost()
 */
export function buildPostParams({
  tags = [],
  state,
  publishOn,
  slug,
  sourceUrl,
} = {}) {
  const params = {};

  if (tags.length > 0) {
    params.tags = tags.join(',');
  }

  if (state && state !== 'published') {
    params.state = state;
    if (state === 'queue' && publishOn) {
      params.publish_on = publishOn;
    }
  }

  if (slug) params.slug = slug;
  if (sourceUrl) params.source_url = sourceUrl;

  return params;
}

// ─── High-Level Post Functions ──────────────────────────────────────

/**
 * Post an image to a Tumblr blog using NPF.
 * Caption is now properly rendered as a text block ABOVE the image.
 *
 * @param {object} options
 * @param {string} options.imagePath - Path to the image file
 * @param {string} options.blog - Target blog name
 * @param {string} [options.caption] - Caption text (rendered as text block above image)
 * @param {string} [options.imageCaption] - Native NPF image caption (below image, max 4096)
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.altText] - Image alt text
 * @param {string} [options.state] - Post state: published|queue|draft|private
 * @param {string} [options.publishOn] - ISO 8601 date (requires state=queue)
 * @param {string} [options.slug] - Custom URL slug
 * @param {boolean} [options.dryRun] - Validate without posting
 * @returns {Promise<object>} API response
 */
export async function postPhoto({
  imagePath,
  blog,
  caption,
  imageCaption,
  tags = [],
  altText,
  state,
  publishOn,
  slug,
  sourceUrl,
  dryRun = false,
}) {
  const { absPath, stat } = validateImagePath(imagePath);

  // Build content blocks: [optional caption text] + [image]
  const content = [];

  if (caption) {
    content.push(textBlock(caption));
  }

  content.push(
    imageBlock(imagePath, {
      altText,
      caption: imageCaption,
    })
  );

  const postParams = {
    content,
    ...buildPostParams({ tags, state, publishOn, slug, sourceUrl }),
  };

  if (dryRun) {
    return summarizeDryRun('photo', blog, {
      image: `${basename(absPath)} (${(stat.size / 1024).toFixed(1)} KB)`,
      caption: caption || '(none)',
      imageCaption: imageCaption || '(none)',
      tags: tags.length > 0 ? tags.join(', ') : '(none)',
      altText: altText || '(none)',
      state: state || 'published',
      publishOn: publishOn || '(none)',
      slug: slug || '(none)',
    });
  }

  const client = getClient();
  return await client.createPost(blog, postParams);
}

/**
 * Post a text article to a Tumblr blog using NPF.
 * Supports title (heading1), body paragraphs, and inline formatting.
 *
 * @param {object} options
 * @param {string} options.blog - Target blog name
 * @param {string} [options.title] - Article title (rendered as heading1)
 * @param {string} options.body - Article body (plain text, paragraphs split by \n\n)
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.state] - Post state
 * @param {string} [options.publishOn] - ISO 8601 date
 * @param {string} [options.slug] - Custom URL slug
 * @param {boolean} [options.dryRun] - Validate without posting
 * @returns {Promise<object>} API response
 */
export async function postText({
  blog,
  title,
  body,
  tags = [],
  state,
  publishOn,
  slug,
  sourceUrl,
  dryRun = false,
}) {
  if (!body) throw new Error('Text post requires --body content');

  const content = [];

  // Title as heading1
  if (title) {
    content.push(textBlock(title, { subtype: 'heading1' }));
  }

  // Split body into paragraphs by double newline
  const paragraphs = body.split('\n\n').filter((p) => p.trim());
  for (const para of paragraphs) {
    content.push(textBlock(para.trim()));
  }

  const postParams = {
    content,
    ...buildPostParams({ tags, state, publishOn, slug, sourceUrl }),
  };

  if (dryRun) {
    return summarizeDryRun('text', blog, {
      title: title || '(none)',
      paragraphs: paragraphs.length,
      preview: paragraphs[0]?.slice(0, 80) + (paragraphs[0]?.length > 80 ? '...' : ''),
      tags: tags.length > 0 ? tags.join(', ') : '(none)',
      state: state || 'published',
    });
  }

  const client = getClient();
  return await client.createPost(blog, postParams);
}

/**
 * Post a link to a Tumblr blog using NPF.
 *
 * @param {object} options
 * @param {string} options.blog - Target blog name
 * @param {string} options.url - Link URL
 * @param {string} [options.title] - Link title
 * @param {string} [options.description] - Link description
 * @param {string} [options.caption] - Caption text above the link block
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.state] - Post state
 * @param {string} [options.slug] - Custom URL slug
 * @param {boolean} [options.dryRun] - Validate without posting
 * @returns {Promise<object>} API response
 */
export async function postLink({
  blog,
  url,
  title,
  description,
  caption,
  tags = [],
  state,
  publishOn,
  slug,
  sourceUrl,
  dryRun = false,
}) {
  if (!url) throw new Error('Link post requires --url');

  const content = [];

  if (caption) {
    content.push(textBlock(caption));
  }

  content.push(linkBlock(url, { title, description }));

  const postParams = {
    content,
    ...buildPostParams({ tags, state, publishOn, slug, sourceUrl }),
  };

  if (dryRun) {
    return summarizeDryRun('link', blog, {
      url,
      title: title || '(auto-fetch)',
      description: description || '(auto-fetch)',
      caption: caption || '(none)',
      tags: tags.length > 0 ? tags.join(', ') : '(none)',
      state: state || 'published',
    });
  }

  const client = getClient();
  return await client.createPost(blog, postParams);
}

/**
 * Post a quote to a Tumblr blog using NPF.
 * Uses the NPF text block with subtype: 'quote'.
 *
 * @param {object} options
 * @param {string} options.blog - Target blog name
 * @param {string} options.quote - The quote text
 * @param {string} [options.source] - Quote attribution/source
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.state] - Post state
 * @param {boolean} [options.dryRun] - Validate without posting
 * @returns {Promise<object>} API response
 */
export async function postQuote({
  blog,
  quote,
  source,
  tags = [],
  state,
  publishOn,
  slug,
  sourceUrl,
  dryRun = false,
}) {
  if (!quote) throw new Error('Quote post requires --quote text');

  const content = [textBlock(quote, { subtype: 'quote' })];

  if (source) {
    content.push(textBlock(`— ${source}`, { subtype: 'indented' }));
  }

  const postParams = {
    content,
    ...buildPostParams({ tags, state, publishOn, slug, sourceUrl }),
  };

  if (dryRun) {
    return summarizeDryRun('quote', blog, {
      quote: quote.slice(0, 80) + (quote.length > 80 ? '...' : ''),
      source: source || '(none)',
      tags: tags.length > 0 ? tags.join(', ') : '(none)',
      state: state || 'published',
    });
  }

  const client = getClient();
  return await client.createPost(blog, postParams);
}

// ─── Dry Run Helper ─────────────────────────────────────────────────

function summarizeDryRun(type, blog, details) {
  console.log(`🔍 Dry run [${type} post] — not posting.\n`);
  console.log(`   Blog: ${blog}`);
  for (const [key, value] of Object.entries(details)) {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    console.log(`   ${label}: ${value}`);
  }
  return { dryRun: true, type, blog, ...details };
}
