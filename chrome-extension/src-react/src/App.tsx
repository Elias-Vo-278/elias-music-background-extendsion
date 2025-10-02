import { useState, useEffect } from 'react';
// Import or define the minimal CSS file (App.css)
import './App.css'; 

// --- 1. Interface Definitions ---

// Define the shape of the music data received from the API/stored in Chrome Storage
interface SongData {
  title: string;
  artist: string;
  topic: string;
  image_query: string;
}

// Define the shape of data stored in chrome.storage.local
interface StorageData {
  isPlaying?: boolean;
  currentSong?: SongData | null;
}

// Define the shape of messages sent between components/workers
interface Message {
  action: 'play-topic' | 'stop-music' | 'song-started' | 'state-updated';
  target: 'service-worker' | 'offscreen';
  topic?: string;
  url?: string;
}


const TOPICS: string[] = ['Lofi', 'Fantasy', 'Space', 'Synthwave'];

function App() {
  const [status, setStatus] = useState<string>('Select a mood to start.');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSong, setCurrentSong] = useState<SongData | null>(null);

  // --- Utility to Communicate with Service Worker ---
  const sendMessageToServiceWorker = (action: Message['action'], payload: Partial<Message> = {}) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        // We ensure the target is explicitly set for clarity, though we define it here
        const message: Message = { action, target: 'service-worker', ...payload } as Message;
        chrome.runtime.sendMessage(message);
    } else {
        console.warn("Chrome Extension environment not detected. Cannot send message.");
    }
  };

  // --- Topic/Play Handler ---
  const handleTopicChange = (topic: string) => {
    setStatus(`Loading ${topic} music...`);
    setIsPlaying(true);
    setCurrentSong(null);
    sendMessageToServiceWorker('play-topic', { topic });
  };

  // --- Stop Handler ---
  const handleStopClick = () => {
    sendMessageToServiceWorker('stop-music');
    // Update local state immediately for fast feedback
    setStatus('Music stopped. Select a mood to start.');
    setIsPlaying(false);
    setCurrentSong(null);
  };

  // --- Load and Update State from Chrome Storage ---
  const loadStateFromStorage = (): void => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // TypeScript requires a string array for keys
      chrome.storage.local.get(['isPlaying', 'currentSong'], (result: StorageData) => {
        const { isPlaying: storedIsPlaying = false, currentSong: storedCurrentSong = null } = result;

        setIsPlaying(storedIsPlaying);
        setCurrentSong(storedCurrentSong);
        
        if (storedIsPlaying && storedCurrentSong) {
          setStatus(`Playing: ${storedCurrentSong.title} by ${storedCurrentSong.artist}`);
        } else {
          setStatus('Select a mood to start.');
        }
      });
    }
  };

  useEffect(() => {
    // 1. Load state immediately when the popup opens
    loadStateFromStorage();

    // 2. Listener for real-time updates from the Service Worker
    const listener = (message: Message) => {
        // We only care about messages indicating a change in playback status
        if (message.action === 'song-started' || message.action === 'state-updated' || message.action === 'stop-music') {
            loadStateFromStorage();
        }
    };
    
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.onMessage.addListener(listener);
    }
    
    // Cleanup the listener when the component unmounts
    return () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.removeListener(listener);
        }
    };
  }, []); // Empty dependency array ensures it runs only on mount/unmount

  return (
    <div className="app-container">
      <h1>Mood Music Player 🎶</h1>
      
      <h2>Select Mood:</h2>
      <div className="topic-buttons">
        {TOPICS.map((topic) => (
          <button 
            key={topic} 
            onClick={() => handleTopicChange(topic)}
            // Disable button if this topic is already playing
            disabled={isPlaying && currentSong?.topic === topic}
          >
            {topic}
          </button>
        ))}
      </div>

      <hr className="divider" />

      <h2>Status:</h2>
      <div className="status-box">
        {currentSong ? (
            <p className="song-info">
                <strong>Playing:</strong> {currentSong.title} by {currentSong.artist} 
                <br/>
                <span className="topic-tag">Topic: {currentSong.topic}</span>
            </p>
        ) : (
            <p>{status}</p>
        )}
      </div>

      {isPlaying && (
        <button className="stop-button" onClick={handleStopClick}>
          🛑 Stop Music
        </button>
      )}
    </div>
  );
}

export default App;
