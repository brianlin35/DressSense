import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
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

export default function Display() {
  const [images, setImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Function to fetch data from the backend
  const fetchData = () => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched data:', data);
        if (data.files) {
          setImages(data.files);
        }
      })
      .catch((err) => console.error('Error fetching images:', err));
  };

  // Fetch images on mount and poll every 10 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle file upload using XMLHttpRequest to track progress
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:5001/upload');

    // Update progress state
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    };

    xhr.onload = () => {
      setUploadProgress(0);
      if (xhr.status === 200) {
        // Refresh list after successful upload
        fetchData();
      } else {
        console.error('Upload failed: ', xhr.responseText);
      }
    };

    xhr.onerror = () => {
      setUploadProgress(0);
      console.error('Upload error');
    };

    xhr.send(formData);
  };

  // Trigger hidden file input
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Open modal with the selected item data from the DB
  const openModal = (item) => {
    console.log('Opening modal for item:', item);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Delete an item from S3 and update state accordingly
  const handleDelete = async (s3_url) => {
    try {
      const response = await fetch('http://127.0.0.1:5001/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: s3_url }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete object');
      }
      fetchData(); // Refresh list after deletion
      closeModal();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Tabs Header */}
      <TabsHeader />

      {/* Filter Buttons with Icons */}
      <div style={styles.filtersContainer}>
        <button style={styles.filterButton}>
          <AiFillHeart style={{ marginRight: '5px' }} />
          Favorites
        </button>
        <button style={styles.filterButton}>
          <AiOutlineFolderOpen style={{ marginRight: '5px' }} />
          Category
        </button>
        <button style={styles.filterButton}>
          <AiOutlineTag style={{ marginRight: '5px' }} />
          Type
        </button>
        <button style={styles.filterButton}>
          <AiOutlineBgColors style={{ marginRight: '5px' }} />
          Color
        </button>
        <button style={styles.filterButton}>
          <AiOutlineShop style={{ marginRight: '5px' }} />
          Brand
        </button>
        <button style={styles.filterButton}>
          <AiOutlineDollarCircle style={{ marginRight: '5px' }} />
          Price
        </button>
      </div>

      {/* Upload a piece button */}
      <div style={styles.uploadContainer}>
        <button style={styles.uploadButton} onClick={handleUploadClick}>
          <AiOutlinePlusCircle style={{ marginRight: '8px', fontSize: '18px' }} />
          Upload a piece
        </button>
      </div>

      {/* Progress Bar */}
      {uploadProgress > 0 && (
        <div style={styles.progressContainer}>
          <div style={{ ...styles.progressBar, width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}

      {/* Image Grid */}
      <div style={styles.gridContainer}>
        {images.length > 0 ? (
          images.map((item) => (
            <div key={item.id} style={styles.gridItem}>
              <div style={styles.aspectRatioBox} onClick={() => openModal(item)}>
                <img
                  src={item.s3_url}
                  alt={`Clothing item ${item.id}`}
                  style={styles.image}
                />
              </div>
            </div>
          ))
        ) : (
          <p>No images found.</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Modal for larger preview + metadata */}
      <Modal show={showModal} onHide={closeModal} centered>
        {selectedItem && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Piece #{selectedItem.id}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                <img
                  src={selectedItem.s3_url}
                  alt="Bigger preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                  }}
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
                <p>Fitted Market Value: {selectedItem.fitted_market_value}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <AiFillHeart style={styles.iconStyle} onClick={() => console.log('Favorited (placeholder)')} />
                <AiOutlineDelete style={styles.iconStyle} onClick={() => handleDelete(selectedItem.s3_url)} />
              </div>
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button style={styles.plusButton} onClick={() => console.log('Generate fit with this piece (placeholder)')}>
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
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
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
  progressContainer: {
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: '4px',
    marginBottom: '20px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '20px',
    backgroundColor: '#4caf50',
    color: '#fff',
    textAlign: 'center',
    lineHeight: '20px',
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
