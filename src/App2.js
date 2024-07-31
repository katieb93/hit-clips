
// import React, { useState, useEffect } from 'react';
// import SpotifyWebApi from 'spotify-web-api-js';
// import './App.css';
// import './tailwind.css';
// import HeadphonesImg from './Headphones.png'; // Adjust the path according to your project structure


// const spotifyApi = new SpotifyWebApi();

// const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
// const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

// const REDIRECT_URI = process.env.REACT_APP_SPOTIFY_REDIRECT_URI;
// const AUTH_ENDPOINT = process.env.REACT_APP_SPOTIFY_AUTH_ENDPOINT;
// const RESPONSE_TYPE = process.env.REACT_APP_SPOTIFY_RESPONSE_TYPE;
// const SCOPE = process.env.REACT_APP_SPOTIFY_SCOPE;

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
//     <div
//       className="App w-full bg-very-light-pink w-screen h-screen text-purple-500 flex flex-col relative"
//       // style={{
//       //   width: '100vw',
//       //   height: '100vh',
//       // }}
//     >

//       <div
//         // className="w-full h-[100px] flex-shrink-0 bg-custom-pink shadow-custom"
//         className="w-full h-[100px] flex-shrink-0 bg-custom-pink shadow-custom"

//         style={{
//           boxShadow: '-10px 10px 0px 0px #FFD240',
//         }}
//       ></div>
//       <div
//         className="absolute bottom-0 w-full h-[300px] flex-shrink-0"
//         style={{
//           backgroundColor: '#A199D5',
//         }}
//       ></div>

//       <div
//         className="absolute top-[-40px] left-0 ml-20 w-[750px] h-[750px] bg-no-repeat bg-cover"
//         style={{ backgroundImage: `url(${HeadphonesImg})` }}
//       ></div>
// {/* 
//       <div
//         className="w-[1825px] h-[100px] flex-shrink-0 bg-custom-pink shadow-custom"
//         style={{
//           boxShadow: '-10px 10px 0px 0px #FFD240',
//         }}
//       ></div> */}
  
//       {/* <div style={{ width: '100%', height: '100%', background: '#A199D5' }} /> */}
  
//       <div className="relative flex-grow">
//         <div className="relative w-full h-full">
//           <div className="absolute top-0 right-0" style={{ marginTop: '8em', marginRight: '5em' }}>
//             <div className="relative w-[425px] h-[450px] bg-white shadow-[rgba(0,0,0,0.25)] rounded-[30px]">

//               <div className="absolute top-[-10px] w-[425px] h-[100px] bg-[#FFD240] flex items-end justify-center"
//                   style={{ borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}>
//                 <div className="w-[576px] text-center text-[#53498E] text-[30px] font-gunnar font-normal uppercase break-words pb-6">
//                   Making playlists is our jam:
//                 </div>
//               </div>

//               <div className="relative" style={{ top: '-60px', left: '-60px' }}>
//                 <div className="absolute top-[420px] left-[80px] w-[387px] h-[53px] text-center text-[#53498E] text-[25px] font-gunnar font-normal uppercase leading-[30px] break-words">
//                   You get your ultimate favorite thing playlist
//                 </div>
//                 <div className="absolute top-[308px] left-[80px] w-[387px] h-[52px] text-center text-[#53498E] text-[25px] font-gunnar font-normal uppercase leading-[30px] break-words">
//                   We find Spotify's top tracks & mix them all together
//                 </div>
//                 <div className="absolute top-[199px] left-[80px] w-[387px] h-[54px] text-center text-[#53498E] text-[25px] font-gunnar font-normal uppercase leading-[30px] break-words">
//                   You search for any of your favorite things
//                 </div>

//                 <div className="absolute top-[155px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[25px] font-gunnar font-normal uppercase break-words">
//                   1
//                 </div>
//                 <div className="absolute top-[267px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[25px] font-gunnar font-normal uppercase break-words">
//                   2
//                 </div>
//                 <div className="absolute top-[379px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[25px] font-gunnar font-normal uppercase break-words">
//                   3
//                 </div>

//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

  
//       <header className="App-header">

//       <div className="absolute top-0 right-0" style={{ marginTop: '-40px', marginRight: '5em' }}>
//           <h1
//             className="flex flex-col justify-center w-[865px] h-[300px] flex-shrink-0 text-right font-yearsync text-[150px] font-normal uppercase"
//             style={{
//               color: '#53498E',
//               textShadow: '-10px 10px 0px #FFD240',
//               lineHeight: 'normal',
//             }}
//           >
//             Clip Hits
//           </h1>
//         </div>

