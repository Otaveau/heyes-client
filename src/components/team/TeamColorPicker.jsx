import { Check, X } from 'lucide-react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../context/ThemeContext';

// Composant pour le sélecteur de couleur à spectre complet
const ColorSpectrum = ({ onChange, currentColor }) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });
  const { darkMode } = useTheme();

  // Initialiser le spectre et le positionnement du sélecteur
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dessiner le spectre de couleurs
    const drawColorSpectrum = () => {
      const ctx = canvas.getContext('2d');

      // Créer un gradient horizontal (rouge à violet)
      const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradientH.addColorStop(0, 'rgb(255, 0, 0)');      // Rouge
      gradientH.addColorStop(1 / 6, 'rgb(255, 255, 0)');  // Jaune
      gradientH.addColorStop(2 / 6, 'rgb(0, 255, 0)');    // Vert
      gradientH.addColorStop(3 / 6, 'rgb(0, 255, 255)');  // Cyan
      gradientH.addColorStop(4 / 6, 'rgb(0, 0, 255)');    // Bleu
      gradientH.addColorStop(5 / 6, 'rgb(255, 0, 255)');  // Magenta
      gradientH.addColorStop(1, 'rgb(255, 0, 0)');      // Rouge (boucle)

      ctx.fillStyle = gradientH;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ajouter un gradient vertical (blanc à noir)
      const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradientV.addColorStop(0, 'rgba(255, 255, 255, 1)');  // Blanc
      gradientV.addColorStop(0.5, 'rgba(255, 255, 255, 0)'); // Transparent
      gradientV.addColorStop(0.5, 'rgba(0, 0, 0, 0)');      // Transparent
      gradientV.addColorStop(1, 'rgba(0, 0, 0, 1)');        // Noir

      ctx.fillStyle = gradientV;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    // Dessiner le spectre
    drawColorSpectrum();

  }, []); // Exécuter une seule fois à l'initialisation

  // Mettre à jour la position de l'indicateur lorsque currentColor change
  useEffect(() => {
    // Cette mise à jour ne devrait être appliquée qu'au moment de l'initialisation
    // ou si la couleur change depuis l'extérieur (pas par interaction interne)
    const canvas = canvasRef.current;
    if (!canvas || !currentColor || isDragging) return;

    // Rechercher la position approximative de la couleur dans le spectre
    // Note: ceci est une simplification, car trouver l'emplacement exact d'une 
    // couleur dans un spectre 2D est complexe

    const rect = canvas.getBoundingClientRect();

    // Position centrale par défaut
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Utiliser une position centrale pour l'instant
    // Dans une implémentation complète, vous pourriez calculer la position basée sur 
    // les composantes HSL de la couleur actuelle
    setSelectedPoint({
      x: centerX,
      y: centerY
    });

  }, [currentColor, isDragging]);

  // Obtenir la couleur à un point spécifique du canvas
  const getColorAtPoint = useCallback((x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';

    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1).data;

    // Convertir RGB en format hexadécimal avec padding pour s'assurer que chaque composante a deux chiffres
    return `#${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;
  }, []);

  // Gérer le clic ou le mouvement sur le canvas
  const handleColorSelect = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Calculer les coordonnées relatives à l'élément canvas affiché
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // S'assurer que les coordonnées sont dans les limites du canvas affiché
    const boundedX = Math.min(Math.max(0, clientX), rect.width);
    const boundedY = Math.min(Math.max(0, clientY), rect.height);

    // Mettre à jour la position de l'indicateur
    setSelectedPoint({
      x: boundedX,
      y: boundedY
    });

    // Convertir en coordonnées relatives au canvas interne pour obtenir la couleur
    const canvasX = Math.min(Math.max(0, (boundedX / rect.width) * canvas.width), canvas.width - 1);
    const canvasY = Math.min(Math.max(0, (boundedY / rect.height) * canvas.height), canvas.height - 1);

    const color = getColorAtPoint(Math.floor(canvasX), Math.floor(canvasY));
    onChange(color);
  }, [getColorAtPoint, onChange]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}  // Augmenté de 256 à 400
        height={220} // Augmenté de 150 à 220
        className="w-full h-56 rounded-md cursor-crosshair" // Augmenté de h-36 à h-56
        onClick={handleColorSelect}
        onMouseDown={(e) => {
          e.preventDefault(); // Empêcher la sélection de texte
          setIsDragging(true);
          handleColorSelect(e);
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            e.preventDefault(); // Empêcher la sélection de texte
            handleColorSelect(e);
          }
        }}
        onMouseUp={(e) => {
          e.preventDefault(); // Empêcher la sélection de texte
          setIsDragging(false);
        }}
        onMouseLeave={(e) => {
          e.preventDefault(); // Empêcher la sélection de texte
          setIsDragging(false);
        }}
      />

      {/* Indicateur de sélection - un seul marqueur fixé à la position du curseur */}
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${selectedPoint.x}px`,
          top: `${selectedPoint.y}px`,
          boxShadow: darkMode ? '0 0 0 1px rgba(255,255,255,0.5)' : '0 0 0 1px rgba(0,0,0,0.3)'
        }}
        key="color-selector-indicator"
      />
    </div>
  );
};

