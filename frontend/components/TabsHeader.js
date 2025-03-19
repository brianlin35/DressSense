// components/TabsHeader.js
import React from 'react';
import { useRouter } from 'next/router';

const TabsHeader = () => {
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
    color: isActive ? 'black' : '#aaa',
    borderBottom: isActive ? '3px solid blue' : 'none',
    paddingBottom: '5px',
    transition: 'border-bottom 0.2s ease, color 0.2s ease',
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
      {tabs.map((tab) => (
        <div
          key={tab.path}
          onClick={() => router.push(tab.path)}
          style={tabStyle(currentPath === tab.path)}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
};

export default TabsHeader;
