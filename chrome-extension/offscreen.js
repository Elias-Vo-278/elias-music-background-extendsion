// chrome-extension/offscreen.js

const player = document.getElementById('music-player');

// ----------------------------------------------------
// Message Listener: Handles commands from the Service Worker
// ----------------------------------------------------
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target !== 'offscreen') {
        return; // Ignore messages not meant for the offscreen document
    }

    if (message.action === 'play') {
        player.src = message.url;
        try {
            await player.play();
            console.log('Audio playback started for:', message.url);
        } catch (error) {
            console.error('Playback failed:', error);
        }
    } else if (message.action === 'stop') {
        player.pause();
        player.currentTime = 0; // Rewind
        player.src = '';         // Clear source
        console.log('Audio playback stopped.');
    }
});

// Optional: Auto-play next song (looping feature)
player.addEventListener('ended', async () => {
    console.log('Song ended. Requesting next song...');
    
    // Notify the service worker to fetch and play the next random track
    chrome.runtime.sendMessage({ 
        action: 'song-ended', 
        target: 'service-worker' 
    });
});

// Optional: Loop a single song if needed for testing (comment out when done)
// player.loop = true;