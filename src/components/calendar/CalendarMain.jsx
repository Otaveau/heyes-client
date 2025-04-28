import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { CalendarNavigation } from './CalendarNavigation';
import { getWeekNumber, navigateToToday } from '../../utils/DateUtils';
import { createMemberColorMap } from '../../utils/ColorUtils';
import '../../assets/style/calendar-main.css';
import '../../assets/style/calendar-dark.css';
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
import { useTheme } from '../../context/ThemeContext';

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
  const { darkMode } = useTheme();

  // Générer la map des couleurs basée sur les teams des owners
  // En passant darkMode pour adapter les couleurs selon le thème
  const memberColorMap = useMemo(() => 
    createMemberColorMap(resources, darkMode), 
    [resources, darkMode]
  );

  // Formater les tâches pour le calendrier
  const formattedTasksForCalendar = useMemo(() => formatTasksForCalendar(tasks), [tasks]);

  // Faire défiler jusqu'au mois actuel lors du chargement
  useEffect(() => {
    if (calendarRef.current) {
      const currentDate = new Date();
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentDate.getMonth() });
    }
  }, [calendarRef]);

  // Appliquer ou retirer le mode sombre sur l'élément du calendrier
  useEffect(() => {
    const calendarElement = document.querySelector('.fc');
    if (calendarElement) {
      if (darkMode) {
        calendarElement.classList.add('fc-theme-dark');
      } else {
        calendarElement.classList.remove('fc-theme-dark');
      }
    }
  }, [darkMode]);

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

  // Adapter les gestionnaires d'événements pour prendre en compte le mode sombre
  const adaptedTaskHandlers = useMemo(() => {
    return {
      ...taskHandlers,
      // Exemple d'adaptation d'un gestionnaire pour le mode sombre
      handleEventDragStart: (info) => {
        taskHandlers.handleEventDragStart(info);
        // Logique supplémentaire pour le mode sombre si nécessaire
      },
      // Vous pouvez adapter d'autres gestionnaires selon vos besoins
    };
  }, [taskHandlers]);

  // Adapter le rendu des événements pour le mode sombre
  const adaptedRenderEventContent = (arg) => {
    return renderEventContent(arg, memberColorMap, darkMode);
  };

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

        // Styles pour les ressources - passer le mode sombre
        resourceLabelDidMount={(info) => handleResourceLabelMount(info, darkMode)}
        resourceLaneDidMount={(info) => handleResourceLaneMount(info, darkMode)}

        // Autorisation pour le drag & drop
        eventAllow={(dropInfo) => isEventAllowed(dropInfo, resources, holidays)}

        // Classes CSS pour les jours fériés et week-ends - passer le mode sombre
        slotLabelClassNames={arg => getSlotLabelClasses(arg, holidays, darkMode)}
        slotLaneClassNames={arg => getSlotLaneClasses(arg, holidays, darkMode)}
        dayHeaderClassNames={arg => getDayHeaderClasses(arg, holidays, darkMode)}
        dayCellClassNames={arg => getDayCellClasses(arg, holidays, darkMode)}

        // Contenu des événements - adaptés pour le mode sombre
        eventContent={adaptedRenderEventContent}

        // Gestionnaires d'événements - adaptés pour le mode sombre
        eventDragStart={adaptedTaskHandlers.handleEventDragStart}
        eventDrop={adaptedTaskHandlers.handleEventDrop}
        drop={adaptedTaskHandlers.handleExternalDrop}
        select={adaptedTaskHandlers.handleDateClick}
        eventClick={adaptedTaskHandlers.handleCalendarEventClick}
        eventResize={adaptedTaskHandlers.handleEventResize}
        eventDragStop={adaptedTaskHandlers.handleEventDragStop}
        eventReceive={adaptedTaskHandlers.handleEventReceive}
      />
    </div>
  );
};