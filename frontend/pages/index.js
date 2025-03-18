// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';
import SplashScreen from '../components/SplashScreen';
import { useRouter } from 'next/router';
import Slider from 'react-slick';
import { useModal } from '../components/GlobalModal';

export default function Home() {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeInMain, setFadeInMain] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { openModal } = useModal();

  useEffect(() => {
    const visited = localStorage.getItem('hasVisited');
    if (!visited) {
      setShowSplash(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched data:", data);
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch((err) => console.error('Error fetching images:', err));
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setFadeInMain(true);
  };

  const handleAddToWardrobeClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('http://127.0.0.1:5001/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        alert('Upload successful!');
        setImages(prevImages => [...prevImages, result.url]);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('An error occurred during upload.');
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Settings for react-slick slider for continuous right-to-left movement.
  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 3000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: 'linear',
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    rtl: true, // slide from right to left
  };

  return (
    <div className={`container mt-5 ${fadeInMain ? 'fade-in-main' : ''}`}>
      <h1 className="text-center mb-4">Dress Sense</h1>

      {images.length > 0 ? (
        <Slider {...sliderSettings}>
          {images.map((url, idx) => (
            <div key={idx} onClick={() => openModal(url)} style={{ cursor: 'pointer' }}>
              <img
                src={url}
                alt={`Slide ${idx}`}
                style={{ width: '100%', height: '400px', objectFit: 'cover' }}
              />
            </div>
          ))}
        </Slider>
      ) : (
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ height: '400px', backgroundColor: '#eee' }}
        >
          <p>No images found.</p>
        </div>
      )}

      <div className="text-center mt-4">
        <Button variant="primary" className="me-3" onClick={() => router.push("/get-dressed")}>
          Get Dressed
        </Button>
        <Button variant="secondary" onClick={handleAddToWardrobeClick}>
          Add to Your Wardrobe
        </Button>
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  );
}