// Fonction utilitaire pour déterminer si une couleur est claire ou foncée
function isLightColor(color) {
  // Pour les couleurs au format hexadécimal
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  }
  return false;
}

// Fonction utilitaire pour normaliser une valeur hexadécimale
function normalizeHexColor(color) {
  if (!color) return '#000000';

  // S'assurer que la couleur commence par #
  let hexColor = color.startsWith('#') ? color : `#${color}`;

  // Convertir les valeurs raccourcies (ex: #FFF) en format complet (ex: #FFFFFF)
  if (hexColor.length === 4) {
    const r = hexColor[1];
    const g = hexColor[2];
    const b = hexColor[3];
    hexColor = `#${r}${r}${g}${g}${b}${b}`;
  }

  // Vérifier si c'est une valeur hexadécimale valide
  if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    return '#000000'; // Valeur par défaut
  }

  return hexColor.toUpperCase();
}

// Composant principal du sélecteur de couleur
const ColorPickerContent = ({ initialColor, onColorChange, onClose }) => {
  const { darkMode } = useTheme();
  const [selectedColor, setSelectedColor] = useState(() => normalizeHexColor(initialColor));
  const [inputColor, setInputColor] = useState(() => normalizeHexColor(initialColor));
  const pickerRef = useRef(null);

  // Mettre à jour les états lorsque initialColor change
  useEffect(() => {
    const normalized = normalizeHexColor(initialColor);
    setSelectedColor(normalized);
    setInputColor(normalized);
  }, [initialColor]);

  // Fonction pour valider la valeur hexadécimale
  const isValidHex = useCallback((hex) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }, []);

  // Gestion de la modification manuelle du code couleur
  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setInputColor(value);

    // Si c'est une valeur hexadécimale valide, mettre à jour la couleur sélectionnée
    if (isValidHex(value)) {
      const normalized = normalizeHexColor(value);
      setSelectedColor(normalized);
      onColorChange(normalized);
    }
  }, [isValidHex, onColorChange]);

  // Gestion du changement via le color picker natif
  const handleNativeColorChange = useCallback((e) => {
    const value = e.target.value;
    const normalized = normalizeHexColor(value);
    setSelectedColor(normalized);
    setInputColor(normalized);
    onColorChange(normalized);
  }, [onColorChange]);

  // Gestion du changement via le spectre de couleurs
  const handleSpectrumChange = useCallback((color) => {
    const normalized = normalizeHexColor(color);
    setSelectedColor(normalized);
    setInputColor(normalized);
    onColorChange(normalized);
  }, [onColorChange]);

  // Gestion du clic en dehors du sélecteur pour fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Ajouter l'écouteur d'événements
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Gestion de la touche Escape pour fermer
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-96" // Augmenté de w-72 à w-96
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sélecteur de couleur</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Affichage de la couleur sélectionnée */}
      <div
        className="h-16 w-full rounded-md mb-3 shadow-inner border border-gray-200 dark:border-gray-700 flex items-center justify-center"
        style={{ backgroundColor: selectedColor }}
      >
        <span className={`text-lg font-mono ${isLightColor(selectedColor) ? 'text-gray-800' : 'text-white'}`}>
          {selectedColor}
        </span>
      </div>

      {/* Spectre de couleurs */}
      <div className="mb-4">
        <ColorSpectrum onChange={handleSpectrumChange} currentColor={selectedColor} />
      </div>

      {/* Champs de saisie de la couleur */}
      <div className="flex space-x-3 mb-4">
        <Input
          type="color"
          value={selectedColor}
          onChange={handleNativeColorChange}
          className="w-14 h-14 p-1 cursor-pointer bg-transparent dark:bg-transparent" // Ajouté bg-transparent
        />
        <div className="flex-1 relative">
          <label htmlFor="hexColor" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Code hexadécimal</label>
          <Input
            id="hexColor"
            type="text"
            value={inputColor}
            onChange={handleInputChange}
            placeholder="#RRGGBB"
            className={`w-full pl-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 ${!isValidHex(inputColor) && inputColor !== '' ? 'border-red-500 dark:border-red-500' : ''}`}
          />
          {isValidHex(inputColor) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-end mt-6 space-x-3">
        <Button
          variant="outline"
          size="default"
          onClick={onClose}
          type="button"
          className="px-5 py-2.5 border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-all duration-200 font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 focus:outline-none"
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
        <Button
          size="default"
          onClick={() => {
            onColorChange(selectedColor);
            onClose();
          }}
          type="button"
          className="px-5 py-2.5 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200 font-medium focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:outline-none"
        >
          <Check className="h-4 w-4 mr-2" />
          Appliquer
        </Button>
      </div>
    </div>
  );
};

