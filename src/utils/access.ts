import { GAME_CONFIG } from "../config/gameConfig";

const ACCESS_HASH = [
  "8cb02e80a011990a5631b0f0b12528fa",
  "6038e2b3762eddeb1fa38a67f89a7e41"
].join("");

export async function isAccessPhraseCorrect(value: string): Promise<boolean> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const actual = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return actual === ACCESS_HASH;
}

export function hasRememberedAccess(): boolean {
  try {
    return window.localStorage.getItem(GAME_CONFIG.save.accessKey) === "1" || window.sessionStorage.getItem(GAME_CONFIG.save.accessKey) === "1";
  } catch {
    return false;
  }
}

export function rememberAccess(rememberDevice: boolean): void {
  try {
    const storage = rememberDevice ? window.localStorage : window.sessionStorage;
    storage.setItem(GAME_CONFIG.save.accessKey, "1");
    if (rememberDevice) {
      window.sessionStorage.removeItem(GAME_CONFIG.save.accessKey);
    }
  } catch {
    // Private browsing modes can deny storage. The gate still works for this page.
  }
}

export function clearRememberedAccess(): void {
  try {
    window.localStorage.removeItem(GAME_CONFIG.save.accessKey);
    window.sessionStorage.removeItem(GAME_CONFIG.save.accessKey);
  } catch {
    // Ignore storage cleanup failures.
  }
}
