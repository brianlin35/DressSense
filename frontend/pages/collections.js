import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import TabsHeader from '../components/TabsHeader';

export default function Collections({ darkMode, toggleDarkMode }) {
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [hoveredOutfit, setHoveredOutfit] = useState(null);

  useEffect(() => {
    // Load saved outfits from localStorage
    const loadOutfits = () => {
      const outfits = JSON.parse(localStorage.getItem('savedOutfits') || '[]');
      setSavedOutfits(outfits);
    };
    loadOutfits();

    // Listen for storage events to sync across tabs
    window.addEventListener('storage', loadOutfits);
    return () => window.removeEventListener('storage', loadOutfits);
  }, []);

  const handleDeleteOutfit = (id, e) => {
    e.stopPropagation();
    const updatedOutfits = savedOutfits.filter(outfit => outfit.id !== id);
    setSavedOutfits(updatedOutfits);
    localStorage.setItem('savedOutfits', JSON.stringify(updatedOutfits));
  };

  const handleOutfitClick = (outfit) => {
    setSelectedOutfit(outfit);
    setShowOutfitModal(true);
  };

  return (
    <div className="collections-container">
      <TabsHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="outfits-grid">
        {savedOutfits.length > 0 ? (
          savedOutfits.map((outfit) => (
            <div 
              key={outfit.id}
              className="outfit-card"
              onClick={() => handleOutfitClick(outfit)}
              onMouseEnter={() => setHoveredOutfit(outfit.id)}
              onMouseLeave={() => setHoveredOutfit(null)}
            >
              <div className="card-stack">
                {outfit.images.map((imageUrl, index) => (
                  <div 
                    key={index}
                    className={`stacked-image ${hoveredOutfit === outfit.id ? 'hovered' : ''}`}
                    style={{ 
                      zIndex: outfit.images.length - index,
                      transform: hoveredOutfit === outfit.id 
                        ? `rotate(${index * 2}deg) translateX(${index * 15}px)` 
                        : 'rotate(0) translateX(0)'
                    }}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Outfit piece ${index}`} 
                      className="outfit-image"
                    />
                  </div>
                ))}
              </div>
              
              <div className="card-footer">
                <button 
                  className="delete-btn"
                  onClick={(e) => handleDeleteOutfit(outfit.id, e)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No saved outfits yet. Create some recommendations to see them here!</p>
          </div>
        )}
      </div>

      {selectedOutfit && (
        <Modal 
          show={showOutfitModal} 
          onHide={() => setShowOutfitModal(false)} 
          centered 
          size="lg"
          className={darkMode ? 'dark-mode' : ''}
        >
          <Modal.Header closeButton>
            <Modal.Title>Outfit Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="outfit-images-grid">
              {selectedOutfit.images.map((imageUrl, index) => (
                <div key={index} className="modal-image-container">
                  <img 
                    src={imageUrl} 
                    alt={`Outfit piece ${index}`} 
                    className="modal-image"
                  />
                </div>
              ))}
            </div>
            
            <div className="outfit-details">
              <h4>Explanation</h4>
              <p>{selectedOutfit.explanation}</p>
              
              <h4>Styling Tips</h4>
              <p>{selectedOutfit.stylingTips}</p>
              
              <div className="outfit-date">
                Saved on: {new Date(selectedOutfit.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}