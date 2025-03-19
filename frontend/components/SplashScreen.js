// components/SplashScreen.js
import React, { useEffect, useState } from "react";
import styles from './SplashScreen.module.css';

const SplashScreen = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        onFinish();
      }, 1000);
      return () => clearTimeout(exitTimer);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className={`${styles.splash} ${isExiting ? styles.exit : ""}`}>
      <div className={styles.textContainer}>
        <h1 className={styles.title}>Dress Sense</h1>
        <p className={styles.motto}>Look Sharp, Feel Smart, Be Unstoppable</p>
      </div>
    </div>
  );
};

export default SplashScreen;
