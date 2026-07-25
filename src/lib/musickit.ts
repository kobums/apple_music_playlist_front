/**
 * MusicKit JS v3 loader.
 *
 * The previous implementation appended the script inside a `useEffect` and
 * registered a `musickitloaded` listener that was never removed, so React
 * StrictMode (and any remount) loaded the SDK twice and leaked a listener.
 * Loading is now a module-level singleton: the script is injected at most once
 * per document and every caller awaits the same promise.
 */

const MUSICKIT_SRC = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';

const APP_INFO = {
  name: 'Apple Music playlist',
  build: '1.0.0',
} as const;

let scriptPromise: Promise<MusicKitStatic> | null = null;
let configurePromise: Promise<MusicKit.MusicKitInstance> | null = null;

function loadScript(): Promise<MusicKitStatic> {
  if (window.MusicKit) {
    return Promise.resolve(window.MusicKit);
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<MusicKitStatic>((resolve, reject) => {
    const settle = () => {
      if (window.MusicKit) {
        resolve(window.MusicKit);
      }
    };

    const fail = () => {
      // Allow a later retry rather than caching the rejection forever.
      scriptPromise = null;
      reject(new Error('MusicKit을 불러오지 못했습니다.'));
    };

    document.addEventListener('musickitloaded', settle, { once: true });

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MUSICKIT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', settle, { once: true });
      existing.addEventListener('error', fail, { once: true });
      // The event may already have fired before this listener was attached.
      settle();
      return;
    }

    const script = document.createElement('script');
    script.src = MUSICKIT_SRC;
    script.async = true;
    script.addEventListener('load', settle, { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Loads and configures MusicKit once per page. Repeated calls reuse the same
 * configured instance.
 */
export async function configureMusicKit(
  developerToken: string,
): Promise<MusicKit.MusicKitInstance> {
  if (configurePromise) {
    return configurePromise;
  }

  configurePromise = (async () => {
    const musicKit = await loadScript();
    // v3 returns a promise, v1 returned the instance directly — `await` covers both.
    const instance = await musicKit.configure({
      developerToken,
      app: { ...APP_INFO },
    });
    return instance ?? musicKit.getInstance()!;
  })();

  try {
    return await configurePromise;
  } catch (error) {
    configurePromise = null;
    throw error;
  }
}

/**
 * Drops the Music User Token MusicKit keeps in its own storage.
 *
 * This is essential when the server rejects the session. `authorize()` on an
 * already-authorised instance resolves with the cached token straight away
 * without prompting, so sending the user back to sign-in without clearing it
 * hands the same dead token straight back and the failure repeats forever.
 */
export async function unauthorizeMusicKit(): Promise<void> {
  try {
    const instance = window.MusicKit?.getInstance();
    if (instance?.isAuthorized) {
      await instance.unauthorize();
    }
  } catch {
    // Clearing our own stored tokens is what actually matters; if MusicKit
    // refuses to sign out there is nothing useful left to do here.
  }
}
