import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Récupérer la préférence utilisateur du localStorage
    const savedTheme = localStorage.getItem('darkMode');
    // Si une préférence existe, l'utiliser, sinon vérifier la préférence système
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    // Vérifier la préférence système (dark mode)
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Appliquer le thème au document HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);