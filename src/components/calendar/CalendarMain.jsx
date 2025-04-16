import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { isHolidayOrWeekend, isHoliday } from '../../utils/dateUtils';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';
import { getContrastTextColor, adjustColor } from '../../utils/colorUtils';
import { CalendarNavigation } from './CalendarNavigation';
import { getWeekNumber, navigateToToday } from '../../utils/dateUtils';
import { createMemberColorMap } from '../../utils/colorUtils';
import { DEFAULT_COLOR, TEAM_BACKGROUND_ALPHA, CONGE_EVENT_STYLE } from '../../constants/constants';


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

// Composant de rendu pour les événements de congés
const CongeEventRenderer = ({ event }) => {
  return `
    <div class="fc-event-main-custom conge-event" style="${CONGE_EVENT_STYLE}">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        pointer-events: none;
        display: flex;
        align-items: center;
      ">
        <div style="
          display: flex; 
          align-items: center;
          position: sticky;
          left: 6px;
          background-color: transparent;
          max-width: calc(100% - 12px);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px; flex-shrink: 0;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${event.title}</span>
        </div>
      </div>
      
      <div style="visibility: hidden;">
        <div style="display: flex; align-items: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          ${event.title}
        </div>
      </div>
    </div>
  `;
};

// Composant de rendu pour les tâches standards
const TaskEventRenderer = ({ event, backgroundColor, textColor }) => {
  const darkerColor = adjustColor(backgroundColor, -15);

  // Calculer la durée de l'événement en jours
  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : new Date(startDate);
  const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const taskSizeClass = durationInDays > 5 ? 'long-task' : 'short-task';

  // Créer un dégradé léger pour donner de la profondeur à la tâche
  const gradientBg = `linear-gradient(to bottom, ${adjustColor(backgroundColor, 5)}, ${backgroundColor})`;

  return `
    <div class="fc-event-main-custom ${taskSizeClass}" 
      style="background: ${gradientBg}; 
      color: ${textColor}; 
      padding: 3px 6px; 
      border-radius: 4px; 
      height: 100%;
      position: relative;
      overflow: visible;
      border-left: 3px solid ${darkerColor};
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      justify-content: center;">
      
      <div class="task-title-container" style="
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 2;
        pointer-events: none;
        display: flex;
        align-items: center;">
        <span class="task-title" style="
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 90%;
          pointer-events: none;
          position: sticky;
          left: 6px;
          padding: 2px 4px;
          background-color: ${adjustColor(backgroundColor, 0, 0.9)};
          backdrop-filter: blur(2px);
          border-radius: 3px;
          box-shadow: 0 0 4px rgba(0,0,0,0.1);">
          ${event.title}
        </span>
      </div>
      
      <span class="task-title-duplicate" 
        style="
        visibility: visible;
        opacity: 0.4;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-block;
        max-width: 95%;">
        ${event.title}
      </span>
    </div>
  `;
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
    <div className="calendar-container ml-4">
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
        resourceLabelDidMount={info => handleResourceLabelMount(info)}
        resourceLaneDidMount={info => handleResourceLaneMount(info)}

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
    info.el.style.fontWeight = 'bold';
    info.el.style.backgroundColor = '#e5e7eb';
    info.el.style.borderBottom = '1px solid #d1d5db';
    info.el.style.color = '#1f2937';
    info.el.style.fontSize = '0.95rem';

    // Si la ressource est une team et a une couleur, appliquer un indicateur visuel
    if (info.resource.extendedProps?.color) {
      info.el.style.borderLeft = `4px solid ${info.resource.extendedProps.color}`;
    }
  } else {
    info.el.style.paddingLeft = '20px';
    info.el.style.borderBottom = '1px solid #e5e7eb';
    info.el.style.color = '#4b5563';
  }
}

// Gestionnaire du rendu des lanes de ressources
function handleResourceLaneMount(info) {
  if (info.resource.extendedProps?.isTeam) {
    info.el.style.backgroundColor = '#f3f4f6';
    info.el.style.cursor = 'not-allowed';

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
