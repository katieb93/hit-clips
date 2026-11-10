import React, { useState } from 'react';
import axios from 'axios';

const Searcher = ({ token, userId }) => {
    const [keyword, setKeyword] = useState('');
    const [tracks, setTracks] = useState([]);
    const [trackCounts, setTrackCounts] = useState({});

    const handleSearch = async () => {
        setTracks([]);
        setTrackCounts({});

        try {
            const response = await axios.get('https://api.spotify.com/v1/search', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    q: encodeURIComponent(keyword),
                    type: 'playlist',
                    limit: 50
                }
            });

            const playlists = response.data.playlists.items.filter(playlist => playlist.owner.id !== userId);
            const allTracks = await Promise.all(playlists.map(async (playlist) => fetchTracks(playlist.id)));
            const allTracksFlat = allTracks.flat();

            const counts = {};
            allTracksFlat.forEach(track => {
                if (track && track.id && track.name) {
                    if (counts[track.id]) {
                        counts[track.id].count += 1;
                    } else {
                        counts[track.id] = { count: 1, ...track };
                    }
                }
            });

            const sortedTracks = Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 30);

            setTracks(sortedTracks);
            setTrackCounts(counts);

            const newPlaylist = await createPlaylist(userId, token);
            if (newPlaylist) {
                const uris = sortedTracks.map(track => track.uri);
                await addTracks(newPlaylist.id, uris, token);
            }
        } catch (error) {
            console.error('Error in handleSearch:', error);
        }
    };

    const fetchTracks = async (playlistId) => {
        try {
            const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data.items.map(item => item.track);
        } catch (error) {
            console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
            return [];
        }
    };

    const createPlaylist = async (userId, token) => {
        try {
            const response = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                name: "Ultimate Playlist",
                description: "New playlist description",
                public: false
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error creating playlist:`, error);
            return null;
        }
    };

    const addTracks = async (playlistId, uris, token) => {
        try {
            const response = await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                uris: uris,
                position: 0
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error adding tracks to playlist:`, error);
            return null;
        }
    };

    return (
        <div>
            <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter keyword"
            />
            <button onClick={handleSearch}>Search</button>

            {tracks.length > 0 && (
                <div>
                    <h2>Tracks</h2>
                    <ul>
                        {tracks.map((track) => (
                            <li key={track.id}>
                                {track.name} by {track.artists.map((artist) => artist.name).join(', ')} ({track.count} times)
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Searcher;
