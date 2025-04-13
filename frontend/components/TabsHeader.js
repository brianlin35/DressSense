import React from 'react';
import { useRouter } from 'next/router';
import { AiOutlineMoon, AiOutlineSun } from 'react-icons/ai';

const TabsHeader = ({ darkMode, toggleDarkMode }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const tabs = [
    { label: 'Pieces', path: '/' },
    { label: 'Fits', path: '/fits' },
    { label: 'Collections', path: '/collections' },
  ];

  const tabStyle = (isActive) => ({
    fontSize: '32px',
    cursor: 'pointer',
    margin: '0 15px',
    color: isActive ? (darkMode ? 'white' : 'black') : '#aaa',
    borderBottom: isActive ? '3px solid blue' : 'none',
    paddingBottom: '5px',
    transition: 'border-bottom 0.2s ease, color 0.2s ease',
  });

  return (
    <div
      className="tabsHeader"
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20px',
      }}
    >
      {/* Centered Tabs */}
      {tabs.map((tab) => (
        <div
          key={tab.path}
          onClick={() => router.push(tab.path)}
          style={tabStyle(currentPath === tab.path)}
        >
          {tab.label}
        </div>
      ))}

      {/* Dark Mode Toggle positioned absolutely on the right */}
      <div
        onClick={toggleDarkMode}
        style={{
          position: 'absolute',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        {darkMode ? (
          <>
            <AiOutlineSun size={24} style={{ color: '#FFD700' }} />
            <span style={{ color: 'white' }}></span>
          </>
        ) : (
          <>
            <AiOutlineMoon size={24} style={{ color: '#555' }} />
            <span style={{ color: 'black' }}></span>
          </>
        )}
      </div>
    </div>
  );
};

export default TabsHeader;
