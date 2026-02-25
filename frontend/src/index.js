import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure background video plays and loops
if (typeof document !== 'undefined') {
  const initVideo = () => {
    const video = document.getElementById('background-video');
    if (video) {
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      
      // Try to play the video
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Background video is playing');
          })
          .catch(err => {
            console.log('Video autoplay prevented, will play on user interaction:', err);
            // Video will play when user interacts with the page
          });
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVideo);
  } else {
    initVideo();
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
