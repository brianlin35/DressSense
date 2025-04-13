import React, { useEffect, useState, useRef } from 'react';
import TabsHeader from '../components/TabsHeader';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';

export default function Collections({ darkMode, toggleDarkMode }) {
  const [outfits, setOutfits] = useState([]);
  const [expandedOutfitId, setExpandedOutfitId] = useState(null);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [activeImage, setActiveImage] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('savedOutfits');
    const parsed = stored ? JSON.parse(stored) : [];
    parsed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setOutfits(parsed);
  }, []);

  const saveToLocal = (updated) => {
    localStorage.setItem('savedOutfits', JSON.stringify(updated));
    setOutfits(updated);
  };

  const handleDelete = (id) => {
    const updated = outfits.filter((o) => o.id !== id);
    saveToLocal(updated);
  };

  const toggleExpand = (id) => {
    setExpandedOutfitId((prev) => (prev === id ? null : id));
    setEditingTitleId(null);
    setActiveImage(null);
  };

  const startEditingTitle = (id, currentTitle) => {
    setEditingTitleId(id);
    setTempTitle(currentTitle);
  };

  const saveTitle = (id) => {
    const updated = outfits.map((o) =>
      o.id === id ? { ...o, title: tempTitle || o.title } : o
    );
    saveToLocal(updated);
    setEditingTitleId(null);
  };

  const handleClickOutside = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.target)) {
      setExpandedOutfitId(null);
      setActiveImage(null);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={styles.container}>
      <TabsHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {outfits.length === 0 ? (
        <p style={styles.emptyText}>No outfits saved yet, generate a fit first!</p>
      ) : (
        outfits.map((outfit, index) => {
          const isExpanded = expandedOutfitId === outfit.id;
          const isEditing = editingTitleId === outfit.id;
          const title = outfit.title || `Outfit ${outfits.length - index}`;

          return (
            <div key={outfit.id} style={styles.outfitCard}>
              <div style={styles.promptRow}>
                <AiOutlineDelete
                  size={20}
                  style={styles.icon}
                  onClick={() => handleDelete(outfit.id)}
                />
              </div>

              <div style={styles.titleRow}>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(outfit.id);
                    }}
                    onBlur={() => saveTitle(outfit.id)}
                    style={styles.titleInput}
                    autoFocus
                  />
                ) : (
                  <h2 style={styles.outfitTitle} onClick={() => toggleExpand(outfit.id)}>
                    {title}
                    {isExpanded && (
                      <AiOutlineEdit
                        size={16}
                        style={styles.editIcon}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingTitle(outfit.id, title);
                        }}
                      />
                    )}
                  </h2>
                )}
              </div>

              <div className={`image-stack ${isExpanded ? 'expanded' : ''}`}>
                {outfit.images.map((url, idx) => {
                  const offset = isExpanded ? idx * 180 : idx * 40;
                  const isClicked = activeImage === `${outfit.id}-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="stacked-wrapper"
                      style={{ left: `${offset}px`, zIndex: outfit.images.length - idx }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isExpanded) {
                          setActiveImage(
                            activeImage === `${outfit.id}-${idx}` ? null : `${outfit.id}-${idx}`
                          );
                        }
                      }}
                    >
                      <img src={url} className="stacked-image" alt={`outfit-${idx}`} />
                      {isExpanded && isClicked && (
                        <div className="feature-box">Key features coming soon</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {isExpanded && (
                <>
                  <div className="prompt-text"><strong>Prompt:</strong> {outfit.prompt}</div>
                  <div className="prompt-text"><strong>Explanation:</strong> {outfit.explanation}</div>
                  <div className="prompt-text"><strong>Styling Tips:</strong> {outfit.styling}</div>
                </>
              )}
            </div>
          );
        })
      )}

      <style jsx>{`
        .image-stack {
          position: relative;
          height: 200px;
          margin-bottom: 10px;
        }
        .stacked-wrapper {
          position: absolute;
          transition: left 0.5s ease;
        }
        .stacked-image {
          height: 200px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
          cursor: pointer;
        }
        .prompt-text {
          font-size: 1rem;
          margin: 5px 0;
          line-height: 1.4;
        }
        .feature-box {
          position: absolute;
          top: 100%;
          left: 0;
          background: #fff;
          padding: 8px 12px;
          margin-top: 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          white-space: nowrap;
          font-size: 0.9rem;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: '60px',
    fontSize: '1.2rem',
    color: '#777',
  },
  outfitCard: {
    marginBottom: '60px',
    paddingBottom: '20px',
    borderBottom: '1px solid #ccc',
  },
  promptRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '10px',
  },
  icon: {
    cursor: 'pointer',
    color: '#777',
  },
  titleRow: {
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  outfitTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginRight: '10px',
    cursor: 'pointer',
  },
  titleInput: {
    fontSize: '1.1rem',
    padding: '4px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '50%',
  },
  editIcon: {
    marginLeft: '8px',
    cursor: 'pointer',
    verticalAlign: 'middle',
  },
};
