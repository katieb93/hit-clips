
import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import './App.css';
import { Button, TextField, Container, Box, Typography, Snackbar, IconButton, CssBaseline } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Logo from './Spotify_Logo_RGB_Black.png';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Font import
import GunnarRegular from './fonts/Gunnar-Regular.ttf';

const spotifyApi = new SpotifyWebApi();

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
const AUTH_ENDPOINT = process.env.REACT_APP_SPOTIFY_AUTH_ENDPOINT;
const RESPONSE_TYPE = process.env.REACT_APP_SPOTIFY_RESPONSE_TYPE;
const SCOPE = process.env.REACT_APP_SPOTIFY_SCOPE;

const theme = createTheme({
  palette: {
    background: {
      default: '#8ba4cf',
    },
    text: {
      primary: '#000000',
    },
    primary: {
      main: '#000080',
    },
  },
  typography: {
    fontFamily: 'Gunnar, Arial',
    body1: {
      fontFamily: 'Gunnar, Arial',
    },
    body2: {
      fontFamily: 'Gunnar, Arial',
    },
    h1: {
      fontFamily: 'Gunnar, Arial',
    },
    h2: {
      fontFamily: 'Gunnar, Arial',
    },
    h3: {
      fontFamily: 'Gunnar, Arial',
    },
    h4: {
      fontFamily: 'Gunnar, Arial',
    },
    h5: {
      fontFamily: 'Gunnar, Arial',
    },
    h6: {
      fontFamily: 'Gunnar, Arial',
    },
    subtitle1: {
      fontFamily: 'Gunnar, Arial',
    },
    subtitle2: {
      fontFamily: 'Gunnar, Arial',
    },
    button: {
      fontFamily: 'Gunnar, Arial',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Gunnar';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: local('Gunnar'), url(${GunnarRegular}) format('truetype');
        }
      `,
    },
  },
});

function Home() {
  const [playlistResponse, setPlaylistResponse] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [duplicateTracks, setDuplicateTracks] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem('token');

    if (!token && hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
      window.location.hash = "";
      window.localStorage.setItem('token', token);
    }

    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      spotifyApi.setAccessToken(accessToken);

      spotifyApi.getMe()
        .then((data) => {
          setUserId(data.id);
        })
        .catch((err) => {
          console.error('Failed to get user info', err);
        });

      spotifyApi.getUserPlaylists()
        .then((data) => {
          setUserPlaylists(data.items.map(playlist => playlist.id));
        })
        .catch((err) => {
          console.error('Failed to get user playlists', err);
        });
    }
  }, [accessToken]);

  const login = () => {
    const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    setAccessToken('');
    setUserId('');
    setUserPlaylists([]);
    window.localStorage.removeItem('token');
  };

  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const createPlaylist = () => {
    if (!userId) {
      console.error('User ID not set');
      return;
    }

    const capitalizedKeyword = capitalizeWords(searchKeyword);

    spotifyApi.createPlaylist(userId, {
      name: `Ultimate ${capitalizedKeyword} Playlist`,
      description: 'My cool playlist',
      public: true
    })
      .then((data) => {
        setPlaylistResponse(data);
        setShowAlert(true);

        const trackUris = duplicateTracks.map(track => `spotify:track:${track.id}`);
        return spotifyApi.addTracksToPlaylist(data.id, trackUris);
      })
      .then(() => {
        setTimeout(() => setShowAlert(false), 5000);
      })
      .catch((err) => {
        console.error('Something went wrong!', err);
      });
  };

  const searchSpotify = (query, types) => {
    const limit = 50;
    let offset = 0;
    let totalResults = [];

    const fetchMore = () => {
      spotifyApi.search(query, types, { limit, offset })
        .then((data) => {
          const filteredPlaylists = data.playlists.items.filter(playlist => !userPlaylists.includes(playlist.id));
          totalResults = totalResults.concat(filteredPlaylists);
          if (totalResults.length < 100 && data.playlists.items.length === limit) {
            offset += limit;
            fetchMore();
          } else {
            setSearchResults(totalResults.slice(0, 100));
            fetchTracksForPlaylists(totalResults.slice(0, 100));
          }
        })
        .catch((err) => {
          console.error('Search error:', err);
        });
    };

    fetchMore();
  };

  const fetchTracksForPlaylists = (playlists) => {
    const trackCount = {};

    const updateTrackCount = (track) => {
      if (!track || !track.track || !track.track.id || !track.track.name || !track.track.artists || !track.track.artists[0]) {
        return;
      }
      const trackId = track.track.id;
      const trackName = track.track.name;
      const artistName = track.track.artists[0].name;
      const key = `${trackName} by ${artistName}`;
      if (trackCount[key]) {
        trackCount[key].count += 1;
      } else {
        trackCount[key] = { id: trackId, name: trackName, artist: artistName, count: 1 };
      }
    };

    playlists.forEach((playlist) => {
      spotifyApi.getPlaylistTracks(playlist.id)
        .then((data) => {
          const tracks = data.items || [];
          tracks.forEach(track => updateTrackCount(track));

          const duplicates = Object.values(trackCount).filter(track => track.count > 1);
          duplicates.sort((a, b) => b.count - a.count);
          setDuplicateTracks(duplicates.slice(0, 30));
        })
        .catch((err) => {
          console.error(`Error fetching tracks for playlist ${playlist.id}:`, err);
        });
    });
  };

  const handleSearch = () => {
    if (searchKeyword.trim()) {
      searchSpotify(searchKeyword, ['playlist']);
    }
  };

  const handleKeywordChange = (event) => {
    setSearchKeyword(event.target.value);
  };

  // Log the unused variables to avoid eslint errors
  console.log(playlistResponse);
  console.log(searchResults);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container className="App" sx={{ bgcolor: 'background.default', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {!accessToken ? (
          <Button
            variant="contained"
            sx={{ bgcolor: '#6183bd', color: 'white', borderRadius: '30px', p: 2, fontFamily: 'Gunnar', fontWeight: '400', textTransform: 'uppercase', filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))' }}
            onClick={login}
          >
            Connect to Spotify
          </Button>
        ) : (
          <>
            <TextField
              variant="outlined"
              fullWidth
              placeholder="Enter search keyword"
              value={searchKeyword}
              onChange={handleKeywordChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch();
                }
              }}
              sx={{ mb: 2, maxWidth: '500px' }}
            />
            <Button
              variant="contained"
              sx={{ bgcolor: '#6183bd', color: 'white', borderRadius: '30px', fontFamily: 'Gunnar', fontWeight: '400', textTransform: 'uppercase' }}
              onClick={handleSearch}
            >
              Search
            </Button>

            {duplicateTracks.length > 0 && (
              <Box sx={{ mt: 4, maxWidth: '500px', overflowY: 'auto', maxHeight: '200px', p: 2, bgcolor: 'background.paper', borderRadius: '10px' }}>
                <Typography variant="h6">Duplicate Tracks</Typography>
                <Box component="ul" sx={{ listStyleType: 'none', padding: 0 }}>
                  {duplicateTracks.map((track) => (
                    <Box component="li" key={track.id}>
                      {track.name} ({track.artist})
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {duplicateTracks.length > 0 && (
              <Button
                variant="contained"
                sx={{ mt: 2, bgcolor: '#6183bd', color: 'white', borderRadius: '30px', fontFamily: 'Gunnar', fontWeight: '400', textTransform: 'uppercase' }}
                onClick={createPlaylist}
              >
                Add to Spotify
              </Button>
            )}

            <Button
              variant="outlined"
              sx={{ mt: 2, color: '#6183bd', borderColor: '#6183bd', borderRadius: '30px', fontFamily: 'Gunnar', fontWeight: '400', textTransform: 'uppercase' }}
              onClick={logout}
            >
              Disconnect from Spotify
            </Button>
          </>
        )}

        <Snackbar
          open={showAlert}
          autoHideDuration={5000}
          onClose={() => setShowAlert(false)}
          message={`Your Ultimate ${capitalizeWords(searchKeyword)} Playlist has been added to Spotify!`}
          action={
            <IconButton size="small" aria-label="close" color="inherit" onClick={() => setShowAlert(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        />

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
          <Typography variant="body1" component="span" sx={{ mr: 2, fontFamily: 'Gunnar', fontWeight: '400' }}>
            Powered by
          </Typography>
          <img src={Logo} alt="Spotify Logo" style={{ height: '2rem', marginRight: '1rem' }} />
          <Button variant="contained" sx={{ bgcolor: '#6183bd', color: 'white', fontFamily: 'Gunnar', fontWeight: '400', borderRadius: '25px' }} href="/emails/contact/index.html">
            Contact Us!
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Home;

