import { useCallback, useMemo } from 'react';
import { DAYS_IN_WEEK, VIEW_TYPES, ANIMATION_DELAY } from '../constants/constants';

export const useCalendarNavigation = (calendarRef, selectedYear, setSelectedYear) => {
  // Mois en français pour les boutons
  const months = useMemo(() => [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ], []);

  /**
   * Obtient l'API du calendrier si disponible
   */
  const getCalendarApi = useCallback(() => {
    if (!calendarRef.current) return null;
    return calendarRef.current.getApi();
  }, [calendarRef]);

  /**
   * Calcule la date du lundi pour la vue semaine
   */
  const getMondayForWeekView = useCallback((firstDayOfMonth, monthIndex, year) => {
    // Trouver le jour de la semaine (0=dimanche, 1=lundi, etc.)
    const dayOfWeek = firstDayOfMonth.getDay();
    let mondayDate;
    
    if (dayOfWeek === 1) {
      // Si c'est un lundi, utiliser cette date
      mondayDate = new Date(firstDayOfMonth);
    } else if (dayOfWeek === 0) {
      // Si c'est un dimanche, le lundi est le lendemain
      mondayDate = new Date(firstDayOfMonth);
      mondayDate.setUTCDate(mondayDate.getUTCDate() + 1);
    } else {
      // Pour les autres jours, reculer au lundi précédent
      const daysToSubtract = dayOfWeek - 1;
      mondayDate = new Date(firstDayOfMonth);
      mondayDate.setUTCDate(mondayDate.getUTCDate() - daysToSubtract);
    }
    
    // Si ce lundi est dans le mois précédent, chercher le premier lundi du mois
    if (mondayDate.getUTCMonth() !== monthIndex) {
      mondayDate = new Date(Date.UTC(year, monthIndex, 1));
      while (mondayDate.getUTCDay() !== 1) {
        mondayDate.setUTCDate(mondayDate.getUTCDate() + 1);
      }
    }
    
    return mondayDate;
  }, []);

  /**
   * Gère la navigation dans la vue année
   */
  const handleYearViewNavigation = useCallback((calendarApi, targetDate, monthIndex) => {
    // Pour les vues timeline, cette méthode est plus efficace que gotoDate
    calendarApi.scrollToTime({ 
      days: targetDate.getUTCDate() - 1, 
      months: targetDate.getUTCMonth(), 
      years: targetDate.getUTCFullYear() - calendarApi.getDate().getFullYear() 
    });
    
    // Amélioration pour le défilement visuel
    const scrollToTimelineMonth = () => {
      const timelineBody = document.querySelector('.fc-timeline-body');
      if (!timelineBody) return;
      
      const headers = document.querySelectorAll('.fc-timeline-slot[data-date]');
      
      let targetHeader = null;
      for (const header of headers) {
        const headerDate = new Date(header.getAttribute('data-date'));
        if (headerDate.getMonth() === monthIndex) {
          targetHeader = header;
          break;
        }
      }
      
      if (targetHeader) {
        const rect = targetHeader.getBoundingClientRect();
        const containerRect = timelineBody.getBoundingClientRect();
        
        const scrollLeft = rect.left + timelineBody.scrollLeft - containerRect.left - 
                         (containerRect.width / 2) + (rect.width / 2);
        
        timelineBody.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    };
    
    // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
    requestAnimationFrame(() => {
      setTimeout(scrollToTimelineMonth, ANIMATION_DELAY);
    });
  }, []);

  /**
   * Navigue vers un mois spécifique avec dates UTC
   */
  const navigateToMonth = useCallback((monthIndex) => {
    const calendarApi = getCalendarApi();
    if (!calendarApi) return;

    // Obtenir l'année courante et la vue courante
    const year = selectedYear;
    const currentView = calendarApi.view.type;

    try {
      // Créer une date UTC pour le premier jour du mois
      const firstDayOfMonth = new Date(Date.UTC(year, monthIndex, 1));
      
      // Navigation selon le type de vue
      if (currentView === VIEW_TYPES.WEEK) {
        // Pour la vue semaine
        const mondayDate = getMondayForWeekView(firstDayOfMonth, monthIndex, year);
        const adjustedDateStr = mondayDate.toISOString().split('T')[0];
        calendarApi.gotoDate(adjustedDateStr);
      }
      else if (currentView === VIEW_TYPES.MONTH) {
        // Pour la vue mois
        const dateStr = firstDayOfMonth.toISOString().split('T')[0];
        calendarApi.gotoDate(dateStr);
      } 
      else if (currentView === VIEW_TYPES.YEAR) {
        // Pour la vue année
        handleYearViewNavigation(calendarApi, firstDayOfMonth, monthIndex);
      }
    } catch (error) {
      console.error("Erreur de navigation:", error);
      
      // Méthode de secours
      try {
        // Utiliser le format de chaîne de date pour éviter les décalages
        const fallbackDate = new Date(Date.UTC(year, monthIndex, 1));
        const dateStr = fallbackDate.toISOString().split('T')[0];
        
        calendarApi.gotoDate(dateStr);
      } catch (fallbackError) {
        console.error("Erreur de secours:", fallbackError);
      }
    }
  }, [getCalendarApi, getMondayForWeekView, handleYearViewNavigation, selectedYear]);

  /**
   * Navigue dans le calendrier en modifiant l'année
   */
  const navigateByYear = useCallback((yearOffset) => {
    setSelectedYear(prev => prev + yearOffset);

    const calendarApi = getCalendarApi();
    if (!calendarApi) return null;
    
    const currentDate = calendarApi.getDate();
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + yearOffset);
    calendarApi.gotoDate(newDate);
    
    return newDate;
  }, [getCalendarApi, setSelectedYear]);

  /**
   * Navigue vers l'année précédente
   */
  const goToPreviousYear = useCallback(() => {
    return navigateByYear(-1);
  }, [navigateByYear]);

  /**
   * Navigue vers l'année suivante
   */
  const goToNextYear = useCallback(() => {
    return navigateByYear(1);
  }, [navigateByYear]);

  /**
   * Navigue dans le calendrier en modifiant la semaine
   */
  const navigateByWeek = useCallback((weekOffset) => {
    const calendarApi = getCalendarApi();
    if (!calendarApi) return null;

    // Obtenir la date actuelle du calendrier
    const currentDate = calendarApi.getDate();

    // Créer une nouvelle date
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (weekOffset * DAYS_IN_WEEK));

    // Naviguer à la nouvelle date
    calendarApi.gotoDate(newDate);

    // Mettre à jour l'année sélectionnée si elle change
    if (newDate.getFullYear() !== selectedYear) {
      setSelectedYear(newDate.getFullYear());
    }

    // Retourner la nouvelle date pour permettre la mise à jour du numéro de semaine
    return newDate;
  }, [getCalendarApi, selectedYear, setSelectedYear]);

  /**
   * Navigue vers la semaine précédente
   */
  const goToPreviousWeek = useCallback(() => {
    return navigateByWeek(-1);
  }, [navigateByWeek]);

  /**
   * Navigue vers la semaine suivante
   */
  const goToNextWeek = useCallback(() => {
    return navigateByWeek(1);
  }, [navigateByWeek]);

  /**
   * Obtient le numéro de semaine à partir d'une date
   */
  const getWeekNumber = useCallback((date) => {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
      target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  }, []);

  return {
    navigateToMonth,
    goToPreviousYear,
    goToNextYear,
    goToPreviousWeek,
    goToNextWeek,
    getWeekNumber,
    getCalendarApi,
    months,
    VIEW_TYPES
  };
};