// Composant de portail qui rend le sélecteur de couleur à l'extérieur de la hiérarchie DOM
export const TeamColorPicker = ({ isOpen, initialColor, onColorChange, onClose, referenceElement }) => {
  const { darkMode } = useTheme();
  
  // Si le portail n'est pas ouvert, ne rien afficher
  if (!isOpen || typeof window === 'undefined') return null;

  // Calculer la position basée sur l'élément de référence
  const calcPosition = () => {
    if (!referenceElement?.current) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const rect = referenceElement.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceRight = window.innerWidth - rect.left;

    // Largeur nécessaire pour le color picker
    const pickerWidth = 400; // en pixels

    // Vérifier s'il y a suffisamment d'espace en dessous
    if (spaceBelow < 550) { // Augmenté pour tenir compte de la hauteur du picker agrandi
      // Pas assez d'espace en dessous, placer au-dessus si possible
      return {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 10}px`,
        left: `${Math.max(10, Math.min(rect.left, window.innerWidth - pickerWidth - 10))}px`,
        maxHeight: `${rect.top - 20}px`,
        overflowY: 'auto'
      };
    }

    // Vérifier s'il y a suffisamment d'espace à droite
    if (spaceRight < pickerWidth) {
      // Pas assez d'espace à droite, aligner à droite
      return {
        position: 'fixed',
        top: `${rect.bottom + 10}px`,
        right: `${window.innerWidth - rect.right + 10}px`,
        maxHeight: `${spaceBelow - 20}px`,
        overflowY: 'auto'
      };
    }

    // Position par défaut (en dessous, aligné à gauche)
    return {
      position: 'fixed',
      top: `${rect.bottom + 10}px`,
      left: `${rect.left}px`,
      maxHeight: `${spaceBelow - 20}px`,
      overflowY: 'auto'
    };
  };

  // Utiliser createPortal pour rendre le sélecteur de couleur au niveau du body
  return ReactDOM.createPortal(
    <div style={calcPosition()}>
      <ColorPickerContent
        initialColor={initialColor}
        onColorChange={onColorChange}
        onClose={onClose}
      />
    </div>,
    document.body
  );
};