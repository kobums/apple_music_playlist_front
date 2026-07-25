import axios from 'axios';

/**
 * The API host used to be hard-coded (with the dev URLs commented out just
 * above it). It now comes from `VITE_API_BASE_URL`, falling back to production
 * so an unconfigured build still works.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'https://playlistapi.gowoobro.com';

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // Building a long playlist fans out to many Apple Music calls, so this needs
  // far more headroom than the axios default of "no timeout at all".
  timeout: 180_000,
});

export interface TrackResult {
  song: string;
  status: boolean;
}

interface TokenResponse {
  code: string;
  developerToken?: string;
  error?: string;
}

interface PlaylistResponse {
  code: string;
  result?: TrackResult[];
  error?: string;
}

export interface SavePlaylistInput {
  title: string;
  list: string;
  userToken: string;
  developerToken: string;
}

/**
 * Thrown when the server reports that the Music User Token is no longer
 * accepted. The caller must clear the stored tokens and send the user back
 * through sign-in — retrying the same request can never succeed.
 */
export class SessionExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

/** True when the API said the user's Apple Music session is no longer valid. */
function isSessionExpired(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  const data = error.response?.data as { code?: string } | undefined;
  return error.response?.status === 401 || data?.code === 'unauthorized';
}

/** Normalises axios/network failures into a message that is safe to show. */
function toUserMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: string } | undefined)?.error;
    if (serverMessage) {
      return serverMessage;
    }
    if (error.code === 'ECONNABORTED') {
      return '서버 응답이 너무 오래 걸립니다. 곡 수를 줄여서 다시 시도해 주세요.';
    }
    if (!error.response) {
      return '서버에 연결할 수 없습니다. 네트워크를 확인하고 다시 시도해 주세요.';
    }
  }
  return fallback;
}

export async function fetchDeveloperToken(): Promise<string> {
  try {
    const { data } = await client.get<TokenResponse>('/api/token');
    if (!data.developerToken) {
      throw new Error(data.error ?? '개발자 토큰을 받지 못했습니다.');
    }
    return data.developerToken;
  } catch (error) {
    throw new Error(toUserMessage(error, '개발자 토큰을 받지 못했습니다. 잠시 후 다시 시도해 주세요.'));
  }
}

export async function savePlaylist(input: SavePlaylistInput): Promise<TrackResult[]> {
  try {
    const { data } = await client.post<PlaylistResponse>('/api/playlist', input);
    if (!data.result) {
      throw new Error(data.error ?? '플레이리스트를 저장하지 못했습니다.');
    }
    return data.result;
  } catch (error) {
    if (isSessionExpired(error)) {
      throw new SessionExpiredError(
        toUserMessage(error, 'Apple Music 인증이 만료되었습니다. 다시 로그인해 주세요.'),
      );
    }
    throw new Error(toUserMessage(error, '플레이리스트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'));
  }
}
