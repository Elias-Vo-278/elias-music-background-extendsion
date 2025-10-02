// chrome-extension/service-worker.js

const OFFSCREEN_PATH = 'offscreen.html';
const BACKEND_API = 'http://localhost:3000/api/music';

let currentTopic = ''; // State to store the last played topic

// ----------------------------------------------------
// Offscreen Document Management
// ----------------------------------------------------

// Utility function to check and create the offscreen document
async function setupOffscreenDocument(path) {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (contexts.length > 0) return; // Document is already open

    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'To play persistent background music'
    });
}

// ----------------------------------------------------
// API and Playback Logic
// ----------------------------------------------------

async function fetchAndPlayMusic(topic) {
    currentTopic = topic;
    await setupOffscreenDocument(OFFSCREEN_PATH);

    try {
        // 1. Fetch data from your backend API
        const response = await fetch(`${BACKEND_API}?topic=${topic}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const { title, artist, music_url, image_query } = data;

        // 2. Save current state to storage for the popup/content script to read
        await chrome.storage.local.set({ 
            isPlaying: true,
            currentSong: { title, artist, topic, image_query },
            musicUrl: music_url
        });
        
        // 3. Send the music URL to the offscreen document to start playing
        chrome.runtime.sendMessage({
            action: 'play',
            target: 'offscreen',
            url: music_url
        });

        console.log(`Now playing: ${title} by ${artist} (Topic: ${topic})`);
        
    } catch (error) {
        console.error('Failed to fetch and play music:', error);
        // Clean up or send error message to popup
    }
}

// ----------------------------------------------------
// Service Worker Listener
// ----------------------------------------------------

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Command from the Popup to start/change music
    if (message.action === 'play-topic') {
        fetchAndPlayMusic(message.topic);
    } 
    // Command from the Popup to stop music
    else if (message.action === 'stop-music') {
        // 1. Send stop message to offscreen document
        chrome.runtime.sendMessage({
            action: 'stop',
            target: 'offscreen'
        });
        // 2. Clear state
        chrome.storage.local.set({ isPlaying: false, currentSong: null });
    }
    // Command from the offscreen document when a song ends
    else if (message.action === 'song-ended' && currentTopic) {
        // Automatically play the next song in the same topic
        fetchAndPlayMusic(currentTopic);
    }
});