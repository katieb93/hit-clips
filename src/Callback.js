import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyApi = new SpotifyWebApi();

function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem('token');

    if (!token && hash) {
      token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1];
      window.location.hash = "";
      window.localStorage.setItem('token', token);
    }

    if (token) {
      spotifyApi.setAccessToken(token);
      navigate('/');  // Redirect to the main page after setting the token
    } else {
      console.error('No access token found');
    }
  }, [navigate]);

  return <div>Loading...</div>;
}

export default Callback;
