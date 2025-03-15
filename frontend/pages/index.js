import React, { useState, useEffect } from 'react';
import { Carousel, Button } from 'react-bootstrap';
import SplashScreen from '../components/SplashScreen'; // <-- Your existing splash screen component

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeInMain, setFadeInMain] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Check localStorage to see if the user has visited before
    const visited = localStorage.getItem('hasVisited');
    if (!visited) {
      // No record => first visit => show the splash
      setShowSplash(true);
      // Mark as visited for next time
      localStorage.setItem('hasVisited', 'true');
    }
    // If visited is 'true', we skip the splash and go straight to the main page
  }, []);

  useEffect(() => {
    // Fetch images from Flask on component mount
    fetch("http://127.0.0.1:5001/list")
    .then((res) => res.json())
    .then((data) => {
      if (data.files) {
        setImages(data.files); // Store the URLs in state
      }
    })
    .catch((err) => console.error("Error fetching images:", err));
}, []);

  const handleSplashFinish = () => {
    // Called when the splash screen’s exit animation completes
    setShowSplash(false);
    setFadeInMain(true); // Trigger a fade-in for the main container
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Once the splash is done OR user is returning, render the main content
  return (
    <div className={`container mt-5 ${fadeInMain ? 'fade-in-main' : ''}`}>
      <h1 className="text-center mb-4">Dress Sense</h1>

      {/* Auto-Rotating Carousel */}
      <Carousel interval={3000}>
        {images.length > 0 ? (
          images.map((url, idx) => (
            <Carousel.Item key={idx}>
              <img
                className="d-block w-100"
                src={url}
                alt={`Slide ${idx}`}
                style={{ height: '400px', objectFit: 'cover' }}
              />
            </Carousel.Item>
          ))
        ) : (
          <Carousel.Item>
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ height: '400px', backgroundColor: '#eee' }}
            >
              <p>No images found.</p>
            </div>
          </Carousel.Item>
        )}
      </Carousel>

      {/* Buttons */}
      <div className="text-center mt-4">
        <Button variant="primary" className="me-3">
          Get Dressed
        </Button>
        <Button variant="secondary">Add to Your Wardrobe</Button>
      </div>
    </div>
  );
}
