import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load .env file manually (no dotenv dependency — keep it lean).
 * Supports KEY=VALUE format, ignores comments (#) and blank lines.
 */
function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;

  const raw = readFileSync(envPath, 'utf-8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    // Only set if not already in process.env (real env vars take precedence)
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const REQUIRED = [
  'TUMBLR_CONSUMER_KEY',
  'TUMBLR_CONSUMER_SECRET',
  'TUMBLR_TOKEN',
  'TUMBLR_TOKEN_SECRET',
];

/**
 * Validate that all required Tumblr OAuth credentials are present.
 * Returns config object or throws with clear error message.
 */
export function loadConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing Tumblr credentials: ${missing.join(', ')}\n` +
        'Check your .env file or set them as environment variables.\n' +
        'See .env.example for the expected format.'
    );
  }

  return {
    consumerKey: process.env.TUMBLR_CONSUMER_KEY,
    consumerSecret: process.env.TUMBLR_CONSUMER_SECRET,
    token: process.env.TUMBLR_TOKEN,
    tokenSecret: process.env.TUMBLR_TOKEN_SECRET,
    defaultBlog: process.env.TUMBLR_DEFAULT_BLOG || null,
  };
}

export { loadEnv };
