import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { X, Check, Pipette } from 'lucide-react';

// Composant pour le sélecteur de couleur à spectre complet
const ColorSpectrum = ({ onChange, currentColor }) => {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState({ x: 0, y: 0 });
  
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
      gradientH.addColorStop(1/6, 'rgb(255, 255, 0)');  // Jaune
      gradientH.addColorStop(2/6, 'rgb(0, 255, 0)');    // Vert
      gradientH.addColorStop(3/6, 'rgb(0, 255, 255)');  // Cyan
      gradientH.addColorStop(4/6, 'rgb(0, 0, 255)');    // Bleu
      gradientH.addColorStop(5/6, 'rgb(255, 0, 255)');  // Magenta
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
    
    // Initialiser la position du sélecteur après un court délai pour s'assurer que le canvas est bien rendu
    setTimeout(() => {
      const rect = canvas.getBoundingClientRect();
      
      // Position centrale
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Définir la position initiale
      setSelectedPoint({
        x: centerX,
        y: centerY
      });
      
      // Obtenir la couleur à cette position
      const canvasX = Math.floor((centerX / rect.width) * canvas.width);
      const canvasY = Math.floor((centerY / rect.height) * canvas.height);
      const initialColor = getColorAtPoint(canvasX, canvasY);
      
      // Informer le parent de la couleur initiale
      onChange(initialColor);
    }, 50);
    
  }, []); // Exécuter une seule fois à l'initialisation
  
  // Obtenir la couleur à un point spécifique du canvas
  const getColorAtPoint = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return '#000000';
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(x, y, 1, 1).data;
    
    // Convertir RGB en format hexadécimal
    return `#${imageData[0].toString(16).padStart(2, '0')}${imageData[1].toString(16).padStart(2, '0')}${imageData[2].toString(16).padStart(2, '0')}`;
  };
  
  // Gérer le clic ou le mouvement sur le canvas
  const handleColorSelect = (e) => {
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
  };
  
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={256}
        height={150}
        className="w-full h-36 rounded-md cursor-crosshair"
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
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
        }}
        key="color-selector-indicator"
      />
    </div>
  );
};

// Composant principal du sélecteur de couleur
const ColorPickerContent = ({ initialColor, onColorChange, onClose, position }) => {
  const [selectedColor, setSelectedColor] = useState(initialColor || '#000000');
  const [inputColor, setInputColor] = useState(initialColor || '#000000');
  const pickerRef = useRef(null);

  // Fonction pour valider la valeur hexadécimale
  const isValidHex = (hex) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  };

  // Gestion de la modification manuelle du code couleur
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputColor(value);
    
    // Si c'est une valeur hexadécimale valide, mettre à jour la couleur sélectionnée
    if (isValidHex(value)) {
      setSelectedColor(value);
      onColorChange(value);
    }
  };

  // Gestion du changement via le color picker natif
  const handleNativeColorChange = (e) => {
    const value = e.target.value;
    setSelectedColor(value);
    setInputColor(value);
    onColorChange(value);
  };
  
  // Gestion du changement via le spectre de couleurs
  const handleSpectrumChange = (color) => {
    setSelectedColor(color);
    setInputColor(color);
    onColorChange(color);
  };

  // Gestion du clic en dehors du sélecteur pour fermer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    // Ajouter l'écouteur d'événements avec un délai
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72"
      style={{
        position: 'fixed',
        zIndex: 9999,
        top: position.top,
        left: position.left,
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sélecteur de couleur</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Affichage de la couleur sélectionnée */}
      <div 
        className="h-12 w-full rounded-md mb-3 shadow-inner border border-gray-200 dark:border-gray-700 flex items-center justify-center"
        style={{ backgroundColor: selectedColor }}
      >
        <span className={`text-sm font-mono ${isLightColor(selectedColor) ? 'text-gray-800' : 'text-white'}`}>
          {selectedColor}
        </span>
      </div>
      
      {/* Spectre de couleurs */}
      <div className="mb-4">
        <ColorSpectrum onChange={handleSpectrumChange} currentColor={selectedColor} />
      </div>
      
      {/* Champs de saisie de la couleur */}
      <div className="flex space-x-2 mb-4">
        <Input
          type="color"
          value={selectedColor}
          onChange={handleNativeColorChange}
          className="w-10 h-10 p-1 cursor-pointer"
        />
        <div className="flex-1 relative">
          <Input
            type="text"
            value={inputColor}
            onChange={handleInputChange}
            placeholder="#RRGGBB"
            className={`w-full pl-2 ${!isValidHex(inputColor) && inputColor !== '' ? 'border-red-500' : ''}`}
          />
          {isValidHex(inputColor) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Check className="h-4 w-4 text-green-500" />
            </div>
          )}
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex justify-end mt-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onClose}
          type="button"
        >
          Annuler
        </Button>
        <Button 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => {
            onColorChange(selectedColor);
            onClose();
          }}
          type="button"
        >
          Appliquer
        </Button>
      </div>
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

// Composant de portail qui rend le sélecteur de couleur à l'extérieur de la hiérarchie DOM
const ColorPickerPortal = ({ isOpen, initialColor, onColorChange, onClose, referenceElement }) => {
  // Si le portail n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;
  
  // Calculer la position basée sur l'élément de référence
  const getPosition = () => {
    if (!referenceElement.current) {
      return { top: '50%', left: '50%' };
    }
    
    const rect = referenceElement.current.getBoundingClientRect();
    return {
      top: `${rect.bottom + window.scrollY + 10}px`,
      left: `${rect.left + window.scrollX}px`
    };
  };
  
  // Utiliser createPortal pour rendre le sélecteur de couleur au niveau du body
  return ReactDOM.createPortal(
    <ColorPickerContent
      initialColor={initialColor}
      onColorChange={onColorChange}
      onClose={onClose}
      position={getPosition()}
    />,
    document.body
  );
};

export default ColorPickerPortal;