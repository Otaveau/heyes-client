import { DEFAULT_COLOR } from '../constants/constants';

// Fonction pour générer une variation de couleur à partir d'une couleur de base
export const generateTaskColorFromBaseColor = (baseColor, resourceId) => {
  try {
    // S'assurer que la couleur de base est au format correct (hex)
    if (!baseColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(baseColor)) {
      return '#9CA3AF'; // Couleur grise par défaut si la couleur de base est invalide
    }

    // Convertir la couleur hex en HSL (Hue, Saturation, Lightness)
    // HSL est plus intuitif pour les variations perceptuelles
    const rgb = hexToRgb(baseColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    // Générer une seed déterministe basée sur resourceId
    let seed = 0;
    if (resourceId) {
      const idStr = typeof resourceId === 'string' ? resourceId : resourceId.toString();
      for (let i = 0; i < idStr.length; i++) {
        seed += idStr.charCodeAt(i);
      }
    }
    
    // Utiliser la seed pour créer des variations plus distinctes en HSL
    
    // 1. Variation de teinte (hue): légère modification dans la même famille de couleurs
    // Un changement de ±10 degrés préserve la famille de couleur tout en étant distinct
    const hueVariation = ((seed % 20) - 10) / 360; // Convertir en fraction de 360 degrés
    let newHue = hsl.h + hueVariation;
    // Garder la teinte dans la plage [0, 1]
    if (newHue > 1) newHue -= 1;
    if (newHue < 0) newHue += 1;
    
    // 2. Variation de saturation: rendre certaines couleurs plus vives, d'autres plus douces
    // Différentes personnes d'une team auront différents niveaux de saturation
    const satRange = 0.30; // 30% de variation maximum
    const satVariation = ((seed % 100) / 100) * satRange - (satRange / 2);
    let newSat = Math.max(0.2, Math.min(1, hsl.s + satVariation));
    
    // 3. Variation de luminosité: créer des couleurs plus claires ou plus foncées
    // Créer un écart plus grand pour une meilleure distinction
    const lightRange = 0.4; // 40% de variation maximum
    // Utiliser une fonction non-linéaire pour créer plus de diversité
    const lightSeed = ((seed * 17) % 100) / 100; // Multiplier par un nombre premier pour plus de variance
    const lightVariation = (lightSeed * lightRange) - (lightRange / 2);
    let newLight = Math.max(0.15, Math.min(0.85, hsl.l + lightVariation));
    
    // Convertir HSL en RGB puis en HEX
    const newRgb = hslToRgb(newHue, newSat, newLight);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    
    return newHex;
  } catch (error) {
    console.error('Error generating task color:', error);
    return '#9CA3AF'; // Couleur par défaut en cas d'erreur
  }
};

// Fonction pour créer la map des couleurs des membres
export const createMemberColorMap = (resources) => {
  const colorMap = {};
  const teamColorMap = {};

  // 1. Identifier les teams et leurs couleurs
  resources.forEach(resource => {
    let teamId = resource.id;
    let numericId = teamId;

    if (typeof teamId === 'string' && teamId.startsWith('team_')) {
      numericId = teamId.replace('team_', '');
    }

    const teamColor = resource.extendedProps?.teamColor;

    if (teamColor) {
      teamColorMap[teamId] = teamColor;
      teamColorMap[numericId] = teamColor;
      teamColorMap[String(numericId)] = teamColor;

      if (resource.extendedProps?.teamId) {
        teamColorMap[resource.extendedProps.teamId] = teamColor;
        teamColorMap[String(resource.extendedProps.teamId)] = teamColor;
      }
    }
  });

  // 2. Attribuer des couleurs aux owners en fonction de leur team
  resources.forEach(resource => {
    let teamId = resource.extendedProps?.teamId || resource.extendedProps?.team_id;

    // Si pas trouvé et qu'il y a un parentId, l'utiliser
    if (!teamId && resource.parentId) {
      teamId = resource.parentId;

      if (typeof teamId === 'string' && teamId.startsWith('team_')) {
        const numericId = teamId.replace('team_', '');
        if (teamColorMap[numericId]) {
          teamId = numericId;
        }
      }
    }

    if (!teamId) {
      colorMap[resource.id] = DEFAULT_COLOR;
      return;
    }

    // Chercher la couleur de team
    const teamColor = teamColorMap[teamId] || teamColorMap[String(teamId)];

    if (teamColor) {
      colorMap[resource.id] = generateTaskColorFromBaseColor(teamColor, resource.id);
    } else {
      colorMap[resource.id] = DEFAULT_COLOR;
    }
  });

  return colorMap;
}

// Convertir HEX en RGB
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Convertir RGB en HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatique
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }

    h /= 6;
  }

  return { h, s, l };
}

// Convertir HSL en RGB
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatique
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Convertir RGB en HEX
function rgbToHex(r, g, b) {
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Fonction pour déterminer si le texte doit être blanc ou noir sur une couleur de fond
 */
export const getContrastTextColor = (backgroundColor) => {
  if (!backgroundColor || backgroundColor.length < 7) {
    return '#000000'; // Noir par défaut si la couleur est invalide
  }
  
  try {
    // Convertir le hex en RGB
    const rgb = hexToRgb(backgroundColor);
    
    // Calculer la luminosité perçue (formule W3C pour l'accessibilité)
    // Cette formule donne une meilleure approximation de la perception humaine
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    
    // Seuil de contraste pour l'accessibilité WCAG
    return luminance > 0.55 ? '#000000' : '#FFFFFF';
  } catch (error) {
    console.error('Error calculating contrast color:', error);
    return '#000000'; // Noir par défaut en cas d'erreur
  }
}

// Fonction d'aide pour ajuster les couleurs (assombrir ou éclaircir)
export const adjustColor = (color, percent) => {
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;  
  G = (G < 255) ? G : 255;  
  B = (B < 255) ? B : 255;  

  R = Math.max(0, R);
  G = Math.max(0, G);
  B = Math.max(0, B);

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#"+RR+GG+BB;
}