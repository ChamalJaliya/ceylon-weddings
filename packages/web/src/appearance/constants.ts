import { DEFAULT_PALETTE } from "@ceylonweddings/contracts";

/** No "use client": the root (server) layout imports APPEARANCE_BOOT_SCRIPT. */
export const PALETTE_STORAGE_KEY = "cw-palette";
export const THEME_STORAGE_KEY = "theme";
/** next-themes mode → the classes tokens.css styles. */
export const THEME_CLASS = { light: "pearl", dark: "night" } as const;

/**
 * Inline <head> script: runs before first paint so there is no palette flash,
 * and migrates the old single-theme values (pearl / temple / night).
 */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var s=localStorage,t=s.getItem("${THEME_STORAGE_KEY}"),m={pearl:"light",night:"dark",temple:"light"};if(t&&m[t]){if(t==="temple"&&!s.getItem("${PALETTE_STORAGE_KEY}"))s.setItem("${PALETTE_STORAGE_KEY}","temple");s.setItem("${THEME_STORAGE_KEY}",m[t]);}var p=s.getItem("${PALETTE_STORAGE_KEY}");if(p&&p!=="${DEFAULT_PALETTE}")document.documentElement.setAttribute("data-palette",p);}catch(e){}})();`;
