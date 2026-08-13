/*
 * App identity — the single place to rename a prototype. The /prototype skill
 * rewrites these when it kicks off a new idea; the landing page, nav, and
 * copy all read from here so a rename lands everywhere at once.
 */
export const APP_NAME = "ProtoStack";
export const TAGLINE = "Validate the idea before you build the product.";

/*
 * Absolute site origin, no trailing slash (e.g. "https://myapp.up.railway.app").
 * Empty until /ship sets it; canonical and og:url tags render only when it's set.
 * /ship also rewrites the absolute URLs in public/robots.txt and public/sitemap.xml
 * to match — seo-lint holds the three in sync. See docs/seo.md.
 */
export const SITE_URL = "";
