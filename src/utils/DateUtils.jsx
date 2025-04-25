import { ERROR_MESSAGES } from '../constants/constants';

/**
 * Classe utilitaire pour la standardisation et la gestion des dates
 * 
 * Conventions importantes:
 * - Base de données/API : utilise des dates INCLUSIVES (la date de fin est le dernier jour inclus dans l'événement)
 * - FullCalendar : utilise des dates EXCLUSIVES (la date de fin n'est pas incluse dans l'événement)
 */

// Naviguer à aujourd'hui
export const navigateToToday = (calendarRef, selectedYear, setSelectedYear, navigateToMonth) => {
  if (calendarRef.current) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Si nous sommes dans une année différente, changer d'année d'abord
    if (currentYear !== selectedYear) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(today);

      if (typeof setSelectedYear === 'function') {
        setSelectedYear(currentYear);
      }
    } else {
      // Si nous sommes déjà dans la bonne année, juste naviguer au mois courant
      navigateToMonth(currentMonth);
    }

    // Faire défiler vers la position actuelle
    setTimeout(() => {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentMonth, date: today.getDate() });
    }, 100);
  }
}

/**
 * Formate une date pour les taskCards
 */
export const formatDateTaskCard = (dateString) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error(ERROR_MESSAGES.DATE_FORMAT, error);
    return null;
  }
};


/**
 * Formate une date en chaîne YYYY-MM-DD pour les champs input[type="date"]
 */
export const formatDateForInput = (date) => {
  if (!date) return '';

  const d = new Date(date);

  // Vérifier si la date est valide
  if (isNaN(d.getTime())) return '';

  // Utiliser les méthodes UTC pour éviter les décalages de fuseau horaire
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

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

// Vérifie si l'événement commence et se termine sur des jours ouvrés
export const hasValidEventBoundaries = (startDate, endDate, holidays) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end) return false;
  return !isHolidayOrWeekend(start, holidays) &&
    !isHolidayOrWeekend(end, holidays);
};

// Fonction pour calculer le numéro de semaine
export const getWeekNumber = (date) => {
  const targetDate = new Date(date);
  const firstDayOfYear = new Date(targetDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (targetDate - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Convertit une entrée en objet Date
const toDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  return null;
}

//Formate une date au format YYYY-MM-DD
const formatDateToString = (date) => {
  const dateObj = toDate(date);
  if (!dateObj) return null;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
