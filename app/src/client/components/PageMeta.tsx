import { APP_NAME } from "../../shared/app";

/*
 * Per-page <head> tags. React 19 hoists <title>/<meta> rendered anywhere in the
 * tree into <head>, so no helmet library is needed. Every routed page renders
 * one of these (seo-lint enforces it). Auth-flow pages pass noindex — they're
 * utility pages with nothing to rank. See docs/seo.md.
 *
 * A page without a `title` inherits the global one from main.wasp.ts (= APP_NAME)
 * — this is the home page's case, and it keeps the prerendered HTML to a single
 * <title> (Wasp always emits the global one; a second here would duplicate it).
 */
export default function PageMeta({
  title,
  description,
  noindex,
}: {
  title?: string;
  description?: string;
  noindex?: boolean;
}) {
  return (
    <>
      {title && <title>{`${title} — ${APP_NAME}`}</title>}
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex" />}
    </>
  );
}
