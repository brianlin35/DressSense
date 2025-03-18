import React, { useEffect, useState } from "react";
import styles from './SplashScreen.module.css';

const SplashScreen = ({ onFinish }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Show the splash for 4 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for the exit animation to finish (1s) before calling onFinish
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
