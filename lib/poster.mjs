import { createReadStream, existsSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import { getClient } from './client.mjs';

/**
 * Post an image to a Tumblr blog using NPF (Neue Post Format).
 *
 * @param {object} options
 * @param {string} options.imagePath - Path to the image file (PNG/JPG)
 * @param {string} options.blog - Target blog name (without .tumblr.com)
 * @param {string} [options.caption] - Post caption (supports markdown)
 * @param {string[]} [options.tags] - Array of tags
 * @param {string} [options.altText] - Image alt text for accessibility
 * @param {boolean} [options.dryRun] - If true, validate without posting
 * @returns {Promise<object>} API response with post ID and URL
 */
export async function postPhoto({
  imagePath,
  blog,
  caption,
  tags = [],
  altText,
  dryRun = false,
}) {
  // Validate image file
  const absPath = resolve(imagePath);
  if (!existsSync(absPath)) {
    throw new Error(`Image not found: ${absPath}`);
  }

  const stat = statSync(absPath);
  if (stat.size === 0) {
    throw new Error(`Image file is empty: ${absPath}`);
  }

  // Validate file extension
  const ext = absPath.toLowerCase();
  if (!ext.match(/\.(png|jpe?g|gif|webp)$/)) {
    throw new Error(
      `Unsupported image format. Use PNG, JPG, GIF, or WEBP. Got: ${basename(absPath)}`
    );
  }

  // Build NPF content block
  const content = [
    {
      type: 'image',
      media: createReadStream(absPath),
      ...(altText ? { alt_text: altText } : {}),
    },
  ];

  const postParams = {
    content,
    ...(tags.length > 0 ? { tags: tags.join(',') } : {}),
  };

  if (dryRun) {
    console.log('🔍 Dry run — not posting.');
    console.log(`   Blog: ${blog}`);
    console.log(`   Image: ${basename(absPath)} (${(stat.size / 1024).toFixed(1)} KB)`);
    console.log(`   Caption: ${caption || '(none)'}`);
    console.log(`   Tags: ${tags.length > 0 ? tags.join(', ') : '(none)'}`);
    console.log(`   Alt text: ${altText || '(none)'}`);
    return { dryRun: true, blog, image: basename(absPath) };
  }

  const client = getClient();
  const response = await client.createPost(blog, postParams);

  return response;
}
