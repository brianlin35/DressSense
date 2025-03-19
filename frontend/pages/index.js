// pages/index.js
import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useRouter } from 'next/router';
import TabsHeader from '../components/TabsHeader';
import SplashScreen from '../components/SplashScreen';

// Icons
import {
  AiFillHeart,
  AiOutlineFolderOpen,
  AiOutlineTag,
  AiOutlineBgColors,
  AiOutlineShop,
  AiOutlineDollarCircle,
  AiOutlinePlusCircle,
  AiOutlineDelete,
  AiOutlineBulb,
  AiOutlineEye
} from 'react-icons/ai';

export default function Home() {
  // ------------------ Accessibility & Filter States ------------------ //
  const [darkMode, setDarkMode] = useState(false);
  const [colorBlindMode, setColorBlindMode] = useState(false);
  const [filterFavorites, setFilterFavorites] = useState(false);

  // ------------------ Splash Screen State ------------------ //
  const [showSplash, setShowSplash] = useState(false);

  // ------------------ Images & File Upload ------------------ //
  const [images, setImages] = useState([]); // DB items
  const fileInputRef = useRef(null);

  // ------------------ Modal & Editing States ------------------ //
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // For editing metadata in the modal
  const [editFields, setEditFields] = useState({
    category: '',
    type: '',
    brand: '',
    size: '',
    style: '',
    color: '',
    material: '',
    fitted_market_value: ''
  });

  // ------------------ On Load: Splash & Fetch Items ------------------ //
  useEffect(() => {
    // Show splash only once per session
    if (typeof window !== 'undefined') {
      const visited = sessionStorage.getItem('hasVisited');
      if (!visited) {
        setShowSplash(true);
        sessionStorage.setItem('hasVisited', 'true');
      }
    }
  }, []);

  // Fetch items from Flask DB
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

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // ------------------ File Upload ------------------ //
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    for (let file of files) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        continue;
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
          alert(`Upload of ${file.name} successful!`);
          setImages((prevImages) => [...prevImages, result]);
        } else {
          alert(`Upload of ${file.name} failed: ` + result.error);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert(`An error occurred during upload of ${file.name}.`);
      }
    }
  };

  // ------------------ Modal Logic (Open, Close, Edit) ------------------ //
  const openModal = (item) => {
    setSelectedItem(item);
    // Populate edit fields from the selected item
    setEditFields({
      category: item.category || '',
      type: item.type || '',
      brand: item.brand || '',
      size: item.size || '',
      style: item.style || '',
      color: item.color || '',
      material: item.material || '',
      fitted_market_value: item.fitted_market_value || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Update local state as user changes the form
  const handleChange = (e) => {
    setEditFields({ ...editFields, [e.target.name]: e.target.value });
  };

  // ------------------ Save Updated Metadata ------------------ //
  const handleSaveUpdates = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch('http://127.0.0.1:5001/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          ...editFields
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update item');
      }

      // Update the local state
      setImages((prev) =>
        prev.map((it) => (it.id === selectedItem.id ? result : it))
      );
      setSelectedItem(result);
      alert('Item updated successfully!');
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Error updating item. Check console.');
    }
  };

  // ------------------ Favorites ------------------ //
  const handleToggleFavorite = async () => {
    if (!selectedItem) return;
    try {
      const newFavoriteStatus = !selectedItem.favorite;
      const response = await fetch('http://127.0.0.1:5001/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedItem.id, favorite: newFavoriteStatus }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update favorite');
      }
      // Update local state
      setSelectedItem(result);
      setImages((prev) =>
        prev.map((item) => (item.id === result.id ? result : item))
      );
      alert('Favorite status updated!');
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Error updating favorite. Check console.');
    }
  };

  const toggleFavoriteFilter = () => {
    setFilterFavorites(!filterFavorites);
  };

  // ------------------ Delete ------------------ //
  const handleDelete = async (item) => {
    try {
      const response = await fetch('http://127.0.0.1:5001/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.s3_url }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete object');
      }
      setImages((prev) => prev.filter((it) => it.s3_url !== item.s3_url));
      alert(`Deleted ${item.s3_url} from S3`);
      closeModal();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Error deleting item. Check console.');
    }
  };

  // ------------------ Dark/Light Mode & Color Blind Mode ------------------ //
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  const toggleColorBlindMode = () => {
    setColorBlindMode(!colorBlindMode);
  };

  // Overall styling
  const accessibilityStyles = {
    backgroundColor: darkMode ? '#121212' : '#fff',
    color: darkMode ? '#eee' : '#000',
    filter: colorBlindMode ? 'contrast(150%) saturate(120%)' : 'none',
    minHeight: '100vh',
  };

  const stickyHeaderStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 999,
    backgroundColor: darkMode ? '#222' : '#fff',
    color: 'inherit',
    borderBottom: darkMode ? '1px solid #444' : '1px solid #ddd',
  };

  // Filter favorites
  const displayedImages = filterFavorites
    ? images.filter((item) => item.favorite)
    : images;

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <div className="fade-in-main" style={accessibilityStyles}>
      {/* Sticky header container */}
      <div style={stickyHeaderStyle}>
        {/* Accessibility Bar */}
        <div style={{ ...styles.accessibilityBar, backgroundColor: 'inherit', color: 'inherit' }}>
          <Button variant="link" onClick={toggleDarkMode} style={styles.accessibilityButton}>
            <AiOutlineBulb style={{ marginRight: '5px' }} />
            {darkMode ? "Light Mode" : "Dark Mode"}
          </Button>
          <Button variant="link" onClick={toggleColorBlindMode} style={styles.accessibilityButton}>
            <AiOutlineEye style={{ marginRight: '5px' }} />
            Color Blind Mode
          </Button>
        </div>

        {/* Tabs Header */}
        <TabsHeader />

        {/* Filter Buttons */}
        <div style={{ ...styles.filtersContainer, backgroundColor: 'inherit', color: 'inherit' }}>
          <button
            style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}
            onClick={toggleFavoriteFilter}
          >
            <AiFillHeart style={{ marginRight: '5px' }} />
            Favorites
          </button>
          <button style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}>
            <AiOutlineFolderOpen style={{ marginRight: '5px' }} />
            Category
          </button>
          <button style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}>
            <AiOutlineTag style={{ marginRight: '5px' }} />
            Type
          </button>
          <button style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}>
            <AiOutlineBgColors style={{ marginRight: '5px' }} />
            Color
          </button>
          <button style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}>
            <AiOutlineShop style={{ marginRight: '5px' }} />
            Brand
          </button>
          <button style={{ ...styles.filterButton, ...getButtonStyle(darkMode) }}>
            <AiOutlineDollarCircle style={{ marginRight: '5px' }} />
            Price
          </button>
          <button
            style={{ ...styles.uploadButton, ...getUploadButtonStyle(darkMode) }}
            onClick={handleUploadClick}
          >
            <AiOutlinePlusCircle style={{ marginRight: '8px', fontSize: '18px' }} />
            Upload a piece
          </button>
        </div>
      </div>

      {/* Main content area (image grid) */}
      <div style={styles.gridContainer}>
        {displayedImages.length > 0 ? (
          displayedImages.map((item, idx) => (
            <div key={idx} style={getGridItemStyle(darkMode)} onClick={() => openModal(item)}>
              <div style={styles.aspectRatioBox}>
                <img src={item.s3_url} alt={`Clothing item ${idx}`} style={styles.image} />
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center' }}>No images found.</p>
        )}
      </div>

      {/* Hidden File Input (multiple) */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Modal for Larger Preview & Metadata Editing */}
      <Modal
        show={showModal}
        onHide={closeModal}
        centered
        contentClassName={darkMode ? "bg-dark text-light" : ""}
      >
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
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>

              {/* Edit Form for Metadata */}
              <Form>
                <Form.Group controlId="category" className="mb-2">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={editFields.category}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="Top">Top</option>
                    <option value="Bottom">Bottom</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Footwear">Footwear</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="type" className="mb-2">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    name="type"
                    value={editFields.type}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Sweater">Sweater</option>
                    <option value="Sneakers">Sneakers</option>
                    <option value="Dress Shirt">Dress Shirt</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="brand" className="mb-2">
                  <Form.Label>Brand</Form.Label>
                  <Form.Control
                    type="text"
                    name="brand"
                    value={editFields.brand}
                    onChange={handleChange}
                  />
                </Form.Group>

                <Form.Group controlId="size" className="mb-2">
                  <Form.Label>Size</Form.Label>
                  <Form.Select
                    name="size"
                    value={editFields.size}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="style" className="mb-2">
                  <Form.Label>Style</Form.Label>
                  <Form.Select
                    name="style"
                    value={editFields.style}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="Casual">Casual</option>
                    <option value="Streetwear">Streetwear</option>
                    <option value="Formal">Formal</option>
                    <option value="Minimalist">Minimalist</option>
                    <option value="Athleisure">Athleisure</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="color" className="mb-2">
                  <Form.Label>Color</Form.Label>
                  <Form.Select
                    name="color"
                    value={editFields.color}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="Black">Black</option>
                    <option value="White">White</option>
                    <option value="Grey">Grey</option>
                    <option value="Blue">Blue</option>
                    <option value="Red">Red</option>
                    <option value="Green">Green</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="material" className="mb-2">
                  <Form.Label>Material</Form.Label>
                  <Form.Select
                    name="material"
                    value={editFields.material}
                    onChange={handleChange}
                  >
                    <option value="">--Select--</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Wool">Wool</option>
                    <option value="Denim">Denim</option>
                    <option value="Polyester">Polyester</option>
                    <option value="Leather">Leather</option>
                    <option value="Silk">Silk</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group controlId="fitted_market_value" className="mb-2">
                  <Form.Label>Fitted Market Value</Form.Label>
                  <Form.Control
                    type="text"
                    name="fitted_market_value"
                    value={editFields.fitted_market_value}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Form>

              {/* Save Changes Button */}
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <Button variant="primary" onClick={handleSaveUpdates}>
                  Save Changes
                </Button>
              </div>

              {/* Favorite and Delete Icons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '20px' }}>
                <AiFillHeart
                  style={{
                    fontSize: '40px',
                    cursor: 'pointer',
                    color: selectedItem.favorite ? '#ff69b4' : '#aaa'
                  }}
                  onClick={handleToggleFavorite}
                />
                <AiOutlineDelete
                  style={{ fontSize: '40px', cursor: 'pointer', color: '#dc3545' }}
                  onClick={() => handleDelete(selectedItem)}
                />
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
}

// ---------- Helper Functions for Dynamic Styles ---------- //
function getButtonStyle(darkMode) {
  return {
    background: 'inherit',
    color: 'inherit',
    border: darkMode ? '1px solid #666' : '1px solid #ccc',
  };
}

function getUploadButtonStyle(darkMode) {
  return {
    background: 'inherit',
    color: darkMode ? '#ffd700' : '#007bff',
    border: darkMode ? '1px solid #ffd700' : '1px solid #007bff',
  };
}

function getGridItemStyle(darkMode) {
  return {
    border: darkMode ? '1px solid #444' : '1px solid #eee',
    borderRadius: '5px',
    background: darkMode ? '#333' : 'transparent',
    overflow: 'hidden',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s ease, border-color 0.2s ease',
  };
}

// ---------- Shared Styles ---------- //
const styles = {
  accessibilityBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    padding: '10px 0',
  },
  accessibilityButton: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  filtersContainer: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    padding: '10px 0',
  },
  filterButton: {
    borderRadius: '999px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
  },
  uploadButton: {
    borderRadius: '999px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '10px',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    padding: '20px',
  },
  aspectRatioBox: {
    position: 'relative',
    width: '100%',
    paddingTop: '100%',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: 'transparent',
  },
};
