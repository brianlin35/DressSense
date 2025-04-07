import React from 'react';
import { 
  AiFillHeart, 
  AiOutlineAppstore, 
  AiOutlineTags, 
  AiOutlineBgColors, 
  AiOutlineShopping, 
  AiOutlineDollarCircle 
} from 'react-icons/ai';

const MenuButtons = ({
  favoritesFilter,
  handleFavoritesFilterToggle,
  activeFilters,
  onToggleFilter
}) => {
  
  const filterColors = {
    category: 'blue',
    type: 'purple',
    color: 'orange',
    brand: 'pink',
    price: 'green'
  };

  return (
    <div className="filtersContainer">
      {/* Favorites */}
      <button className="filterButton" onClick={handleFavoritesFilterToggle}>
        <AiFillHeart 
          className="iconStyle" 
          style={{ color: favoritesFilter ? 'red' : '#555' }} 
        />
        Favorites
      </button>

      {/* Category */}
      <button 
        className={`filterButton ${activeFilters.category ? 'active' : ''}`} 
        onClick={() => onToggleFilter('category')}
      >
        <AiOutlineAppstore 
          className="iconStyle" 
          style={{ color: activeFilters.category ? filterColors.category : '#555' }} 
        />
        Category
      </button>

      {/* Type */}
      <button 
        className={`filterButton ${activeFilters.type ? 'active' : ''}`} 
        onClick={() => onToggleFilter('type')}
      >
        <AiOutlineTags 
          className="iconStyle" 
          style={{ color: activeFilters.type ? filterColors.type : '#555' }} 
        />
        Type
      </button>

      {/* Color */}
      <button 
        className={`filterButton ${activeFilters.color ? 'active' : ''}`} 
        onClick={() => onToggleFilter('color')}
      >
        <AiOutlineBgColors 
          className="iconStyle" 
          style={{ color: activeFilters.color ? filterColors.color : '#555' }} 
        />
        Color
      </button>

      {/* Brand */}
      <button 
        className={`filterButton ${activeFilters.brand ? 'active' : ''}`} 
        onClick={() => onToggleFilter('brand')}
      >
        <AiOutlineShopping 
          className="iconStyle" 
          style={{ color: activeFilters.brand ? filterColors.brand : '#555' }} 
        />
        Brand
      </button>

      {/* Price */}
      <button 
        className={`filterButton ${activeFilters.price ? 'active' : ''}`} 
        onClick={() => onToggleFilter('price')}
      >
        <AiOutlineDollarCircle 
          className="iconStyle" 
          style={{ color: activeFilters.price ? filterColors.price : '#555' }} 
        />
        Price
      </button>
    </div>
  );
};

export default MenuButtons;
