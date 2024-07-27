


// import React, { useState, useEffect } from 'react';
// import SpotifyWebApi from 'spotify-web-api-js';
// import './App.css';

// const spotifyApi = new SpotifyWebApi();

// const CLIENT_ID = '711dea0afd70482cb69bfa7cfb0df205'; // Replace with your Spotify Client ID
// const REDIRECT_URI = 'http://localhost:3000/callback'; // Use one of your registered Redirect URIs
// const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
// const RESPONSE_TYPE = 'token';
// const SCOPE = 'playlist-modify-public';

// const _baseUri = 'https://api.spotify.com/v1'; // Base URI for Spotify API

// function _checkParamsAndPerformRequest(requestData, options, callback) {
//   const url = `${requestData.url}?${new URLSearchParams(requestData.params).toString()}`;
//   fetch(url, {
//     ...options,
//     headers: {
//       'Authorization': `Bearer ${spotifyApi.getAccessToken()}`,
//       'Content-Type': 'application/json',
//     },
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('Network response was not ok ' + response.statusText);
//       }
//       return response.json();
//     })
//     .then(data => callback(null, data))
//     .catch(error => callback(error));
// }

// function Constr() {}

// Constr.prototype.search = function (query, types, limit, offset, options, callback) {
//   var requestData = {
//     url: _baseUri + '/search',
//     params: {
//       q: query,
//       type: types.join(','),
//       limit: limit,
//       offset: offset
//     }
//   };
//   return _checkParamsAndPerformRequest(requestData, options, callback);
// };

// Constr.prototype.getPlaylistTracks = function (playlistId, options, callback) {
//   var requestData = {
//     url: _baseUri + '/playlists/' + playlistId + '/tracks',
//     params: {
//       limit: 30 // Limit to top 30 tracks
//     }
//   };
//   return _checkParamsAndPerformRequest(requestData, options, callback);
// };

// function App() {
//   const [playlistResponse, setPlaylistResponse] = useState(null);
//   const [accessToken, setAccessToken] = useState('');
//   const [userId, setUserId] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [searchKeyword, setSearchKeyword] = useState('');
//   const [playlistTracks, setPlaylistTracks] = useState({});
//   const [duplicateTracks, setDuplicateTracks] = useState([]);

//   useEffect(() => {
//     const hash = window.location.hash;
//     let token = window.localStorage.getItem('token');

//     if (!token && hash) {
//       token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
//       window.location.hash = "";
//       window.localStorage.setItem('token', token);
//     }

//     setAccessToken(token);
//   }, []);

//   useEffect(() => {
//     if (accessToken) {
//       spotifyApi.setAccessToken(accessToken);

//       // Get the current user's ID
//       spotifyApi.getMe()
//         .then((data) => {
//           setUserId(data.id);
//         })
//         .catch((err) => {
//           console.error('Failed to get user info', err);
//         });
//     }
//   }, [accessToken]);

//   const login = () => {
//     const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`;
//     window.location.href = authUrl;
//   };

//   const logout = () => {
//     setAccessToken('');
//     setUserId('');
//     window.localStorage.removeItem('token');
//   };

//   const capitalizeWords = (str) => {
//     return str.replace(/\b\w/g, (char) => char.toUpperCase());
//   };

//   const createPlaylist = () => {
//     if (!userId) {
//       console.error('User ID not set');
//       return;
//     }

//     const capitalizedKeyword = capitalizeWords(searchKeyword);

//     console.log("POWER PLAY", searchKeyword);
//     spotifyApi.createPlaylist(userId, {
//       name: `Ultimate ${capitalizedKeyword} Playlist`, // Use the capitalized keyword
//       description: 'My cool playlist',
//       public: true
//     })
//       .then((data) => {
//         console.log('Created playlist!', data);
//         setPlaylistResponse(data);

//         // Add duplicate tracks to the playlist
//         const trackUris = duplicateTracks.map(track => `spotify:track:${track.id}`);
//         return spotifyApi.addTracksToPlaylist(data.id, trackUris);
//       })
//       .then((data) => {
//         console.log('Added duplicate tracks to playlist!', data);
//       })
//       .catch((err) => {
//         console.error('Something went wrong!', err);
//       });
//   };

//   const searchSpotify = (query, types) => {
//     const constr = new Constr();
//     const limit = 50; // Spotify API limit per request is 50
//     let offset = 0;
//     let totalResults = [];

//     const fetchMore = () => {
//       constr.search(query, types, limit, offset, {}, (error, data) => {
//         if (error) {
//           console.error('Search error:', error);
//         } else if (data && data.playlists && data.playlists.items) {
//           totalResults = totalResults.concat(data.playlists.items);
//           if (totalResults.length < 100 && data.playlists.items.length === limit) {
//             offset += limit;
//             fetchMore();
//           } else {
//             setSearchResults(totalResults.slice(0, 100)); // Return only 100 results
//             fetchTracksForPlaylists(totalResults.slice(0, 100)); // Fetch tracks for the playlists
//           }
//         } else {
//           console.error('No playlists found');
//         }
//       });
//     };

