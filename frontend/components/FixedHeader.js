import React from 'react';
import TabsHeader from './TabsHeader';
import MenuButtons from './MenuButtons';

const FixedHeader = ({
  darkMode,
  toggleDarkMode,
  favoritesFilter,
  handleFavoritesFilterToggle,
  activeFilters,
  onToggleFilter,
  onUploadClick
}) => {
  const showFilters = favoritesFilter !== undefined 
    && handleFavoritesFilterToggle 
    && activeFilters 
    && onToggleFilter;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: darkMode ? '#000' : '#fff',
        zIndex: 10000,
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        padding: '10px 20px'
      }}
    >
      <TabsHeader darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      {showFilters && (
        <MenuButtons
          favoritesFilter={favoritesFilter}
          handleFavoritesFilterToggle={handleFavoritesFilterToggle}
          activeFilters={activeFilters}
          onToggleFilter={onToggleFilter}
          onUploadClick={onUploadClick}
        />
      )}
    </div>
  );
};

export default FixedHeader;
