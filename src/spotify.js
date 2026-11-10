// Minimal Spotify Web API client: PKCE login, token refresh, and the few calls this app needs.

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI || `${window.location.origin}/callback`;
const SCOPES = 'playlist-read-private playlist-modify-public playlist-modify-private';
const API = 'https://api.spotify.com/v1';

export const isConfigured = Boolean(CLIENT_ID);

// ---------- Auth (Authorization Code with PKCE) ----------

const base64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function login() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(64)));
  const challenge = base64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  localStorage.setItem('pkce_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

function saveTokens(data) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('expires_at', String(Date.now() + data.expires_in * 1000));
  if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
}

async function requestToken(body) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...body }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  saveTokens(await res.json());
}

// Call once on page load. Finishes a login if Spotify just redirected back here.
// Returns true if the user is logged in.
export async function handleRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  if (code || error || window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/');
  }
  if (error) throw new Error(`Spotify login was cancelled (${error})`);
  if (code) {
    await requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: localStorage.getItem('pkce_verifier') || '',
    });
    localStorage.removeItem('pkce_verifier');
  }
  return Boolean(localStorage.getItem('refresh_token') || localStorage.getItem('access_token'));
}

export function logout() {
  ['access_token', 'refresh_token', 'expires_at', 'pkce_verifier', 'token'].forEach((k) => localStorage.removeItem(k));
}

async function getAccessToken() {
  const expiresAt = Number(localStorage.getItem('expires_at') || 0);
  const refresh = localStorage.getItem('refresh_token');
  if (Date.now() > expiresAt - 60_000 && refresh) {
    await requestToken({ grant_type: 'refresh_token', refresh_token: refresh });
  }
  return localStorage.getItem('access_token');
}

// ---------- API ----------

export class SpotifyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, { method = 'GET', body } = {}, attempt = 0) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await getAccessToken()}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Rate limited: wait as long as Spotify asks, then retry (a few times at most).
  if (res.status === 429 && attempt < 3) {
    await sleep((Number(res.headers.get('Retry-After')) || 1) * 1000);
    return api(path, { method, body }, attempt + 1);
  }
  if (!res.ok) {
    let message = res.statusText;
    try { message = (await res.json()).error?.message || message; } catch { /* no body */ }
    throw new SpotifyError(res.status, message);
  }
  return res.status === 204 ? null : res.json();
}

export const getMe = () => api('/me');

export const getMyPlaylists = () => api('/me/playlists?limit=50');

// Search for playlists. Spotify caps each request at 10 results, so page with offset.
export async function searchPlaylists(query, max = 50) {
  const results = [];
  for (let offset = 0; offset < max; offset += 10) {
    const data = await api(`/search?${new URLSearchParams({ q: query, type: 'playlist', limit: 10, offset })}`);
    const items = (data.playlists?.items || []).filter(Boolean);
    results.push(...items);
    if (!data.playlists?.next) break;
  }
  return results;
}

// Tracks in a playlist (first 50). Each entry's track is in `item` (older responses used `track`).
export async function getPlaylistTracks(playlistId) {
  const data = await api(`/playlists/${playlistId}/items?limit=50&additional_types=track`);
  return (data.items || [])
    .map((entry) => entry.item || entry.track)
    .filter((t) => t && t.type !== 'episode' && t.id);
}

export const createPlaylist = (name, description) =>
  api('/me/playlists', { method: 'POST', body: { name, description, public: true } });

export async function addTracks(playlistId, uris) {
  for (let i = 0; i < uris.length; i += 100) {
    await api(`/playlists/${playlistId}/items`, { method: 'POST', body: { uris: uris.slice(i, i + 100) } });
  }
}
