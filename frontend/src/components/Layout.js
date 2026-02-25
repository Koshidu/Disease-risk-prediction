import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Layout = ({ children }) => {
  const [modelInfo, setModelInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Ensure background video plays
    const video = document.getElementById('background-video');
    if (video) {
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Video will play on user interaction
        });
      }
    }

    // Check model health and get info
    const checkModelHealth = async () => {
      try {
        const [healthRes, infoRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/health`),
          axios.get(`${API_BASE_URL}/model-info`).catch(() => null)
        ]);

        if (healthRes.data.model_loaded && infoRes) {
          setModelInfo(infoRes.data);
        }
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };

    checkModelHealth();
  }, []);

  // Don't show header on login/signup pages
  const hideHeader = location.pathname === '/login' || location.pathname === '/signup';
  const isHomePage = location.pathname === '/';

  return (
    <div className="App">
      {!hideHeader && <Header modelInfo={isHomePage ? modelInfo : null} />}
      {children}
    </div>
  );
};

export default Layout;
