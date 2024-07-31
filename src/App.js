

import React, { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';
import './App.css';
import './tailwind.css';
import './fonts.css'; // Import the fonts.css file
import 'animate.css';

import HeadphonesImg from './Headphones.png'; // Adjust the path according to your project structure
import MusicNote from './Group 5.png';
import Logo from './Spotify_Logo_RGB_Black.png';

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
  const [userName, setUserName] = useState(''); // State for storing user's name
  const [searchResults, setSearchResults] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [playlistTracks, setPlaylistTracks] = useState({});
  const [duplicateTracks, setDuplicateTracks] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]); // State for storing user's playlists

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

      // Get the current user's ID and name
      spotifyApi.getMe()
        .then((data) => {
          setUserId(data.id);
          setUserName(data.display_name); // Store the user's name
        })
        .catch((err) => {
          console.error('Failed to get user info', err);
        });

      // Fetch user's playlists
      spotifyApi.getUserPlaylists()
        .then((data) => {
          setUserPlaylists(data.items.map(playlist => playlist.id)); // Store user's playlists IDs
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
    setUserName(''); // Clear the user's name
    setUserPlaylists([]); // Clear the user's playlists
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
        setShowAlert(true);

        // Add duplicate tracks to the playlist
        const trackUris = duplicateTracks.map(track => `spotify:track:${track.id}`);
        return spotifyApi.addTracksToPlaylist(data.id, trackUris);
      })
      .then((data) => {
        console.log('Added duplicate tracks to playlist!', data);
        setTimeout(() => setShowAlert(false), 5000);
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
          // Filter out user's playlists from the search results
          const filteredPlaylists = data.playlists.items.filter(playlist => !userPlaylists.includes(playlist.id));
          totalResults = totalResults.concat(filteredPlaylists);
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
    <div className="App w-full bg-custom-purple w-screen h-screen bg-custom-dark-purple flex flex-col relative">
      <div
        className="w-full h-[100px] flex-shrink-0 bg-custom-pink shadow-custom"
        style={{
          boxShadow: '-10px 10px 0px 0px #FFD240',
        }}
      ></div>
  
      <header className="App-header">
      <div className="absolute top-[50px] left-1/2 transform -translate-x-1/2 md:top-0 md:right-0 md:left-auto md:transform-none mr-[5em] md:mt-[-40px] md:mr-[5em]">
        <h1
          className="flex flex-col justify-center w-[300px] h-[100px] text-center md:text-right font-gunnar md:font-yearsync text-[60px] md:w-[865px] md:h-[300px] md:text-[150px] font-normal uppercase text-primary shadow-text"
        >
          Clip Hits
        </h1>
      </div>
        {!accessToken ? (
          <>
          <div
            className="absolute top-[150px] left-1/2 transform -translate-x-1/2 w-[400px] h-[400px] sm:top-[-40px] sm:w-[750px] sm:h-[750px] lg:left-0 lg:transform-none lg:ml-20 bg-no-repeat bg-cover lg:animate-jello-lg"
            style={{ 
              filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))',
              backgroundImage: `url(${HeadphonesImg})` 
            }}
          ></div>

          <div className="relative flex-grow">
            <div className="relative w-full h-full">
              <div className="absolute top-0 right-0 lg:block hidden" style={{ marginTop: '8em', marginRight: '5em' }}>
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

                    <div className="absolute top-[165px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                      1
                    </div>
                    <div className="absolute top-[277px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                      2
                    </div>
                    <div className="absolute top-[389px] left-[-10px] w-[576px] text-center text-[#A199D5] text-[20px] font-gunnar font-normal uppercase break-words">
                      3
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            className="absolute bottom-[65px] sm:bottom-0 w-[120px] h-[120px] sm:w-[260px] sm:h-[260px] flex-shrink-0 rounded-full border-[9px] text-center font-gunnar font-normal text-[15px] sm:text-[30px] uppercase mb-[310px] text-custom-dark-purple hover:text-white left-1/2 transform -translate-x-1/2 lg:left-[20rem] lg:translate-x-0 whitespace-pre-line"
            style={{
              borderColor: '#E6A7D4',
              backgroundColor: '#FFD240',
              lineHeight: 'normal',
              filter: 'drop-shadow(-10px 10px 4px rgba(0, 0, 0, 0.25))',
            }}
            onClick={login}
          >
            Connect to{"\n"}Spotify
          </button>

        </>
        ) : (
          <>
            <div style={{ width: '100%', height: '20%', position: 'relative', marginTop: '80px', right: '85px' }}>
              <div
                className="hover:bg-custom-yellow"
                style={{
                  width: 200,
                  height: 40,
                  right: 0,
                  top: 0,
                  position: 'absolute',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '20px',
                  border: '3px #53498E solid',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={logout}
              >
                <div
                  style={{
                    width: 181.21,
                    height: 40,
                    textAlign: 'center',
                    color: '#53498E',
                    fontSize: 13.33,
                    fontFamily: 'Gunnar',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    wordWrap: 'break-word',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  disconnect from spotify
                </div>
              </div>
            </div>
              
            <div className="flex flex-col items-center justify-center font-gunnar" style={{ width: '100%', marginTop: '50px', position: 'relative' }}>
              <div className="relative" style={{ width: '500px', height: '75px' }}>
                <div
                  className="absolute bg-transparent border-5 border-custom-dark-purple rounded-30 flex items-center justify-center"
                  style={{ width: '497.24px', height: '75px' }}
                >
                  <div
                    className="w-full h-full bg-white rounded-25"
                    style={{ boxSizing: 'border-box' }}
                  />
                </div>
  
                <div
                  className="absolute flex items-center justify-start"
                  style={{ width: '400px', height: '75px', left: '10px' }}
                >
                  <input
                    className="input input-bordered w-full max-w-xs text-custom-dark-purple"
                    type="text"
                    placeholder="Enter search keyword"
                    value={searchKeyword}
                    onChange={handleKeywordChange}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    style={{
                      width: '100%',
                      height: '86%',
                      borderRadius: '20px',
                      padding: '0 10px',
                      outline: 'none', // Remove the blue border
                      boxShadow: 'none', // Remove the box shadow
                      position: 'relative',
                      zIndex: 1
                    }}
                  />
                </div>
  
                <button
                  className="absolute left-[352px] w-[145.72px] h-[75px] flex items-center justify-center text-white bg-custom-dark-purple hover:bg-custom-yellow rounded-r-30 font-gunnar font-normal text-20 uppercase transition-colors duration-300 cursor-pointer"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>
  
              {duplicateTracks.length > 0 && (
                <div
                  className="mt-4 w-full flex justify-center"
                  style={{
                    height: '200px',
                    width: '500px',
                    overflowY: 'scroll',
                    background: 'white',
                    boxShadow: '-10px 10px 0px rgba(0, 0, 0, 0.25)',
                    borderRadius: 30,
                    position: 'absolute',
                    top: '90px' // Ensure this is beneath the search input
                  }}
                >
                  <ul className="list-inside text-custom-dark-purple text-left pt-4 pr-6 pb-4 pl-6 "
                      style={{
                        height: '200px',
                        width: '500px',
                      }}
                  >
                    {duplicateTracks.map((track) => (
                      <li key={track.id}>
                        {track.name} ({track.artist})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
  
                {duplicateTracks.length > 0 && (
                <div className="flex justify-center mt-4" style={{ position: 'absolute', top: '320px' }}>
                  <button
                    className="btn btn-primary transition-shadow duration-300 ease-in-out hover:shadow-lg"
                    onClick={createPlaylist}
                    style={{
                      backgroundColor: '#53498E',
                      color: '#FFD240',
                      borderRadius: '30px',
                      padding: '10px 20px',
                      fontSize: '15px',
                      fontFamily: 'Gunnar',
                      fontWeight: '400',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    Add to Spotify
                  </button>
                </div>
              )}
            </div>

            {showAlert && playlistResponse && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">

              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <div style={{
                  width: '250px',
                  height: '100px',
                  position: 'relative',
                  background: '#FFD240',
                  boxShadow: '-10px 10px 0px rgba(0, 0, 0, 0.25)',
                  borderRadius: '30px'
                }} />
                <div style={{
                  width: '250px',
                  height: '100px',
                  position: 'absolute',
                  textAlign: 'center',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    color: 'white',
                    fontSize: '15px',
                    fontFamily: 'Gunnar',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    wordWrap: 'break-word'
                  }}>Your</span>
                  <span style={{
                    color: '#53498E',
                    fontSize: '15px',
                    fontFamily: 'Gunnar',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    wordWrap: 'break-word'
                  }}> Ultimate {capitalizeWords(searchKeyword)} Playlist </span>
                  <span style={{
                    color: 'white',
                    fontSize: '15px',
                    fontFamily: 'Gunnar',
                    fontWeight: '400',
                    textTransform: 'uppercase',
                    wordWrap: 'break-word'
                  }}>has been added to Spotify!</span>
                </div>
              </div>
            </div>
          )}

          </>
        )}
      </header>
      <div className="fixed bottom-3 left-10 sm:left-1/2 sm:transform sm:-translate-x-1/2 flex items-center whitespace-nowrap">
        <span className="mr-2 text-black font-gunnar text-lg sm:text-base">Powered by</span>
        <img src={Logo} alt="Spotify Logo" className="h-12 mr-2 ml-2 sm:h-8 sm:mr-1 sm:ml-1" />
        <span className="transform sm:translate-y-1 sm:translate-y-0">
          <a href="/emails/contact/index.html" className="bg-custom-dark-purple text-white font-gunnar text-lg sm:text-base py-2 px-4 sm:py-1 sm:px-2 rounded-25">
            Contact Us!
          </a>
        </span>
      </div>

    </div>
  );
}

export default App;
