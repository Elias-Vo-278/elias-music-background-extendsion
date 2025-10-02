// music-api-server/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Load data from the JSON file
const musicDataPath = path.join(__dirname, 'data.json');
let musicCatalog = [];
try {
    const data = fs.readFileSync(musicDataPath, 'utf8');
    musicCatalog = JSON.parse(data);
    console.log(`Loaded ${musicCatalog.length} songs from data.json.`);
} catch (error) {
    console.error('Error loading music data:', error.message);
}

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------

// Allow all origins (essential for Chrome Extension access)
app.use(cors()); 

// ----------------------------------------------------
// API Endpoint
// ----------------------------------------------------

// Endpoint to get a random song based on topic
app.get('/api/music', (req, res) => {
    const topic = req.query.topic;

    if (!topic) {
        return res.status(400).json({ error: 'Topic query parameter is required.' });
    }

    // Filter songs by the requested topic (case-insensitive)
    const filteredSongs = musicCatalog.filter(song => 
        song.topics.some(t => t.toLowerCase() === topic.toLowerCase())
    );

    if (filteredSongs.length === 0) {
        return res.status(404).json({ error: `No music found for topic: ${topic}` });
    }

    // Select a random song
    const randomIndex = Math.floor(Math.random() * filteredSongs.length);
    const selectedSong = filteredSongs[randomIndex];

    // Return the required data to the extension
    res.json({
        title: selectedSong.title,
        artist: selectedSong.artist,
        music_url: selectedSong.music_url,
        image_query: selectedSong.image_query
    });
});

// ----------------------------------------------------
// Server Start
// ----------------------------------------------------

app.listen(PORT, () => {
    console.log(`\n🎉 Music API Server running on http://localhost:${PORT}`);
    console.log(`\nTesting Example: http://localhost:${PORT}/api/music?topic=Lofi`);
});