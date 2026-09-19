/**
 * Where the API lives — decided once, for the whole application.
 *
 * The base URL used to be rebuilt inline at roughly twenty-five call sites,
 * each with its own development fallback. Three different ports were in use
 * (4000, 10000, 8000) and two call sites had no fallback at all, so with the
 * environment variable unset they requested `undefined/api/...`. In production
 * that meant a build could silently point part of itself at a developer's own
 * machine and the rest at nothing.
 *
 * Nothing about the API itself changes here: same host, same paths, same
 * contracts. Only the decision of what the host is moves to one place.
 *
 * In production the base is whatever REACT_APP_API_URL says. If it is missing,
 * the base falls back to the empty string — requests go to the site's own
 * origin, which fails as a plain 404 on a domain you control rather than as a
 * connection error to localhost, and which lets a same-origin rewrite serve the
 * API if one is configured. In development it falls back to the local server.
 */
const fromEnv = (process.env.REACT_APP_API_URL || '').trim().replace(/\/+$/, '');

const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE = fromEnv || (isProduction ? '' : 'http://localhost:4000');

if (isProduction && !fromEnv) {
  // Deliberate: this is the one configuration mistake that breaks every screen
  // at once, and it is otherwise invisible until a request fails.
  // eslint-disable-next-line no-console
  console.error(
    'AIYAASI: REACT_APP_API_URL is not set for this build. API requests will ' +
      'be sent to this site\'s own origin and will fail unless a rewrite is in place.'
  );
}

export default API_BASE;
