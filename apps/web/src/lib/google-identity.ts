let gisPromise: Promise<void> | null = null;

export function loadGoogleIdentity(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity is browser-only"));
  }
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gisPromise) {
    return gisPromise;
  }

  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-cw-gis]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.cwGis = "true";
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("Failed to load Google"));
    };
    document.head.appendChild(script);
  });

  return gisPromise;
}

export function googleClientId(): string | undefined {
  const value = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return value || undefined;
}

export async function requestGoogleAuthCode(): Promise<string> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("GOOGLE_MISSING");
  }

  await loadGoogleIdentity();
  if (!window.google?.accounts.oauth2) {
    throw new Error("GOOGLE_MISSING");
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (response.error || !response.code) {
          reject(new Error(response.error_description || response.error || "GOOGLE_MISSING"));
          return;
        }
        resolve(response.code);
      },
    });
    client.requestCode();
  });
}
