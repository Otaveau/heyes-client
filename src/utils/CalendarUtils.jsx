

import { isHolidayOrWeekend, isHoliday } from '../utils/DateUtils';
import { getContrastTextColor } from '../utils/ColorUtils';
import { CongeEventRenderer } from '../components/renderer/CongeEventRenderer';
import { TaskEventRenderer } from '../components/renderer/TaskEventRenderer';
import { DEFAULT_COLOR, TEAM_BACKGROUND_ALPHA } from '../constants/constants';

// Fonction pour formater les tâches
export const formatTasksForCalendar = (tasks) => {
    return tasks.map(task => {
      if (task.extendedProps?.exclusiveEndDate) {
        return {
          ...task,
          end: task.extendedProps.exclusiveEndDate
        };
      }
      return task;
    });
  }
  
  // Gestionnaire du rendu des étiquettes de ressources
  export const handleResourceLabelMount = (info) => {
    if (info.resource.extendedProps?.isTeam) {
      info.el.classList.add('resource-team-header');
  
      // Si la ressource est une team et a une couleur, appliquer un indicateur visuel
      if (info.resource.extendedProps?.color) {
        info.el.classList.add('resource-team-indicator');
        info.el.style.borderLeftColor = info.resource.extendedProps.color;
      }
    } else {
      info.el.classList.add('resource-owner-cell');
    }
  }
  
  // Gestionnaire du rendu des lanes de ressources
  export const handleResourceLaneMount = (info) =>  {
    if (info.resource.extendedProps?.isTeam) {
      info.el.classList.add('resource-team-lane');
  
      // Si la ressource est une team et a une couleur, appliquer un indicateur visuel subtil
      if (info.resource.extendedProps?.color) {
        const teamColor = info.resource.extendedProps.color;
        // Créer une couleur plus légère pour le fond
        const lightTeamColor = `${teamColor}${TEAM_BACKGROUND_ALPHA}`;
        info.el.style.backgroundColor = lightTeamColor;
      }
    }
  }
  
  // Vérifier si un événement est autorisé à être placé à un certain endroit
  export const isEventAllowed = (dropInfo, resources, holidays) => {
    const resourceId = dropInfo.resource ? dropInfo.resource.id : null;
    const resource = resourceId ? resources.find(r => r.id === resourceId) : null;
  
    if (resource && resource.extendedProps?.isTeam) {
      return false;
    }
  
    const startDate = new Date(dropInfo.start);
    const endDate = new Date(dropInfo.end);
    endDate.setDate(endDate.getDate() - 1);
  
    if (isHolidayOrWeekend(startDate, holidays) ||
      isHolidayOrWeekend(endDate, holidays)) {
      return false;
    }
  
    return true;
  }
  
  // Fonctions pour déterminer les classes CSS des différents éléments du calendrier
  export const getSlotLabelClasses = (arg, holidays) => {
    if (!arg?.date) return [];
    const classes = [];
    if (arg.level === 1 && isHolidayOrWeekend(arg.date, holidays)) {
      classes.push('weekend-slot');
    }
    return classes;
  }
  
  export const getSlotLaneClasses = (arg, holidays) => {
    if (!arg?.date) return '';
    return isHolidayOrWeekend(arg.date, holidays) ? 'weekend-column' : '';
  }
  
  export const getDayHeaderClasses = (arg, holidays) => {
    if (!arg?.date) return '';
    return isHolidayOrWeekend(arg.date, holidays) ? 'weekend-header' : '';
  }
  
  export const getDayCellClasses = (arg, holidays) => {
    if (!arg?.date) return [];
    const classes = [];
  
    if (isHolidayOrWeekend(arg.date, holidays)) {
      classes.push('weekend-cell');
    }
  
    if (isHoliday(arg.date, holidays)) {
      classes.push('holiday-cell');
    }
  
    return classes;
  }
  
  // Rendu du contenu des événements
  export const renderEventContent = (arg, memberColorMap) => {
    const { event, view } = arg;
  
    // Vérifier si c'est un congé
    const isConge = event.title?.toLowerCase().includes('conge');
  
    // Si c'est une vue timeline et un congé
    if (isConge && view.type.includes('resourceTimeline')) {
      return { html: CongeEventRenderer({ event }) };
    }
  
    // Si c'est une autre vue ou pas un congé
    if (view.type.includes('resourceTimeline')) {
      // Obtenir la ressource (owner) associée à cet événement
      const resourceId = event.getResources()[0]?.id;
  
      // Définir une couleur
      const backgroundColor = resourceId && memberColorMap[resourceId]
        ? memberColorMap[resourceId]
        : DEFAULT_COLOR;
  
      // Déterminer la couleur du texte pour un bon contraste
      const textColor = getContrastTextColor(backgroundColor);
  
      return { html: TaskEventRenderer({ event, backgroundColor, textColor }) };
    }
  
    return null;
  }