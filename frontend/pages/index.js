// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import TabsHeader from '../components/TabsHeader';
import {
  AiFillHeart,
  AiOutlineFolderOpen,
  AiOutlineTag,
  AiOutlineBgColors,
  AiOutlineShop,
  AiOutlineDollarCircle,
  AiOutlinePlusCircle,
  AiOutlineDelete
} from 'react-icons/ai';
import SplashScreen from '../components/SplashScreen';

export default function Home() {
  // Use sessionStorage so splash shows only on a new session
  const [showSplash, setShowSplash] = useState(false);
  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Modal state for larger preview
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Check sessionStorage for splash screen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const visited = sessionStorage.getItem('hasVisited');
      if (!visited) {
        setShowSplash(true);
        sessionStorage.setItem('hasVisited', 'true');
      }
    }
  }, []);

  // Fetch S3 images from your Flask backend
  useEffect(() => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched data:', data);
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch((err) => console.error('Error fetching images:', err));
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // File upload handler
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
        setImages((prevImages) => [...prevImages, result.url]);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('An error occurred during upload.');
    }
  };

  // Trigger hidden file input for upload
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Open modal with placeholder metadata for the clicked image
  const openModal = (url) => {
    const itemData = {
      url,
      category: 'Top',
      type: 'T-Shirt',
      brand: 'BrandX',
      size: 'M',
      style: 'Casual',
      color: 'Black',
      material: 'Cotton',
      fittedMarketValue: '$50',
    };
    setSelectedItem(itemData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Delete file from S3 and update local state
  const handleDelete = async (url) => {
    try {
      const response = await fetch('http://127.0.0.1:5001/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete object');
      }
      setImages((prev) => prev.filter((item) => item !== url));
      alert(`Deleted ${url} from S3`);
      closeModal();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Error deleting item. Check console.');
    }
  };

  // Only show splash screen on initial page load (sessionStorage controls this)
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="fade-in-main">
      {/* Tabs Header for Pieces / Fits / Collections */}
      <TabsHeader />

      {/* Filter Buttons */}
      <div style={styles.filtersContainer}>
        <button style={styles.filterButton}>
          <AiFillHeart style={{ marginRight: '5px' }}/>
          Favorites
        </button>
        <button style={styles.filterButton}>
          <AiOutlineFolderOpen style={{ marginRight: '5px' }}/>
          Category
        </button>
        <button style={styles.filterButton}>
          <AiOutlineTag style={{ marginRight: '5px' }}/>
          Type
        </button>
        <button style={styles.filterButton}>
          <AiOutlineBgColors style={{ marginRight: '5px' }}/>
          Color
        </button>
        <button style={styles.filterButton}>
          <AiOutlineShop style={{ marginRight: '5px' }}/>
          Brand
        </button>
        <button style={styles.filterButton}>
          <AiOutlineDollarCircle style={{ marginRight: '5px' }}/>
          Price
        </button>
      </div>

      {/* Upload a Piece Button */}
      <div style={styles.uploadContainer}>
        <button style={styles.uploadButton} onClick={handleUploadClick}>
          <AiOutlinePlusCircle style={{ marginRight: '8px', fontSize: '18px' }}/>
          Upload a piece
        </button>
      </div>

      {/* Image Grid (square images) */}
      <div style={styles.gridContainer}>
        {images.length > 0 ? (
          images.map((url, idx) => (
            <div key={idx} style={styles.gridItem}>
              <div style={styles.aspectRatioBox} onClick={() => openModal(url)}>
                <img src={url} alt={`Clothing item ${idx}`} style={styles.image}/>
              </div>
            </div>
          ))
        ) : (
          <p>No images found.</p>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Modal for Larger Preview and Metadata */}
      <Modal show={showModal} onHide={closeModal} centered>
        {selectedItem && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Piece #{selectedItem.url.slice(-8)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <img
                  src={selectedItem.url}
                  alt="Bigger preview"
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
              <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                <p>Category: {selectedItem.category}</p>
                <p>Type: {selectedItem.type}</p>
                <p>Brand: {selectedItem.brand}</p>
                <p>Size: {selectedItem.size}</p>
                <p>Style: {selectedItem.style}</p>
                <p>Color: {selectedItem.color}</p>
                <p>Material: {selectedItem.material}</p>
                <p>Fitted Market Value: {selectedItem.fittedMarketValue}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <AiFillHeart style={styles.iconStyle} onClick={() => alert('Favorited! (placeholder)')} />
                <AiOutlineDelete style={styles.iconStyle} onClick={() => handleDelete(selectedItem.url)} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button style={styles.plusButton} onClick={() => alert('Generate fit with this piece! (placeholder)')}>
                  <AiOutlinePlusCircle style={{ marginRight: '8px' }} />
                  Generate fit with this piece
                </button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}

const styles = {
  filtersContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  filterButton: {
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '999px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  uploadContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  uploadButton: {
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '999px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
  },
  gridItem: {
    border: '1px solid #eee',
    borderRadius: '5px',
    background: '#f9f9f9',
    overflow: 'hidden',
    textAlign: 'center',
    cursor: 'pointer',
  },
  aspectRatioBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%', // 1:1 ratio for a square
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#fff',
  },
  iconStyle: {
    fontSize: '28px',
    cursor: 'pointer',
    color: '#333',
  },
  plusButton: {
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '999px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
  },
};
