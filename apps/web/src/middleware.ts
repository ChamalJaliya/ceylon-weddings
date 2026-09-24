import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Catch /about (and other unprefixed paths) so next-intl can redirect to /en/about.
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
