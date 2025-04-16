/**
 * Classe utilitaire pour la standardisation et la gestion des dates
 * 
 * Conventions importantes:
 * - Base de données/API : utilise des dates INCLUSIVES (la date de fin est le dernier jour inclus dans l'événement)
 * - FullCalendar : utilise des dates EXCLUSIVES (la date de fin n'est pas incluse dans l'événement)
 */


export const getInclusiveEndDate = (task) => {
  // Si la propriété inclusiveEndDate est disponible dans extendedProps, l'utiliser
  if (task.extendedProps?.inclusiveEndDate) {
    return task.extendedProps.inclusiveEndDate;
  }
  // Si end_date est disponible, l'utiliser (supposée être déjà inclusive)
  if (task.end_date) {
    return task.end_date;
  }
  // Si end est disponible, la convertir de date exclusive à inclusive
  if (task.end) {
    const endDate = new Date(task.end);
    endDate.setDate(endDate.getDate() - 1);
    return endDate;
  }
  return null;
};


// Convertit une entrée en objet Date
export const toDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  return null;
}

//Formate une date au format YYYY-MM-DD
export const formatDateToString = (date) => {
  const dateObj = toDate(date);
  if (!dateObj) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

//Formate une date au format ISO avec heure UTC fixe (23:00)
export const formatDateToISOWithFixedTime = (date) => {
  const dateObj = toDate(date);
  if (!dateObj) return null;

  // Créer une nouvelle date en UTC à 23:00
  return new Date(Date.UTC(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
    23, 0, 0
  )).toISOString();
}

//Crée une date UTC à partir des composants de date, sans conversion de fuseau horaire
export const createUTCDate = (year, month, day) => {
  return new Date(Date.UTC(year, month, day));
}

//Extrait les composants de date (année, mois, jour) d'une date ISO
export const extractDateComponents = (isoString) => {
  if (!isoString) return null;
  const datePart = isoString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return { year, month: month - 1, day }; // month-1 pour correspondre à l'API JavaScript (0-11)
}

//Vérifie si une date tombe un week-end
export const isWeekend = (date) => {
  const dateObj = toDate(date);
  return dateObj ? [0, 6].includes(dateObj.getDay()) : false;
};

// Vérifie si une date est un jour férié
export const isHoliday = (date, holidays) => {
  if (!date || !holidays) return false;
  const dateString = formatDateToString(date);
  return dateString ? !!holidays[dateString] : false;
};

//Vérifie si une date est un jour férié ou un week-end
export const isHolidayOrWeekend = (date, holidays = {}) => {
  return isWeekend(date) || isHoliday(date, holidays);
};

//Convertit une date de fin INCLUSIVE (API) en EXCLUSIVE (FullCalendar)
export const toExclusiveEndDate = (date) => {
  const endDate = toDate(date);
  if (!endDate) return null;
  
  // Pour FullCalendar, ajouter un jour à la date de fin inclusive
  const exclusiveDate = new Date(endDate);
  exclusiveDate.setDate(exclusiveDate.getDate() + 1);
  return exclusiveDate;
};

//Convertit une date de fin EXCLUSIVE (FullCalendar) en INCLUSIVE (API)
export const toInclusiveEndDate = (date) => {
  const endDate = toDate(date);
  if (!endDate) return null;
  
  // Pour l'API, soustraire un jour à la date de fin exclusive
  const inclusiveDate = new Date(endDate);
  inclusiveDate.setDate(inclusiveDate.getDate() - 1);
  return inclusiveDate;
};

// Vérifie si l'événement commence et se termine sur des jours ouvrés
export const hasValidEventBoundaries = (startDate, endDate, holidays) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return false;
  return !isHolidayOrWeekend(start, holidays) &&
    !isHolidayOrWeekend(end, holidays);
};

// Convertit une date ISO en objet Date UTC pour FullCalendar
export const isoToUTCDate = (isoString) => {
  if (!isoString) return null;

  const components = extractDateComponents(isoString);
  if (!components) return null;

  return createUTCDate(components.year, components.month, components.day);
}

//Convertit une date au format ISO sans heure
export const toISODateString = (date) => {
  return formatDateToString(date);
}

//Formate une date pour l'affichage utilisateur
export const formatForDisplay = (date) => {
  if (!date) return 'Non définie';

  try {
    const dateObj = toDate(date);
    if (!dateObj || isNaN(dateObj.getTime())) return 'Date invalide';

    return dateObj.toLocaleDateString();
  } catch (e) {
    console.error('Erreur de formatage de date:', e);
    return 'Date invalide';
  }
}

//Convertit une chaîne ISO en objet Date
export const fromISOString = (isoString) => {
  return isoToUTCDate(isoString);
}

// Fonction pour calculer le numéro de semaine
export const getWeekNumber = (date) => {
  const targetDate = new Date(date);
  const firstDayOfYear = new Date(targetDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (targetDate - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};