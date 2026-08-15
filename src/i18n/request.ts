/**
 * next-intl request configuration. CIRCLE ships with a single "en" locale
 * for now; every user-facing string still goes through translation keys so
 * adding Hebrew later is a new messages file, not a component rewrite.
 */
import { getRequestConfig } from "next-intl/server";

export const DEFAULT_LOCALE = "en";

export default getRequestConfig(async () => {
  return {
    locale: DEFAULT_LOCALE,
    messages: (await import(`../../messages/${DEFAULT_LOCALE}.json`)).default,
  };
});
