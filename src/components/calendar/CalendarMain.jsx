import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';
import { CalendarNavigation } from './CalendarNavigation';
import { getWeekNumber, navigateToToday } from '../../utils/DateUtils';
import { createMemberColorMap } from '../../utils/ColorUtils';
import { 
  formatTasksForCalendar, 
  handleResourceLabelMount, 
  handleResourceLaneMount, 
  isEventAllowed, 
  getSlotLabelClasses, 
  getSlotLaneClasses, 
  getDayHeaderClasses, 
  getDayCellClasses, 
  renderEventContent 
} from '../../utils/CalendarUtils';

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
        eventAllow={(dropInfo) => isEventAllowed(dropInfo, resources, holidays)}

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