//     fetchMore();
//   };

//   const fetchTracksForPlaylists = (playlists) => {
//     const constr = new Constr();
//     const trackCount = {};

//     const updateTrackCount = (track) => {
//       if (!track || !track.track || !track.track.id || !track.track.name || !track.track.artists || !track.track.artists[0]) {
//         return;
//       }
//       const trackId = track.track.id;
//       const trackName = track.track.name;
//       const artistName = track.track.artists[0].name;
//       const key = `${trackName} by ${artistName}`;
//       if (trackCount[key]) {
//         trackCount[key].count += 1;
//       } else {
//         trackCount[key] = { id: trackId, name: trackName, artist: artistName, count: 1 };
//       }
//     };

//     playlists.forEach((playlist) => {
//       constr.getPlaylistTracks(playlist.id, {}, (error, data) => {
//         if (error) {
//           console.error(`Error fetching tracks for playlist ${playlist.id}:`, error);
//         } else {
//           const tracks = data.items || [];
//           tracks.forEach(track => {
//             if (track.track && track.track.id) {
//               updateTrackCount(track);
//             }
//           });
//           setPlaylistTracks((prevTracks) => ({
//             ...prevTracks,
//             [playlist.id]: tracks.slice(0, 30), // Limit to top 30 tracks
//           }));

//           const duplicates = Object.values(trackCount).filter(track => track.count > 1);
//           duplicates.sort((a, b) => b.count - a.count);
//           setDuplicateTracks(duplicates.slice(0, 30)); // Limit to top 30 most frequent tracks
//         }
//       });
//     });
//   };

//   const handleSearch = () => {
//     if (searchKeyword.trim()) {
//       searchSpotify(searchKeyword, ['playlist']);
//     }
//   };

//   const handleKeywordChange = (event) => {
//     setSearchKeyword(event.target.value);
//   };

//   return (
//     <div className="App">
//       <header className="App-header">
//         <h1>Spotify Playlist Creator</h1>
//         {!accessToken ? (
//           <button onClick={login}>Log in to Spotify</button>
//         ) : (
//           <>
//             <button onClick={logout}>Log out</button>
//             <button onClick={createPlaylist} disabled={!userId || duplicateTracks.length === 0}>Create Playlist</button>
//             <div>
//               <input
//                 type="text"
//                 placeholder="Enter search keyword"
//                 value={searchKeyword}
//                 onChange={handleKeywordChange}
//               />
//               <button onClick={handleSearch}>Search Spotify</button>
//             </div>
//             {playlistResponse && (
//               <div>
//                 <h2>Playlist Created</h2>
//                 <pre>{JSON.stringify(playlistResponse, null, 2)}</pre>
//               </div>
//             )}
//             {searchResults.length > 0 && (
//               <div>
//                 <h2>Search Results</h2>
//                 <ul>
//                   {searchResults.map(playlist => (
//                     <li key={playlist.id}>
//                       <strong>{playlist.name}</strong> by {playlist.owner.display_name}
//                       {playlistTracks[playlist.id] && (
//                         <ul>
//                           {playlistTracks[playlist.id].map(track => (
//                             <li key={track.track?.id}>
//                               {track.track?.name ?? 'Unknown Track'} by {track.track?.artists?.[0]?.name ?? 'Unknown Artist'}
//                             </li>
//                           ))}
//                         </ul>
//                       )}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//             {duplicateTracks.length > 0 && (
//               <div>
//                 <h2>Duplicate Tracks</h2>
//                 <ul>
//                   {duplicateTracks.map(track => (
//                     <li key={track.id}>
//                       {track.name} by {track.artist} - {track.count} times
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}
//           </>
//         )}
//       </header>
//     </div>
//   );
// }

// export default App;

import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import './App.css';

const spotifyApi = new SpotifyWebApi();

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
const AUTH_ENDPOINT = process.env.REACT_APP_SPOTIFY_AUTH_ENDPOINT;
const RESPONSE_TYPE = process.env.REACT_APP_SPOTIFY_RESPONSE_TYPE;
const SCOPE = process.env.REACT_APP_SPOTIFY_SCOPE;

const _baseUri = 'https://api.spotify.com/v1'; // Base URI for Spotify API

function _checkParamsAndPerformRequest(requestData, options, callback) {
  const url = `${requestData.url}?${new URLSearchParams(requestData.params).toString()}`;
  fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${spotifyApi.getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => callback(null, data))
    .catch(error => callback(error));
}

function Constr() {}

Constr.prototype.search = function (query, types, limit, offset, options, callback) {
  var requestData = {
    url: _baseUri + '/search',
    params: {
      q: query,
      type: types.join(','),
      limit: limit,
      offset: offset
    }
  };
  return _checkParamsAndPerformRequest(requestData, options, callback);
};

