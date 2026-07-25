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

export interface Track {
  id: string;
  name: string;
  artistName: string;
  albumName: string;
  artworkUrl?: string;
  previewUrl?: string;
  url?: string;
}

/**
 * `added` went in, `duplicate` was already in the playlist, `ready` is a
 * confident match held back until the whole batch can be saved in order,
 * `review` was found but needs a person to confirm, `missing` had no usable
 * candidate.
 */
export type MatchStatus = 'added' | 'duplicate' | 'ready' | 'review' | 'missing';

export interface TrackResult {
  song: string;
  status: MatchStatus;
  score?: number;
  track?: Track;
  candidates?: Track[];
}

export interface SavePlaylistResult {
  playlistId: string;
  /** Name the tracks actually went into, so the user can find it. */
  playlistName: string;
  /** How many tracks the playlist already held before this run. */
  existingCount: number;
  /** True when the playlist did not exist and was created. */
  created: boolean;
  /**
   * True when nothing has been written yet. Apple can only append, so when any
   * row still needs a decision the whole batch waits and is saved in one
   * ordered request — otherwise confirmed picks land at the end of the playlist
   * instead of in the pasted order.
   */
  deferred: boolean;
  results: TrackResult[];
}

interface TokenResponse {
  code: string;
  developerToken?: string;
  error?: string;
}

interface PlaylistResponse {
  code: string;
  playlistId?: string;
  playlistName?: string;
  playlistExistingCount?: number;
  playlistCreated?: boolean;
  deferred?: boolean;
  result?: TrackResult[];
  error?: string;
}

interface SearchResponse {
  code: string;
  candidates?: Track[];
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

/** Wraps a failure, turning an expired session into its own error type. */
function rethrow(error: unknown, fallback: string): never {
  if (isSessionExpired(error)) {
    throw new SessionExpiredError(
      toUserMessage(error, 'Apple Music 인증이 만료되었습니다. 다시 로그인해 주세요.'),
    );
  }
  throw new Error(toUserMessage(error, fallback));
}

export async function savePlaylist(input: SavePlaylistInput): Promise<SavePlaylistResult> {
  try {
    const { data } = await client.post<PlaylistResponse>('/api/playlist', input);
    if (!data.result || !data.playlistId) {
      throw new Error(data.error ?? '플레이리스트를 저장하지 못했습니다.');
    }
    return {
      playlistId: data.playlistId,
      playlistName: data.playlistName ?? input.title,
      existingCount: data.playlistExistingCount ?? 0,
      created: data.playlistCreated ?? false,
      deferred: data.deferred ?? false,
      results: data.result,
    };
  } catch (error) {
    rethrow(error, '플레이리스트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

/** Looks up alternatives when a suggested match is wrong or nothing was found. */
export async function searchTracks(userToken: string, query: string): Promise<Track[]> {
  try {
    const { data } = await client.post<SearchResponse>('/api/search', { userToken, query });
    return data.candidates ?? [];
  } catch (error) {
    rethrow(error, '검색하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

export interface AddTracksResult {
  added: string[];
  duplicate: string[];
}

/**
 * Adds the tracks the user confirmed. The server skips anything the playlist
 * already holds and reports it separately, so rows can be labelled truthfully
 * instead of every pick claiming to be new.
 */
export async function addTracks(
  userToken: string,
  playlistId: string,
  songIds: string[],
): Promise<AddTracksResult> {
  try {
    const { data } = await client.post<{ added?: string[]; duplicate?: string[] }>(
      '/api/playlist/tracks',
      { userToken, playlistId, songIds },
    );
    return { added: data.added ?? [], duplicate: data.duplicate ?? [] };
  } catch (error) {
    rethrow(error, '곡을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
}
