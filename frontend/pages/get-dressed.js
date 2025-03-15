import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useRouter } from 'next/router';

export default function GetDressed() {
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch((err) => console.error('Error fetching images:', err));
  }, []);

  // Dummy remove function
  const handleRemoveItem = (imageUrl) => {
    alert(`Remove ${imageUrl}`);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left Half: User's Wardrobe */}
      <div
        style={{
          flex: 1,
          borderRight: '1px solid #ccc',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        <h2>Your Wardrobe</h2>
        {images.length > 0 ? (
          images.map((url, index) => (
            <div key={index} style={{ marginBottom: '20px' }}>
              <img
                src={url}
                alt={`Wardrobe item ${index}`}
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              />
              <Button
                variant="danger"
                size="sm"
                style={{ marginTop: '5px' }}
                onClick={() => handleRemoveItem(url)}
              >
                Remove Item
              </Button>
            </div>
          ))
        ) : (
          <p>No items in your wardrobe.</p>
        )}
        {/* Back to Home */}
        <div style={{ marginTop: '20px' }}>
          <Button variant="secondary" onClick={() => router.push('/')}>
            ← Back to Home
          </Button>
        </div>
      </div>

      {/* Right Half: 3 Stacked Rectangles */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>Rectangle 1</p>
        </div>
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>Rectangle 2</p>
        </div>
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>Rectangle 3</p>
        </div>
      </div>
    </div>
  );
}
