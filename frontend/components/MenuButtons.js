import React from 'react';
import { 
  AiFillHeart, 
  AiOutlineAppstore, 
  AiOutlineTags, 
  AiOutlineBgColors, 
  AiOutlineShopping, 
  AiOutlinePlusCircle
} from 'react-icons/ai';

const MenuButtons = ({
  favoritesFilter,
  handleFavoritesFilterToggle,
  activeFilters,
  onToggleFilter,
  onUploadClick
}) => {
  // Colors to highlight icons if filter is active
  const filterColors = {
    category: 'blue',
    type: 'purple',
    color: 'orange',
    brand: 'pink',
  };

  // Common style for each button
  const buttonStyle = {
    fontSize: '14px',     // slightly smaller text
    padding: '4px 8px',   // smaller padding
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  return (
    <div
      className="filtersContainer"
      style={{
        display: 'flex',
        flexWrap: 'wrap',         // allow buttons to wrap if not enough horizontal space
        justifyContent: 'center', // center horizontally
        alignItems: 'center',
        gap: '10px',              // spacing between buttons
        marginTop: '20px'
      }}
    >
      {/* Favorites */}
      <button
        className="filterButton"
        onClick={handleFavoritesFilterToggle}
        style={buttonStyle}
      >
        <AiFillHeart 
          className="iconStyle"
          style={{
            color: favoritesFilter ? 'red' : '#555',
            fontSize: '16px'
          }}
        />
        Favorites
      </button>

      {/* Category */}
      <button
        className={`filterButton ${activeFilters.category ? 'active' : ''}`}
        onClick={() => onToggleFilter('category')}
        style={buttonStyle}
      >
        <AiOutlineAppstore
          className="iconStyle"
          style={{
            color: activeFilters.category ? filterColors.category : '#555',
            fontSize: '16px'
          }}
        />
        Category
      </button>

      {/* Type */}
      <button
        className={`filterButton ${activeFilters.type ? 'active' : ''}`}
        onClick={() => onToggleFilter('type')}
        style={buttonStyle}
      >
        <AiOutlineTags
          className="iconStyle"
          style={{
            color: activeFilters.type ? filterColors.type : '#555',
            fontSize: '16px'
          }}
        />
        Type
      </button>

      {/* Color */}
      <button
        className={`filterButton ${activeFilters.color ? 'active' : ''}`}
        onClick={() => onToggleFilter('color')}
        style={buttonStyle}
      >
        <AiOutlineBgColors
          className="iconStyle"
          style={{
            color: activeFilters.color ? filterColors.color : '#555',
            fontSize: '16px'
          }}
        />
        Color
      </button>

      {/* Brand */}
      <button
        className={`filterButton ${activeFilters.brand ? 'active' : ''}`}
        onClick={() => onToggleFilter('brand')}
        style={buttonStyle}
      >
        <AiOutlineShopping
          className="iconStyle"
          style={{
            color: activeFilters.brand ? filterColors.brand : '#555',
            fontSize: '16px'
          }}
        />
        Brand
      </button>

      {/* Upload pieces button */}
      <button
        className="uploadButton"
        onClick={onUploadClick}
        style={buttonStyle}
      >
        <AiOutlinePlusCircle style={{ fontSize: '16px' }} />
        Upload pieces
      </button>
    </div>
  );
};

export default MenuButtons;
