import { useEffect, useState } from 'react';
import * as spotify from './spotify';

const TOP_N = 30;

const capitalizeWords = (str) => str.replace(/\b\w/g, (c) => c.toUpperCase());

// Run `fn` over `items`, at most `limit` at a time, so Spotify doesn't rate-limit us.
async function mapLimited(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [ownPlaylistIds, setOwnPlaylistIds] = useState(new Set());

  const [keyword, setKeyword] = useState('');
  const [searchedFor, setSearchedFor] = useState('');
  const [tracks, setTracks] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    spotify.handleRedirect()
      .then(setLoggedIn)
      .catch((e) => setError(e.message))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    spotify.getMe().then(setUser).catch(handleError);
    spotify.getMyPlaylists()
      .then((data) => setOwnPlaylistIds(new Set(data.items.filter(Boolean).map((p) => p.id))))
      .catch(handleError);
  }, [loggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleError(e) {
    console.error(e);
    if (e.status === 401) {
      spotify.logout();
      setLoggedIn(false);
      setError('Your Spotify session expired. Please connect again.');
    } else {
      setError(e.message || 'Something went wrong.');
    }
  }

  const logout = () => {
    spotify.logout();
    setLoggedIn(false);
    setUser(null);
    setTracks([]);
    setCreated(null);
    setError('');
  };

  const search = async (e) => {
    e.preventDefault();
    const query = keyword.trim();
    if (!query || busy) return;

    setBusy(true);
    setError('');
    setTracks([]);
    setCreated(null);
    setSearchedFor(query);

    try {
      setProgress('Finding playlists...');
      const playlists = (await spotify.searchPlaylists(query))
        .filter((p) => !ownPlaylistIds.has(p.id));
      if (playlists.length === 0) {
        setError(`No playlists found for "${query}".`);
        return;
      }

      // Count how many playlists each song appears in.
      const counts = new Map();
      let done = 0;
      let blocked = 0;
      await mapLimited(playlists, 5, async (playlist) => {
        try {
          const seen = new Set();
          for (const track of await spotify.getPlaylistTracks(playlist.id)) {
            const artist = track.artists?.[0]?.name || 'Unknown artist';
            const key = `${track.name.toLowerCase()}|${artist.toLowerCase()}`;
            if (seen.has(key)) continue; // count each song once per playlist
            seen.add(key);
            const entry = counts.get(key) || { id: track.id, uri: track.uri, name: track.name, artist, count: 0 };
            entry.count += 1;
            counts.set(key, entry);
          }
        } catch (err) {
          if (err.status === 403 || err.status === 404) blocked += 1;
          else console.error(`Playlist ${playlist.id}:`, err);
        }
        done += 1;
        setProgress(`Reading playlists... ${done} of ${playlists.length}`);
      });

      if (blocked === playlists.length) {
        setError(
          "Spotify wouldn't let this app read the songs in other people's playlists. " +
          'Since 2026, apps in Spotify "Development Mode" can only read playlists you own or collaborate on.'
        );
        return;
      }

      const top = [...counts.values()]
        .filter((t) => t.count > 1)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, TOP_N);

      setTracks(top);
      if (top.length === 0) setError('No song showed up in more than one playlist. Try a broader keyword.');
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  const savePlaylist = async () => {
    setBusy(true);
    setError('');
    try {
      const name = `Ultimate ${capitalizeWords(searchedFor)} Playlist`;
      const playlist = await spotify.createPlaylist(name, `The ${tracks.length} most common songs in "${searchedFor}" playlists. Made with Clip Hits.`);
      await spotify.addTracks(playlist.id, tracks.map((t) => t.uri || `spotify:track:${t.id}`));
      setCreated(playlist);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <p>Loading...</p>;

  if (!spotify.isConfigured) {
    return (
      <main>
        <h1>Clip Hits</h1>
        <p>
          No Spotify client ID is set. Create a file named <code>.env.local</code> in the project folder containing
          {' '}<code>REACT_APP_SPOTIFY_CLIENT_ID=your_client_id</code>, then restart <code>npm run dev</code>.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Clip Hits</h1>
      <p>Type a mood, genre or activity. Clip Hits finds the songs that show up most often in Spotify playlists about it.</p>

      {error && <p role="alert"><strong>{error}</strong></p>}

      {!loggedIn ? (
        <button onClick={spotify.login}>Connect to Spotify</button>
      ) : (
        <>
          <p>
            {user ? `Connected as ${user.display_name || user.id}. ` : 'Connected. '}
            <button onClick={logout}>Disconnect</button>
          </p>

          <form onSubmit={search}>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. road trip"
              aria-label="Search keyword"
              disabled={busy}
            />{' '}
            <button type="submit" disabled={busy || !keyword.trim()}>Search</button>
          </form>

          {progress && <p>{progress}</p>}

          {tracks.length > 0 && (
            <>
              <h2>Top {tracks.length} songs for "{searchedFor}"</h2>
              <ol>
                {tracks.map((t) => (
                  <li key={t.id}>
                    <a href={`https://open.spotify.com/track/${t.id}`} target="_blank" rel="noreferrer">{t.name}</a>
                    {' '}by {t.artist} ({t.count} playlists)
                  </li>
                ))}
              </ol>

              {created ? (
                <p>
                  Saved to your Spotify:{' '}
                  <a href={created.external_urls?.spotify} target="_blank" rel="noreferrer">{created.name}</a>
                </p>
              ) : (
                <button onClick={savePlaylist} disabled={busy}>Save as Spotify playlist</button>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

export default App;
