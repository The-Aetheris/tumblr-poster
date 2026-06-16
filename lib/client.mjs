import { createClient } from 'tumblr.js';
import { loadConfig } from './config.mjs';

/**
 * Create an authenticated Tumblr API client.
 * Uses OAuth 1.0a credentials loaded from .env or environment.
 *
 * @returns {import('tumblr.js').Client} Tumblr API client
 */
export function getClient() {
  const config = loadConfig();

  return createClient({
    consumer_key: config.consumerKey,
    consumer_secret: config.consumerSecret,
    token: config.token,
    token_secret: config.tokenSecret,
  });
}

/**
 * Validate credentials by calling userInfo().
 * Returns user info if auth is valid, throws otherwise.
 *
 * @returns {Promise<object>} Tumblr user info
 */
export async function checkAuth() {
  const client = getClient();
  const response = await client.userInfo();
  return response;
}

/**
 * List all blogs owned by the authenticated user.
 *
 * @returns {Promise<Array>} Array of blog objects
 */
export async function listBlogs() {
  const response = await checkAuth();
  return response.user.blogs;
}
