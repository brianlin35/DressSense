// pages/_app.js
import React, { useState, useEffect } from 'react';
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css';
import { ModalProvider } from '../components/GlobalModal';

function MyApp({ Component, pageProps }) {
  const [darkMode, setDarkMode] = useState(false);
  const toggleDarkMode = () => setDarkMode(prev => !prev);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <ModalProvider>
      <Component {...pageProps} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
    </ModalProvider>
  );
}

export default MyApp;
