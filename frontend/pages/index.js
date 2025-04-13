// pages/Display.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Modal, Toast } from 'react-bootstrap';
import FixedHeader from '../components/FixedHeader';  // your existing header
import { 
  AiOutlinePlusCircle,
  AiOutlineEdit, 
  AiOutlineDelete, 
  AiFillHeart,
} from 'react-icons/ai';

function Display({ darkMode, toggleDarkMode }) {
  const [images, setImages] = useState([]);
  const [showItemKeys, setShowItemKeys] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState([]);
  const [favoritesFilter, setFavoritesFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: false,
    type: false,
    color: false,
    brand: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const [editingKey, setEditingKey] = useState(null);
  const [customMode, setCustomMode] = useState({});
  const [uploadName, setUploadName] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  const dropdownOptions = {
    category: ["Top", "Bottom", "Outerwear", "Footwear"],
    color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    material: ["Cotton", "Polyester", "Wool", "Silk", "Denim"],
    style: ["Minimalist", "Streetwear", "Casual", "Formal"],
    type: ["T-shirt", "Shirt", "Pants", "Dress", "Skirt"],
  };

  // Fields shown in the details modal
  const keysToShow = [
    "brand",
    "category",
    "color",
    "material",
    "style",
    "type"
  ];

  // 1. Fetch images from the backend
  const fetchData = () => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) setImages(data.files);
      })
      .catch((err) => console.error('Error fetching images:', err));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Delete-mode toggles
  const toggleDeleteMode = () => {
    if (deleteMode && selectedForDeletion.length > 0) {
      Promise.all(selectedForDeletion.map(url =>
        fetch('http://127.0.0.1:5001/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url }),
        })
      ))
      .then((responses) => Promise.all(responses.map(res => res.json())))
      .then(() => {
        showToast('Selected images deleted');
        fetchData();
        setSelectedForDeletion([]);
        setDeleteMode(false);
      })
      .catch((err) => {
        console.error('Error deleting selected images:', err);
        showToast('Error deleting images', 'danger');
      });
    } else {
      setDeleteMode((prev) => !prev);
      if (deleteMode) setSelectedForDeletion([]);
    }
  };

  const handleSelectForDeletion = (s3_url) => {
    if (selectedForDeletion.includes(s3_url)) {
      setSelectedForDeletion((prev) => prev.filter((url) => url !== s3_url));
    } else {
      setSelectedForDeletion((prev) => [...prev, s3_url]);
    }
  };

  // 3. Toast helper
  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // 4. MenuButtons callbacks
  const handleFavoritesFilterToggle = () => setFavoritesFilter((prev) => !prev);
  const handleToggleFilter = (filterName) => {
    setActiveFilters((prev) => ({ ...prev, [filterName]: !prev[filterName] }));
  };

  // 5. Sorting/Filtering
  let displayedImages = [...images];
  if (favoritesFilter) {
    displayedImages = displayedImages.filter((item) => item.favorite);
  }
  if (activeFilters.category) {
    displayedImages.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
  }
  if (activeFilters.type) {
    displayedImages.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
  }
  if (activeFilters.color) {
    displayedImages.sort((a, b) => (a.color || '').localeCompare(b.color || ''));
  }
  if (activeFilters.brand) {
    displayedImages.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));
  }

  // 6. Upload flow
  const handleOpenUploadModal = () => setShowUploadModal(true);

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadName('');
    setUploadFiles([]);
    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFiles(Array.from(e.target.files));
    }
  };

  const uploadSingleFile = (file, name = null) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Only image files are allowed'));
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      if (name) formData.append('name', name);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://127.0.0.1:5001/upload');
      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const responseJson = JSON.parse(xhr.responseText);
            resolve(responseJson);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Upload error'));
      xhr.send(formData);
    });
  };

  const handleUploadSubmit = async () => {
    if (isUploading) return;
    if (uploadFiles.length === 0) {
      showToast('Please select at least one image to upload', 'warning');
      return;
    }
    setIsUploading(true);
    try {
      const isSingle = uploadFiles.length === 1;
      const safeName = isSingle ? (uploadName.trim() === '' ? 'untitled' : uploadName.trim()) : null;
      for (let file of uploadFiles) {
        await uploadSingleFile(file, isSingle ? safeName : null);
      }
      showToast('Upload successful');
      fetchData();
      handleCloseUploadModal();
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Upload unsuccessful', 'danger');
    } finally {
      setIsUploading(false);
    }
  };

  // 7. Details modal flow
  const openModal = (item) => {
    setSelectedItem({ ...item, favorite: item.favorite || false });
    setTempName(item.name || `Piece #${item.id}`);
    setShowModal(true);
    setEditingKey(null);
    setCustomMode({});
  };

  const handleCloseModal = () => {
    fetchData();
    setShowModal(false);
    setSelectedItem(null);
    setIsEditingName(false);
    setEditingKey(null);
    setCustomMode({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    setIsEditingName(false);
    setEditingKey(null);
    setCustomMode({});
    setIsUpdating(true);
    try {
      const response = await fetch('http://127.0.0.1:5001/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedItem),
      });
      if (response.ok) {
        const updatedItem = await response.json();
        setSelectedItem(updatedItem);
        fetchData();
      } else {
        console.error('Failed to update item');
      }
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdate();
    }
  };

  const toggleEditingName = () => setIsEditingName((prev) => !prev);

  const handleGenerateFit = () => {
    if (selectedItem && selectedItem.s3_url) {
      router.push({
        pathname: '/fits',
        query: { imageUrl: selectedItem.s3_url }
      });
    }
  };

  const handleDelete = (s3_url) => {
    fetch('http://127.0.0.1:5001/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: s3_url }),
    })
    .then(res => res.json())
    .then(() => {
      showToast('Image deleted successfully');
      setShowModal(false);
      fetchData();
    })
    .catch(err => {
      console.error('Error deleting image:', err);
      showToast('Error deleting image', 'danger');
    });
  };

  // 8. Grouping logic
  const groupingKey = activeFilters.category 
    ? 'category' 
    : activeFilters.type 
      ? 'type'
      : activeFilters.color 
        ? 'color'
        : activeFilters.brand 
          ? 'brand'
          : null;

  let content;
  if (groupingKey) {
    const groupedImages = displayedImages.reduce((acc, item) => {
      const group = item[groupingKey] || "Others";
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
    content = Object.keys(groupedImages)
      .sort()
      .map((group) => (
        <div key={group}>
          <h2 style={{ margin: '1rem 0' }}>{group}</h2>
          <div className="gridContainer">
            {groupedImages[group].map(item => (
              <div
                key={item.id}
                className="gridItem"
                style={{ position: 'relative' }}
                onClick={() => openModal(item)}
              >
                <div className="aspectRatioBox">
                  <img src={item.s3_url} alt={`Clothing item ${item.id}`} className="image" />
                  {deleteMode && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: selectedForDeletion.includes(item.s3_url) ? 'red' : 'gray',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectForDeletion(item.s3_url);
                      }}
                    >
                      {selectedForDeletion.includes(item.s3_url) ? '✓' : 'X'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ));
  } else {
    content = (
      <div className="gridContainer">
        {displayedImages.length > 0 ? (
          displayedImages.map(item => (
            <div
              key={item.id}
              className="gridItem"
              style={{ position: 'relative' }}
              onClick={() => openModal(item)}
            >
              <div className="aspectRatioBox">
                <img src={item.s3_url} alt={`Clothing item ${item.id}`} className="image" />
                {deleteMode && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: selectedForDeletion.includes(item.s3_url) ? 'red' : 'gray',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectForDeletion(item.s3_url);
                    }}
                  >
                    {selectedForDeletion.includes(item.s3_url) ? '✓' : 'X'}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No images found.</p>
        )}
      </div>
    );
  }

  // 9. Render
  return (
    <div style={{ margin: 0, padding: 0 }}>
      {/* 9a. The fixed header */}
      <FixedHeader 
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        favoritesFilter={favoritesFilter}
        handleFavoritesFilterToggle={handleFavoritesFilterToggle}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onUploadClick={handleOpenUploadModal}
      />

      {/* 9b. The "Delete mode" icon pinned at top-right */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '40px',
          zIndex: 10000,
        }}
      >
        <div 
          className="deleteToggle" 
          onClick={toggleDeleteMode} 
          style={{ 
            cursor: 'pointer', 
            padding: '4px', 
            borderRadius: '50%', 
            backgroundColor: deleteMode ? '#f8d7da' : 'transparent' 
          }}
        >
          <AiOutlineDelete size={24} style={{ color: deleteMode ? 'red' : '#666' }} />
        </div>
      </div>

      {/* 9c. The scrollable main content area */}
      <div
        style={{
          marginTop: '140px',         // enough space so it doesn't hide behind the header
          height: 'calc(100vh - 140px)', // fill the rest of the screen
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        {content}
      </div>

      {/* 9d. The upload modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} centered backdrop>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Pieces</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label htmlFor="uploadName">Piece Name (for single upload)</label>
            <input
              type="text"
              id="uploadName"
              className="form-control"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="uploadFile">Choose Image Files</label>
            <input
              type="file"
              id="uploadFile"
              className="form-control"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            {uploadFiles.length > 0 && (
              <p style={{ marginTop: '8px' }}>
                Selected files: <strong>{uploadFiles.map(f => f.name).join(', ')}</strong>
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-primary"
            onClick={handleUploadSubmit}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* 9e. The details modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        {selectedItem && (
          <>
            <Modal.Header closeButton>
              <Modal.Title className="modalTitleContainer">
                {isEditingName ? (
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => {
                      setTempName(e.target.value);
                      setSelectedItem(prev => ({ ...prev, name: e.target.value }));
                    }}
                    onKeyDown={handleKeyDown}
                    className="editNameInput"
                    autoFocus
                  />
                ) : (
                  <>
                    {selectedItem.name || `Piece #${selectedItem.id}`}
                    <AiOutlineEdit className="editIcon" onClick={toggleEditingName} />
                  </>
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="modalImageContainer">
                <img
                  src={selectedItem.s3_url}
                  alt="Bigger preview"
                  className="modalImage"
                  onClick={() => setShowItemKeys(prev => !prev)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              {showItemKeys && (
                <div className="keyFeatures">
                  {keysToShow.map(key => {
                    if (key === "brand") {
                      return (
                        <div key={key} className="keyFeature">
                          <span className="keyLabel">{key}:</span>
                          {editingKey === "brand" ? (
                            <input
                              type="text"
                              id="brand"
                              name="brand"
                              value={selectedItem.brand || ""}
                              onChange={handleInputChange}
                              onKeyDown={handleKeyDown}
                              className="fieldInput"
                            />
                          ) : (
                            <span 
                              className="keyValue" 
                              onClick={() => setEditingKey("brand")} 
                              style={{ cursor: 'pointer' }}
                            >
                              {selectedItem.brand || "N/A"}
                            </span>
                          )}
                        </div>
                      );
                    } else {
                      return (
                        <div key={key} className="keyFeature">
                          <span className="keyLabel">{key}:</span>
                          {editingKey === key ? (
                            customMode[key] ? (
                              <input
                                type="text"
                                id={key}
                                name={key}
                                value={selectedItem[key] || ""}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className="fieldInput"
                              />
                            ) : (
                              <select
                                name={key}
                                value={selectedItem[key] || ""}
                                onChange={e => {
                                  const value = e.target.value;
                                  if (value === "Custom") {
                                    setCustomMode(prev => ({ ...prev, [key]: true }));
                                    setSelectedItem(prev => ({ ...prev, [key]: "" }));
                                  } else {
                                    setSelectedItem(prev => ({ ...prev, [key]: value }));
                                  }
                                }}
                                onKeyDown={handleKeyDown}
                                className="fieldInput"
                              >
                                {dropdownOptions[key]?.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                                <option value="Custom">Custom</option>
                              </select>
                            )
                          ) : (
                            <span 
                              className="keyValue" 
                              onClick={() => setEditingKey(key)} 
                              style={{ cursor: 'pointer' }}
                            >
                              {selectedItem[key] || "N/A"}
                            </span>
                          )}
                        </div>
                      );
                    }
                  })}
                </div>
              )}
              <div className="iconRow">
                {selectedItem.favorite ? (
                  <span
                    className="iconButton favoriteIcon red"
                    onClick={() => {
                      fetch('http://127.0.0.1:5001/favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedItem.id, favorite: false }),
                      })
                        .then(res => res.json())
                        .then(updatedItem => {
                          setSelectedItem(updatedItem);
                          fetchData();
                        })
                        .catch(err => console.error('Error toggling favorite:', err));
                    }}
                  >
                    <AiFillHeart />
                  </span>
                ) : (
                  <span
                    className="iconButton favoriteIcon grey"
                    onClick={() => {
                      fetch('http://127.0.0.1:5001/favorite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedItem.id, favorite: true }),
                      })
                        .then(res => res.json())
                        .then(updatedItem => {
                          setSelectedItem(updatedItem);
                          fetchData();
                        })
                        .catch(err => console.error('Error toggling favorite:', err));
                    }}
                  >
                    <AiFillHeart />
                  </span>
                )}
                <span
                  className="iconButton deleteIcon blue"
                  onClick={() => handleDelete(selectedItem.s3_url)}
                >
                  <AiOutlineDelete />
                </span>
              </div>
              <div className="centerButtons">
                <button className="plusButton" onClick={handleGenerateFit}>
                  <AiOutlinePlusCircle className="iconSmall" />
                  Generate fit with this piece
                </button>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>

      {/* 9f. Toast notifications */}
      <Toast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        bg={toast.variant}
        delay={3000}
        autohide
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          minWidth: 200,
          zIndex: 9999,
        }}
      >
        <Toast.Body className="text-white">{toast.message}</Toast.Body>
      </Toast>
    </div>
  );
}

export default Display;
