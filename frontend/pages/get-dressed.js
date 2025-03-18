// pages/get-dressed.js
import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { useRouter } from 'next/router';

export default function GetDressed() {
  const [images, setImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('http://127.0.0.1:5001/list')
      .then(res => res.json())
      .then(data => {
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch(err => console.error('Error fetching images:', err));
  }, []);

  const handleRemoveItem = async (imageUrl) => {
    try {
      const response = await fetch('http://127.0.0.1:5001/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete object');
      }

      // Remove the item from local state so UI updates
      setImages((prev) => prev.filter((item) => item !== imageUrl));
      alert(`Removed ${imageUrl}`);
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Error removing item. Check console.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Left Half: Wardrobe with Smaller Previews */}
      <div
        style={{
          flex: 1,
          borderRight: '1px solid #ccc',
          padding: '20px',
          overflowY: 'auto'
        }}
      >
        <h2>Your Wardrobe</h2>
        {images.length > 0 ? (
          images.map((url, index) => (
            <div key={index} style={{ marginBottom: '20px', textAlign: 'center' }}>
              <img
                src={url}
                alt={`Wardrobe item ${index}`}
                style={{ width: '150px', height: 'auto', objectFit: 'contain' }}
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
        <div style={{ marginTop: '20px' }}>
          <Button variant="secondary" onClick={() => router.push('/')}>
            ← Back to Home
          </Button>
        </div>
      </div>

      {/* Right Half: Four Stacked Rectangles */}
      <div
        style={{
          flex: 1,
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Accessories */}
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '10px'
          }}
        >
          <h3 style={{ margin: 0 }}>Accessories</h3>
        </div>

        {/* Top */}
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '10px'
          }}
        >
          <h3 style={{ margin: 0 }}>Top</h3>
        </div>

        {/* Pants */}
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '10px'
          }}
        >
          <h3 style={{ margin: 0 }}>Pants</h3>
        </div>

        {/* Shoes */}
        <div
          style={{
            flex: 1,
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '10px'
          }}
        >
          <h3 style={{ margin: 0 }}>Shoes</h3>
        </div>
      </div>
    </div>
  );
}