Constr.prototype.getPlaylistTracks = function (playlistId, options, callback) {
  var requestData = {
    url: _baseUri + '/playlists/' + playlistId + '/tracks',
    params: {
      limit: 30 // Limit to top 30 tracks
    }
  };
  return _checkParamsAndPerformRequest(requestData, options, callback);
};

function App() {
  const [playlistResponse, setPlaylistResponse] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [playlistTracks, setPlaylistTracks] = useState({});
  const [duplicateTracks, setDuplicateTracks] = useState([]);

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

      // Get the current user's ID
      spotifyApi.getMe()
        .then((data) => {
          setUserId(data.id);
        })
        .catch((err) => {
          console.error('Failed to get user info', err);
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

    console.log("POWER PLAY", searchKeyword);
    spotifyApi.createPlaylist(userId, {
      name: `Ultimate ${capitalizedKeyword} Playlist`, // Use the capitalized keyword
      description: 'My cool playlist',
      public: true
    })
      .then((data) => {
        console.log('Created playlist!', data);
        setPlaylistResponse(data);

        // Add duplicate tracks to the playlist
        const trackUris = duplicateTracks.map(track => `spotify:track:${track.id}`);
        return spotifyApi.addTracksToPlaylist(data.id, trackUris);
      })
      .then((data) => {
        console.log('Added duplicate tracks to playlist!', data);
      })
      .catch((err) => {
        console.error('Something went wrong!', err);
      });
  };

  const searchSpotify = (query, types) => {
    const constr = new Constr();
    const limit = 50; // Spotify API limit per request is 50
    let offset = 0;
    let totalResults = [];

    const fetchMore = () => {
      constr.search(query, types, limit, offset, {}, (error, data) => {
        if (error) {
          console.error('Search error:', error);
        } else if (data && data.playlists && data.playlists.items) {
          totalResults = totalResults.concat(data.playlists.items);
          if (totalResults.length < 100 && data.playlists.items.length === limit) {
            offset += limit;
            fetchMore();
          } else {
            setSearchResults(totalResults.slice(0, 100)); // Return only 100 results
            fetchTracksForPlaylists(totalResults.slice(0, 100)); // Fetch tracks for the playlists
          }
        } else {
          console.error('No playlists found');
        }
      });
    };

    fetchMore();
  };

  const fetchTracksForPlaylists = (playlists) => {
    const constr = new Constr();
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
      constr.getPlaylistTracks(playlist.id, {}, (error, data) => {
        if (error) {
          console.error(`Error fetching tracks for playlist ${playlist.id}:`, error);
        } else {
          const tracks = data.items || [];
          tracks.forEach(track => {
            if (track.track && track.track.id) {
              updateTrackCount(track);
            }
          });
          setPlaylistTracks((prevTracks) => ({
            ...prevTracks,
            [playlist.id]: tracks.slice(0, 30), // Limit to top 30 tracks
          }));

          const duplicates = Object.values(trackCount).filter(track => track.count > 1);
          duplicates.sort((a, b) => b.count - a.count);
          setDuplicateTracks(duplicates.slice(0, 30)); // Limit to top 30 most frequent tracks
        }
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

  return (
    <div className="App">
      <header className="App-header">
        <h1>Spotify Playlist Creator</h1>
        {!accessToken ? (
          <button onClick={login}>Log in to Spotify</button>
        ) : (
          <>
            <button onClick={logout}>Log out</button>
            <button onClick={createPlaylist} disabled={!userId || duplicateTracks.length === 0}>Create Playlist</button>
            <div>
              <input
                type="text"
                placeholder="Enter search keyword"
                value={searchKeyword}
                onChange={handleKeywordChange}
              />
              <button onClick={handleSearch}>Search Spotify</button>
            </div>
            {playlistResponse && (
              <div>
                <h2>Playlist Created</h2>
                <pre>{JSON.stringify(playlistResponse, null, 2)}</pre>
              </div>
            )}
            {searchResults.length > 0 && (
              <div>
                <h2>Search Results</h2>
                <ul>
                  {searchResults.map(playlist => (
                    <li key={playlist.id}>
                      <strong>{playlist.name}</strong> by {playlist.owner.display_name}
                      {playlistTracks[playlist.id] && (
                        <ul>
                          {playlistTracks[playlist.id].map(track => (
                            <li key={track.track?.id}>
                              {track.track?.name ?? 'Unknown Track'} by {track.track?.artists?.[0]?.name ?? 'Unknown Artist'}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {duplicateTracks.length > 0 && (
              <div>
                <h2>Duplicate Tracks</h2>
                <ul>
                  {duplicateTracks.map(track => (
                    <li key={track.id}>
                      {track.name} by {track.artist} - {track.count} times
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </header>
    </div>
  );
}

export default App;
