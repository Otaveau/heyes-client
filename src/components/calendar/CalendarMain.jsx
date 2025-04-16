import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { isHolidayOrWeekend, isHoliday } from '../../utils/dateUtils';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';
import { getContrastTextColor } from '../../utils/colorUtils';
import { CalendarNavigation } from './CalendarNavigation';
import { getWeekNumber, navigateToToday } from '../../utils/dateUtils';
import { createMemberColorMap } from '../../utils/colorUtils';
import { DEFAULT_COLOR, TEAM_BACKGROUND_ALPHA } from '../../constants/constants';
import { CongeEventRenderer } from '../renderer/CongeEventRenderer';
import { TaskEventRenderer } from '../renderer/TaskEventRenderer';

// Configuration de FullCalendar
const CALENDAR_CONFIG = {
  locale: frLocale,
  timeZone: 'UTC',
  nextDayThreshold: "00:00:00",
  slotLabelFormat: [
    { month: 'long' },
    { weekday: 'short', day: 'numeric' }
  ],
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  },
  plugins: [resourceTimelinePlugin, interactionPlugin],
  height: 'auto',
  schedulerLicenseKey: 'GPL-My-Project-Is-Open-Source',
  initialView: 'resourceTimelineYear',
  headerToolbar: false,
  editable: true,
  selectable: true,
  selectMirror: true,
  droppable: true,
  resourceAreaWidth: "15%",
  slotDuration: { days: 1 },
  selectConstraint: {
    start: '00:00',
    end: '24:00'
  },
  weekends: true,
  resourceOrder: "title",
  resourcesInitiallyExpanded: true,
  resourceAreaHeaderContent: ""
};


export const CalendarMain = ({
  calendarRef,
  tasks,
  resources,
  holidays,
  taskHandlers,
  handleViewChange: externalHandleViewChange,
  months,
  selectedYear,
  setSelectedYear,
  goToPreviousYear,
  goToNextYear,
  goToPreviousWeek,
  goToNextWeek,
  navigateToMonth,
}) => {
  const [currentView, setCurrentView] = useState('resourceTimelineYear');
  const [currentWeekNumber, setCurrentWeekNumber] = useState(1);

  // Générer la map des couleurs basée sur les teams des owners
  const memberColorMap = useMemo(() => createMemberColorMap(resources), [resources]);

  // Formater les tâches pour le calendrier
  const formattedTasksForCalendar = useMemo(() => formatTasksForCalendar(tasks), [tasks]);

  // Initialiser les styles du calendrier
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = getEnhancedCalendarStyles();
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Faire défiler jusqu'au mois actuel lors du chargement
  useEffect(() => {
    if (calendarRef.current) {
      const currentDate = new Date();
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentDate.getMonth() });
    }
  }, [calendarRef]);

  // Gestionnaire de changement de vue
  const internalHandleViewChange = (info) => {
    const newView = info.view.type;
    setCurrentView(newView);

    // Mettre à jour le numéro de semaine si on est en vue semaine
    if (newView === 'resourceTimelineWeek') {
      setCurrentWeekNumber(getWeekNumber(info.view.currentStart));
    }

    // Appeler le gestionnaire externe si fourni
    if (externalHandleViewChange) {
      externalHandleViewChange(info);
    }
  };

  // Gestionnaire pour le bouton "Aujourd'hui"
  const handleTodayClick = () => navigateToToday(calendarRef, selectedYear, setSelectedYear, navigateToMonth);

  return (
    <div className="calendar-container">
      <CalendarNavigation
        selectedYear={selectedYear}
        currentView={currentView}
        currentWeekNumber={currentWeekNumber}
        months={months}
        calendarRef={calendarRef}
        goToPreviousYear={goToPreviousYear}
        goToNextYear={goToNextYear}
        goToPreviousWeek={goToPreviousWeek}
        goToNextWeek={goToNextWeek}
        navigateToMonth={navigateToMonth}
        handleTodayClick={handleTodayClick}
      />
      <FullCalendar
        ref={calendarRef}
        {...CALENDAR_CONFIG}
        initialDate={new Date()}
        events={formattedTasksForCalendar}
        resources={resources}
        viewDidMount={internalHandleViewChange}
        datesSet={(info) => {
          internalHandleViewChange(info);

          // Mettre à jour le numéro de semaine si on est en vue semaine
          if (info.view.type === 'resourceTimelineWeek') {
            setCurrentWeekNumber(getWeekNumber(info.view.currentStart));
          }
        }}

        // Styles pour les ressources
        resourceLabelDidMount={handleResourceLabelMount}
        resourceLaneDidMount={handleResourceLaneMount}

        // Autorisation pour le drag & drop
        eventAllow={(dropInfo, draggedEvent) => isEventAllowed(dropInfo, draggedEvent, resources, holidays)}

        // Classes CSS pour les jours fériés et week-ends
        slotLabelClassNames={arg => getSlotLabelClasses(arg, holidays)}
        slotLaneClassNames={arg => getSlotLaneClasses(arg, holidays)}
        dayHeaderClassNames={arg => getDayHeaderClasses(arg, holidays)}
        dayCellClassNames={arg => getDayCellClasses(arg, holidays)}

        // Contenu des événements
        eventContent={arg => renderEventContent(arg, memberColorMap)}

        // Gestionnaires d'événements
        eventDragStart={taskHandlers.handleEventDragStart}
        eventDrop={taskHandlers.handleEventDrop}
        drop={taskHandlers.handleExternalDrop}
        select={taskHandlers.handleDateClick}
        eventClick={taskHandlers.handleCalendarEventClick}
        eventResize={taskHandlers.handleEventResize}
        eventDragStop={taskHandlers.handleEventDragStop}
        eventReceive={taskHandlers.handleEventReceive}
      />
    </div>
  );
};

// Fonction pour formater les tâches
function formatTasksForCalendar(tasks) {
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
function handleResourceLabelMount(info) {
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
function handleResourceLaneMount(info) {
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
function isEventAllowed(dropInfo, draggedEvent, resources, holidays) {
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
function getSlotLabelClasses(arg, holidays) {
  if (!arg?.date) return [];
  const classes = [];
  if (arg.level === 1 && isHolidayOrWeekend(arg.date, holidays)) {
    classes.push('weekend-slot');
  }
  return classes;
}

function getSlotLaneClasses(arg, holidays) {
  if (!arg?.date) return '';
  return isHolidayOrWeekend(arg.date, holidays) ? 'weekend-column' : '';
}

function getDayHeaderClasses(arg, holidays) {
  if (!arg?.date) return '';
  return isHolidayOrWeekend(arg.date, holidays) ? 'weekend-header' : '';
}

function getDayCellClasses(arg, holidays) {
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
function renderEventContent(arg, memberColorMap) {
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