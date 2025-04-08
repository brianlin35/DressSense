import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Modal, Toast } from 'react-bootstrap';
import TabsHeader from '../components/TabsHeader';
import MenuButtons from '../components/MenuButtons';
import { 
  AiOutlinePlusCircle, 
  AiOutlineEdit, 
  AiOutlineDelete, 
  AiFillHeart,
  AiOutlineMoon,
  AiOutlineSun
} from 'react-icons/ai';

function Display() {
  const [images, setImages] = useState([]);
  const [showItemKeys, setShowItemKeys] = useState(false);
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(false);

  // Filters and favorites
  const [favoritesFilter, setFavoritesFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: false,
    type: false,
    color: false,
    brand: false,
    price: false,
  });

  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  
  // Track which key is currently being edited
  const [editingKey, setEditingKey] = useState(null);
  // Track if a dropdown field is in "custom" mode
  const [customMode, setCustomMode] = useState({});

  // States for uploading
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadModelResult, setUploadModelResult] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  // Predefined dropdown options for keys (except "Brand" and "Value")
  const dropdownOptions = {
    Category: ["Top", "Bottom", "Outerwear", "Footwear"],
    Color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    Material: ["Cotton", "Polyester", "Wool", "Silk", "Denim"],
    Size: ["S", "M", "L", "XL"],
    Style: ["Minimalist", "Streetwear", "Casual", "Formal"],
    Type: ["T-shirt", "Shirt", "Pants", "Dress", "Skirt"],
  };

  // For this example, "Brand" and "Value" are free text.
  const keysToShow = [
    "Brand",
    "Category",
    "Color",
    "Value",
    "Material",
    "Size",
    "Style",
    "Type"
  ];

  // Function to handle input changes for editable fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedItem((prev) => ({ ...prev, [name]: value }));
  };

  // Fetch images list from the backend
  const fetchData = () => {
    fetch('http://127.0.0.1:5001/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.files) setImages(data.files);
      })
      .catch((err) => console.error('Error fetching images:', err));
  };

  // Poll backend every 3 seconds for near-real-time updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Toggle dark mode on <body>
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // **** Define toggleDarkMode function ****
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  /* ---------------- MenuButtons Callbacks ---------------- */
  const handleFavoritesFilterToggle = () => {
    setFavoritesFilter(prev => !prev);
  };

  const handleToggleFilter = (filterName) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  /* ---------------- Compute displayedImages ---------------- */
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
  if (activeFilters.price) {
    displayedImages.sort((a, b) => {
      const priceA = parseFloat(a.fitted_market_value) || 0;
      const priceB = parseFloat(b.fitted_market_value) || 0;
      return priceA - priceB;
    });
  }

  /* ---------------- Upload Flow ---------------- */
  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadName('');
    setUploadFile(null);
    setUploadModelResult('');
    setIsUploading(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = () => {
    if (isUploading) return;
    if (!uploadFile) {
      showToast('Please select an image to upload', 'warning');
      return;
    }
    if (!uploadFile.type.startsWith('image/')) {
      showToast('Only image files are allowed', 'danger');
      return;
    }
    setIsUploading(true);
    const safeName = uploadName.trim() === '' ? 'untitled' : uploadName.trim();
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', safeName);
    formData.append('model_result', uploadModelResult.trim() || '');
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://127.0.0.1:5001/upload');
    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status === 200) {
        try {
          const responseJson = JSON.parse(xhr.responseText);
          if (responseJson.item && responseJson.item.id) {
            showToast('Upload successful', 'success');
            fetchData();
            handleCloseUploadModal();
          } else {
            showToast('Upload error: Missing item data', 'danger');
          }
        } catch (error) {
          console.error('Error parsing upload response:', error);
          showToast('Upload unsuccessful', 'danger');
        }
      } else {
        console.error('Upload failed:', xhr.responseText);
        showToast('Upload unsuccessful', 'danger');
      }
    };
    xhr.onerror = () => {
      setIsUploading(false);
      console.error('Upload error');
      showToast('Upload unsuccessful', 'danger');
    };
    xhr.send(formData);
  };

  /* ---------------- Details Modal Flow ---------------- */
  const openModal = (item) => {
    setSelectedItem({ ...item, favorite: item.favorite || false });
    setTempName(item.name || `Piece #${item.id}`);
    setShowModal(true);
    setEditingKey(null);
    setCustomMode({});
  };

  // When closing the modal, re-fetch data and discard unsaved changes.
  const handleCloseModal = () => {
    fetchData();
    setShowModal(false);
    setSelectedItem(null);
    setIsEditingName(false);
    setEditingKey(null);
    setCustomMode({});
  };

  // Update the item in the DB and exit all edit modes (triggered on Enter)
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
        fetchData();
        setShowModal(false);
        setSelectedItem(null);
      } else {
        console.error('Failed to update item');
      }
    } catch (err) {
      console.error('Error updating item:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // onKeyDown handler for inputs to trigger update on Enter
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

  return (
    <div className="container">
      {/* Dark mode toggle */}
      <div className="darkModeToggle" onClick={toggleDarkMode}>
        {darkMode ? (
          <AiOutlineSun size={24} style={{ color: '#FFD700' }} />
        ) : (
          <AiOutlineMoon size={24} style={{ color: '#666' }} />
        )}
      </div>

      {/* Tabs Header */}
      <TabsHeader darkMode={darkMode} />

      <MenuButtons
        favoritesFilter={favoritesFilter}
        handleFavoritesFilterToggle={handleFavoritesFilterToggle}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
      />

      {/* UPLOAD BUTTON */}
      <div className="uploadContainer">
        <button className="uploadButton" onClick={handleOpenUploadModal}>
          <AiOutlinePlusCircle className="iconSmall" />
          Upload a piece
        </button>
      </div>

      {/* DISPLAYED IMAGES */}
      <div className="gridContainer">
        {displayedImages.length > 0 ? (
          displayedImages.map((item) => (
            <div key={item.id} className="gridItem" onClick={() => openModal(item)}>
              <div className="aspectRatioBox">
                <img
                  src={item.s3_url}
                  alt={`Clothing item ${item.id}`}
                  className="image"
                />
              </div>
            </div>
          ))
        ) : (
          <p>No images found.</p>
        )}
      </div>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onHide={handleCloseUploadModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload New Piece</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label htmlFor="uploadName">Piece Name</label>
            <input
              type="text"
              id="uploadName"
              className="form-control"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="uploadFile">Choose an Image</label>
            <input
              type="file"
              id="uploadFile"
              className="form-control"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="uploadModelResult">Model Result (optional)</label>
            <input
              type="text"
              id="uploadModelResult"
              className="form-control"
              value={uploadModelResult}
              onChange={(e) => setUploadModelResult(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleCloseUploadModal}>
            Cancel
          </button>
        </Modal.Footer>
      </Modal>

      {/* Details Modal */}
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
                      setSelectedItem((prev) => ({ ...prev, name: e.target.value }));
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
                  onClick={() => setShowItemKeys((prev) => !prev)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              {showItemKeys && (
                <div className="keyFeatures">
                  {keysToShow.map((key) => (
                    <div key={key} className="keyFeature">
                      <span className="keyLabel">{key}:</span>
                      {/* For "Brand" and "Value", always use text input mode if editing */}
                      {key === "Brand" || key === "Value" ? (
                        editingKey === key ? (
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
                          <span
                            className="keyValue"
                            onClick={() => setEditingKey(key)}
                            style={{ cursor: 'pointer' }}
                          >
                            {selectedItem[key] || "N/A"}
                          </span>
                        )
                      ) : (
                        // For dropdown-enabled fields
                        editingKey === key ? (
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
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "Custom") {
                                  setCustomMode((prev) => ({ ...prev, [key]: true }));
                                  setSelectedItem((prev) => ({ ...prev, [key]: "" }));
                                } else {
                                  setSelectedItem((prev) => ({ ...prev, [key]: value }));
                                }
                              }}
                              onKeyDown={handleKeyDown}
                              className="fieldInput"
                            >
                              {dropdownOptions[key] &&
                                dropdownOptions[key].map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
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
                        )
                      )}
                    </div>
                  ))}
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
                        .then((res) => res.json())
                        .then((updatedItem) => {
                          setSelectedItem(updatedItem);
                          fetchData();
                        })
                        .catch((err) => console.error('Error toggling favorite:', err));
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
                        .then((res) => res.json())
                        .then((updatedItem) => {
                          setSelectedItem(updatedItem);
                          fetchData();
                        })
                        .catch((err) => console.error('Error toggling favorite:', err));
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
              {/* Centered Button */}
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
