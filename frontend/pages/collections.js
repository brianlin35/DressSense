// pages/collections.js
import React from 'react';
import TabsHeader from '../components/TabsHeader';

export default function Collections() {
  return (
    <div style={styles.container}>
      <TabsHeader />
      {/* Content for Collections will go here in the future */}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
};
