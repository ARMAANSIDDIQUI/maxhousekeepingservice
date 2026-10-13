import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingCurtain from '../components/common/LoadingCurtain';

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Trigger curtain on route change with clear, elegant visibility (950ms)
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 950);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const showCurtain = () => {
    setIsVisible(true);
  };

  const hideCurtain = () => {
    setIsVisible(false);
  };

  return (
    <LoadingContext.Provider value={{ showCurtain, hideCurtain, isVisible }}>
      <LoadingCurtain isVisible={isVisible} />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

export default LoadingContext;