//         {!accessToken ? (
//           <button
//           className="absolute bottom-0 w-[260px] h-[260px] flex-shrink-0 rounded-full border-[9px] text-center font-gunnar text-[30px] font-normal uppercase left-[20rem] mb-[310px]"
//           style={{
//               borderColor: '#E6A7D4',
//               backgroundColor: '#FFD240',
//               color: '#53498E',
//               lineHeight: 'normal',
//               filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))',
//             }}
//             onClick={login}
//           >
//             Connect to Spotify
//           </button>
//         ) : (
//           <>
//             <button className="btn btn-secondary" onClick={logout}>
//               Log out
//             </button>
//             <button
//               className="btn btn-success"
//               onClick={createPlaylist}
//               disabled={!userId || duplicateTracks.length === 0}
//             >
//               Create Playlist
//             </button>
//             <div className="my-4">
//               <input
//                 className="input input-bordered w-full max-w-xs"
//                 type="text"
//                 placeholder="Enter search keyword"
//                 value={searchKeyword}
//                 onChange={handleKeywordChange}
//               />
//               <button className="btn btn-accent ml-2" onClick={handleSearch}>
//                 Search Spotify
//               </button>
//             </div>
//             {playlistResponse && (
//               <div className="alert alert-success">
//                 <h2>Playlist Created</h2>
//                 <pre>{JSON.stringify(playlistResponse, null, 2)}</pre>
//               </div>
//             )}
//             {duplicateTracks.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-semibold">Duplicate Tracks</h2>
//                 <ul className="list-disc list-inside">
//                   {duplicateTracks.map((track) => (
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
import './tailwind.css';
import './fonts.css'; // Import the fonts.css file

import HeadphonesImg from './Headphones.png'; // Adjust the path according to your project structure
import MusicNote from './Group 5.png'


const spotifyApi = new SpotifyWebApi();

const CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
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
    <div
      className="App w-full bg-custom-purple w-screen h-screen text-purple-500 flex flex-col relative"
    >

      <div
        className="w-full h-[100px] flex-shrink-0 bg-custom-pink shadow-custom"
        style={{
          boxShadow: '-10px 10px 0px 0px #FFD240',
        }}
      ></div>
      {/* <div
        className="absolute bottom-0 w-full h-[300px] flex-shrink-0"
        style={{
          backgroundColor: '#A199D5',
        }}
      ></div> */}

      <div
        className="absolute top-[-40px] left-0 ml-20 w-[750px] h-[750px] bg-no-repeat bg-cover"
        style={{ 
          filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))',
          backgroundImage: `url(${HeadphonesImg})` 
        }}

      ></div>

      
  
      <div className="relative flex-grow">
        <div className="relative w-full h-full">
          <div className="absolute top-0 right-0" style={{ marginTop: '8em', marginRight: '5em' }}>
            <div className="relative w-[425px] h-[450px] bg-white shadow-[rgba(0,0,0,0.25)] rounded-[30px]">

              <div className="absolute top-[-10px] w-[425px] h-[100px] bg-[#FFD240] flex items-end justify-center"
                  style={{ borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}>
                <div className="w-[576px] text-center text-[#53498E] text-[30px] font-gunnar font-normal uppercase break-words pb-6">
                  Making playlists is our jam
                </div>
              </div>

              <div className="relative" style={{ top: '-60px', left: '-60px' }}>
                <div className="absolute top-[420px] left-[80px] w-[387px] h-[53px] text-center text-[#53498E] text-[20px] font-gunnar font-normal uppercase leading-[30px] break-words">
                  You get your ultimate favorite thing playlist
                </div>
                <div className="absolute top-[308px] left-[80px] w-[387px] h-[52px] text-center text-[#53498E] text-[20px] font-gunnar font-normal uppercase leading-[30px] break-words">
                  We find Spotify's top tracks & mix them all together
                </div>
                <div className="absolute top-[199px] left-[80px] w-[387px] h-[54px] text-center text-[#53498E] text-[20px] font-gunnar font-normal uppercase leading-[30px] break-words">
                  You search for any of your favorite things
                </div>

                <div className="absolute top-[155px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                  1
                </div>
                <div className="absolute top-[267px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                  2
                </div>
                <div className="absolute top-[379px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                  3
                </div>



              </div>
            </div>
          </div>
        </div>
      </div>

  
      <header className="App-header">

        <div className="absolute top-0 right-0" style={{ marginTop: '-40px', marginRight: '5em' }}>
          <h1
            className="flex flex-col justify-center w-[865px] h-[300px] flex-shrink-0 text-right font-yearsync text-[150px] font-normal uppercase"
            style={{
              color: '#53498E',
              textShadow: '-10px 10px 0px #FFD240',
              lineHeight: 'normal',
            }}
          >
            Clip Hits
          </h1>
        </div>


        {!accessToken ? (
          <button
            className="absolute bottom-0 w-[260px] h-[260px] flex-shrink-0 rounded-full border-[9px] text-center font-gunnar font-normal text-[30px] uppercase left-[20rem] mb-[310px]"
            style={{
              borderColor: '#E6A7D4',
              backgroundColor: '#FFD240',
              color: '#53498E',
              lineHeight: 'normal',
              filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))',
            }}
            onClick={login}
          >
            Connect to Spotify
          </button>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={logout}>
              Log out
            </button>
            <button
              className="btn btn-success"
              onClick={createPlaylist}
              disabled={!userId || duplicateTracks.length === 0}
            >
              Create Playlist
            </button>
            <div className="my-4">
              <input
                className="input input-bordered w-full max-w-xs"
                type="text"
                placeholder="Enter search keyword"
                value={searchKeyword}
                onChange={handleKeywordChange}
              />
              <button className="btn btn-accent ml-2" onClick={handleSearch}>
                Search Spotify
              </button>
            </div>
            {playlistResponse && (
              <div className="alert alert-success">
                <h2>Playlist Created</h2>
                <pre>{JSON.stringify(playlistResponse, null, 2)}</pre>
              </div>
            )}
            {duplicateTracks.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold">Duplicate Tracks</h2>
                <ul className="list-disc list-inside">
                  {duplicateTracks.map((track) => (
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
