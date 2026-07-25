import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Tokens used to live in the react-query cache, which is in-memory only. A
 * refresh on `/playlist` silently dropped them and the form then posted empty
 * tokens to the API. They are now persisted for the tab's session.
 */
const DEVELOPER_TOKEN_KEY = 'apple-music-playlist:developerToken';
const USER_TOKEN_KEY = 'apple-music-playlist:musicUserToken';

interface AuthTokens {
  developerToken: string;
  musicUserToken: string;
}

interface AuthContextValue extends Partial<AuthTokens> {
  isAuthorized: boolean;
  /**
   * Why the session ended, when it ended for a reason worth telling the user
   * about. Held here rather than passed as router state because clearing the
   * tokens makes RequireAuth redirect on its own, and that redirect carries no
   * state — it would overwrite anything the caller tried to pass along.
   */
  signedOutReason?: string;
  setDeveloperToken: (token: string) => void;
  setMusicUserToken: (token: string) => void;
  clear: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function read(key: string): string | undefined {
  try {
    return window.sessionStorage.getItem(key) ?? undefined;
  } catch {
    // Private browsing modes can throw on storage access.
    return undefined;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Storage is a progressive enhancement here; in-memory state still works.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [developerToken, setDeveloperTokenState] = useState(() => read(DEVELOPER_TOKEN_KEY));
  const [musicUserToken, setMusicUserTokenState] = useState(() => read(USER_TOKEN_KEY));
  const [signedOutReason, setSignedOutReason] = useState<string | undefined>(undefined);

  const setDeveloperToken = useCallback((token: string) => {
    write(DEVELOPER_TOKEN_KEY, token);
    setDeveloperTokenState(token);
  }, []);

  const setMusicUserToken = useCallback((token: string) => {
    write(USER_TOKEN_KEY, token);
    setMusicUserTokenState(token);
    // A fresh authorisation resolves whatever ended the previous session.
    setSignedOutReason(undefined);
  }, []);

  const clear = useCallback((reason?: string) => {
    write(DEVELOPER_TOKEN_KEY, null);
    write(USER_TOKEN_KEY, null);
    setDeveloperTokenState(undefined);
    setMusicUserTokenState(undefined);
    setSignedOutReason(reason);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      developerToken,
      musicUserToken,
      signedOutReason,
      isAuthorized: Boolean(developerToken && musicUserToken),
      setDeveloperToken,
      setMusicUserToken,
      clear,
    }),
    [
      developerToken,
      musicUserToken,
      signedOutReason,
      setDeveloperToken,
      setMusicUserToken,
      clear,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
