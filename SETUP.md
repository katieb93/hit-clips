# Clip Hits: setup

Type a keyword (a mood, genre or activity). Clip Hits searches Spotify for playlists about it,
counts which songs appear in the most of them, and can save the top 30 as a playlist in your account.

1. Create an app at https://developer.spotify.com/dashboard.
2. In the app's settings, add these Redirect URIs:
   - `http://127.0.0.1:3000/callback` (running locally)
   - `https://cliphits.netlify.app/callback` (live site)
3. Put the app's Client ID in `.env.local`:
   ```
   REACT_APP_SPOTIFY_CLIENT_ID=your_client_id
   ```
   On Netlify, set the same variable under Site settings → Environment variables.
4. Run:
   ```
   npm install
   npm run dev
   ```
   Then open http://127.0.0.1:3000.

## Files

- `src/App.js`: the page
- `src/spotify.js`: Spotify login (PKCE) and API calls
- `old/`: the previous styled version and its package.json, kept for reference
