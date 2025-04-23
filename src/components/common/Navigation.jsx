import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logoImage from '../../assets/hays.png';
import { 
  Calendar, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  X,  
  Settings,
  Sun,
  Moon
} from 'lucide-react';

// Composant pour le badge d'avatar utilisateur
const UserAvatar = ({ name }) => {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className="h-10 w-10 rounded-full bg-indigo-600 dark:bg-indigo-700 flex items-center justify-center text-white text-lg" aria-hidden="true">
      {initial}
    </div>
  );
};

// Composant pour les éléments de navigation
const NavItem = ({ path, icon, label, isActive }) => (
  <Link
    to={path}
    className={`inline-flex items-center px-4 py-2 text-base font-medium rounded-md transition-colors duration-150 ${
      isActive
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
        : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700/30'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="ml-2 text-lg">{label}</span>
  </Link>
);

// Composant pour les éléments de menu mobile
const MobileNavItem = ({ path, icon, label, isActive }) => (
  <Link
    to={path}
    className={`flex items-center px-4 py-3 text-lg font-medium ${
      isActive
        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
        : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
    aria-current={isActive ? 'page' : undefined}
  >
    {icon}
    <span className="ml-3">{label}</span>
  </Link>
);

// Composant pour le toggle du thème
const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
      aria-label={darkMode ? "Passer au mode clair" : "Passer au mode sombre"}
    >
      {darkMode ? (
        <Sun className="h-6 w-6" aria-hidden="true" />
      ) : (
        <Moon className="h-6 w-6" aria-hidden="true" />
      )}
    </button>
  );
};

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { state, logout } = useAuth();
  const location = useLocation();
  
  // Références pour gérer les clics à l'extérieur
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);

  // Définition des items de navigation une seule fois
  const navItems = useMemo(() => [
    { path: '/calendar', icon: <Calendar className="h-6 w-6" />, label: 'Calendrier' },
    { path: '/owners', icon: <UserCircle className="h-6 w-6" />, label: 'Owners' },
    { path: '/teams', icon: <Users className="h-6 w-6" />, label: 'Teams' },
  ], []);

  // Gestionnaire de déconnexion mémorisé
  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  // Fermer les menus quand on change de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Gestion du clic à l'extérieur pour fermer le menu utilisateur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isUserMenuOpen &&
        userMenuRef.current && 
        !userMenuRef.current.contains(event.target) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Gestion des touches pour fermer les menus avec Escape
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Extraction du nom d'utilisateur et de l'email
  const userName = state.user?.name || 'Utilisateur';
  const userEmail = state.user?.email || '';

  // Gestion de l'ouverture/fermeture du menu utilisateur
  const toggleUserMenu = useCallback(() => {
    setIsUserMenuOpen(prev => !prev);
  }, []);

  // Gestion de l'ouverture/fermeture du menu mobile
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* Barre principale */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            {/* Logo et navigation principale */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/calendar" className="flex items-center" aria-label="Accueil">
                  <img src={logoImage} alt="Logo Heyes" className="h-10 w-auto" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-white ml-1">Eyes</span>
                </Link>
              </div>

              {/* Navigation desktop */}
              <nav className="hidden sm:ml-10 sm:flex sm:space-x-6" aria-label="Navigation principale">
                {navItems.map((item) => (
                  <NavItem
                    key={item.path}
                    path={item.path}
                    icon={item.icon}
                    label={item.label}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </nav>
            </div>

            {/* Actions de droite */}
            <div className="flex items-center">
              {/* Bouton de bascule thème sombre/clair */}
              <div className="mr-4">
                <ThemeToggle />
              </div>
              
              {/* Menu utilisateur */}
              <div className="ml-3 relative">
                <button
                  ref={userButtonRef}
                  onClick={toggleUserMenu}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  id="user-menu"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="sr-only">Ouvrir le menu utilisateur</span>
                  <UserAvatar name={userName} />
                </button>
                
                {/* Menu déroulant */}
                {isUserMenuOpen && (
                  <div
                    ref={userMenuRef}
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="py-1">
                      <div className="block px-4 py-2 text-base text-gray-700 dark:text-gray-300">
                        <div className="font-medium">{userName}</div>
                        <div className="text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/settings"
                        className="w-full text-left block px-4 py-2 text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 mr-2" />
                          Paramètres
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-base text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <div className="flex items-center">
                          <LogOut className="h-5 w-5 mr-2" />
                          Déconnexion
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton menu mobile */}
              <div className="flex items-center sm:hidden ml-3">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">{isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
                  {isMobileMenuOpen ? (
                    <X className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Menu className="block h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        id="mobile-menu"
        className={`${
          isMobileMenuOpen ? 'block' : 'hidden'
        } sm:hidden bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm`}
      >
        <nav className="pt-2 pb-3 space-y-1" aria-label="Navigation mobile">
          {navItems.map((item) => (
            <MobileNavItem
              key={item.path}
              path={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
            />
          ))}
          {/* Ajouter le toggle du thème dans le menu mobile */}
          <div className="px-4 py-3 flex items-center">
            <Sun className="h-6 w-6 mr-3 text-gray-500 dark:text-gray-400" />
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300 mr-auto">Mode sombre</span>
            <ThemeToggle />
          </div>
        </nav>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <UserAvatar name={userName} />
            </div>
            <div className="ml-3">
              <div className="text-lg font-medium text-gray-800 dark:text-white">
                {userName}
              </div>
              <div className="text-base font-medium text-gray-500 dark:text-gray-400 truncate">
                {userEmail}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Link
              to="/settings"
              className="w-full flex items-center px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Settings className="h-6 w-6 mr-3 text-gray-500 dark:text-gray-400" />
              Paramètres
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-lg font-medium text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-6 w-6 mr-3 text-red-500 dark:text-red-400" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}