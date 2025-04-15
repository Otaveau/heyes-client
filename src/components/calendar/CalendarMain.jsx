import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { DateUtils } from '../../utils/dateUtils';
import { getEnhancedCalendarStyles } from '../../style/calendarStyles';
import { generateTaskColorFromBaseColor, getContrastTextColor, adjustColor } from '../../utils/colorUtils';
import { CalendarNavigation } from './CalendarNavigation';

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
  const memberColorMap = useMemo(() => {
    const colorMap = {};

    // 1. Identifier les teams et leurs couleurs
    const teamColorMap = {};

    resources.forEach(resource => {
      // Extraire l'ID de team (avec ou sans le préfixe "team_")
      let teamId = resource.id;
      let numericId = teamId;

      // Si l'ID commence par "team_", extraire la partie numérique
      if (typeof teamId === 'string' && teamId.startsWith('team_')) {
        numericId = teamId.replace('team_', '');
      }

      // Rechercher la couleur de team (peut être dans plusieurs emplacements)
      const teamColor = resource.extendedProps?.teamColor;

      if (teamColor) {

        // Stocker la couleur sous différents formats possibles
        teamColorMap[teamId] = teamColor;
        teamColorMap[numericId] = teamColor;
        teamColorMap[String(numericId)] = teamColor;

        // Si team a un champ teamId dans extendedProps, l'utiliser aussi
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

        // Si parentId commence par "team_", extraire la partie numérique
        if (typeof teamId === 'string' && teamId.startsWith('team_')) {
          const numericId = teamId.replace('team_', '');
          if (teamColorMap[numericId]) {
            teamId = numericId;
          }
        }
      }

      if (!teamId) {
        colorMap[resource.id] = '#9CA3AF'; // Couleur par défaut
        return;
      }

      // Chercher la couleur de team
      const teamColor = teamColorMap[teamId] || teamColorMap[String(teamId)];

      if (teamColor) {
        colorMap[resource.id] = generateTaskColorFromBaseColor(teamColor, resource.id);
      } else {
        colorMap[resource.id] = '#9CA3AF'; // Couleur par défaut
      }
    });

    return colorMap;
  }, [resources]);


  // Calcule le numéro de semaine
  const getWeekNumber = (date) => {
    // Créer une copie de la date pour ne pas modifier l'original
    const targetDate = new Date(date);

    // Définir le 4 janvier comme référence pour la première semaine
    // (norme ISO 8601 - la semaine qui contient le premier jeudi de l'année)
    const firstDayOfYear = new Date(targetDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (targetDate - firstDayOfYear) / 86400000;

    // Calculer le numéro de la semaine
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };


  const formattedTasksForCalendar = useMemo(() => {
    return tasks.map(task => {
      // Si la tâche a déjà une exclusiveEndDate, on l'utilise
      if (task.extendedProps?.exclusiveEndDate) {
        return {
          ...task,
          end: task.extendedProps.exclusiveEndDate
        };
      }
      return task;
    });
  }, [tasks]);

  useEffect(() => {
    if (calendarRef.current) {
      const currentDate = new Date();
      const calendarApi = calendarRef.current.getApi();
      calendarApi.scrollToTime({ month: currentDate.getMonth() });
    }
  }, [calendarRef]);


  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = getEnhancedCalendarStyles();
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Gestionnaire de changement de vue
  const internalHandleViewChange = (info) => {
    const newView = info.view.type;
    setCurrentView(newView);

    // Mettre à jour le numéro de semaine si on est en vue semaine
    if (newView === 'resourceTimelineWeek') {
      const currentDate = info.view.currentStart;
      setCurrentWeekNumber(getWeekNumber(currentDate));
    }

    // Appeler le gestionnaire externe si fourni
    if (externalHandleViewChange) {
      externalHandleViewChange(info);
    }
  };

  // Fonction pour gérer le bouton "Aujourd'hui"
  const handleTodayClick = async () => {
    if (calendarRef.current) {
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      // Si nous sommes dans une année différente, changer d'année d'abord
      if (currentYear !== selectedYear) {
        // Utiliser directement l'API FullCalendar pour naviguer à la date du jour
        const calendarApi = calendarRef.current.getApi();
        calendarApi.gotoDate(today);

        // Mettre à jour l'état local pour refléter le changement
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
  };

  // Gestionnaire personnalisé pour eventDrop pour gérer la conversion des dates exclusives
  const handleEventDrop = (info) => {
    const { event } = info;

    // Récupérer les dates start et end (end est exclusive dans FullCalendar)
    const end = event.end;

    // Créer une copie inclusive de la date de fin (soustraire un jour)
    const inclusiveEndDate = end ? new Date(end) : null;
    if (inclusiveEndDate) {
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);
    }

    // Enrichir les données de l'événement avec les dates inclusives/exclusives
    const extendedEvent = {
      ...event.toPlainObject(),
      extendedProps: {
        ...event.extendedProps,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive
      }
    };

    // Appeler le gestionnaire d'événement original avec les données enrichies
    if (taskHandlers.handleEventDrop) {
      taskHandlers.handleEventDrop({
        ...info,
        enrichedEvent: extendedEvent
      });
    }
  };

  // Gestionnaire personnalisé pour eventResize
  const handleEventResize = (info) => {
    const { event } = info;

    // Récupérer les dates start et end (end est exclusive dans FullCalendar)
    const end = event.end;

    // Créer une copie inclusive de la date de fin (soustraire un jour)
    const inclusiveEndDate = end ? new Date(end) : null;
    if (inclusiveEndDate) {
      inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);
    }

    // Enrichir les données de l'événement avec les dates inclusives/exclusives
    const extendedEvent = {
      ...event.toPlainObject(),
      extendedProps: {
        ...event.extendedProps,
        inclusiveEndDate: inclusiveEndDate // Stocker la date inclusive
      }
    };

    // Appeler le gestionnaire d'événement original avec les données enrichies
    if (taskHandlers.handleEventResize) {
      taskHandlers.handleEventResize({
        ...info,
        enrichedEvent: extendedEvent
      });
    }
  };


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
        locale={frLocale}
        timeZone='UTC'
        events={formattedTasksForCalendar}
        resources={resources}
        nextDayThreshold="00:00:00"
        slotLabelFormat={[
          { month: 'long' },
          { weekday: 'short', day: 'numeric' }
        ]}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'UTC'
        }}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        height='auto'
        schedulerLicenseKey='GPL-My-Project-Is-Open-Source'
        initialView='resourceTimelineYear'
        initialDate={new Date()}
        headerToolbar={false}
        editable={true}
        selectable={true}
        selectMirror={true}
        droppable={true}
        resourceAreaWidth="15%"
        slotDuration={{ days: 1 }}
        selectConstraint={{
          start: '00:00',
          end: '24:00'
        }}
        weekends={true}
        resourceOrder="title"
        resourcesInitiallyExpanded={true}
        resourceAreaHeaderContent=""
        viewDidMount={internalHandleViewChange}
        datesSet={(info) => {
          // Appeler le gestionnaire existant
          internalHandleViewChange(info);

          // Mettre à jour le numéro de semaine si on est en vue semaine
          if (info.view.type === 'resourceTimelineWeek') {
            setCurrentWeekNumber(getWeekNumber(info.view.currentStart));
          }
        }}
        resourceLabelDidMount={(info) => {
          if (info.resource.extendedProps?.isTeam) {
            info.el.style.fontWeight = 'bold';
            info.el.style.backgroundColor = '#e5e7eb';
            info.el.style.borderBottom = '1px solid #d1d5db';
            info.el.style.color = '#1f2937';
            info.el.style.fontSize = '0.95rem';

            // Si la ressource est une team et a une couleur, appliquer un indicateur visuel
            if (info.resource.extendedProps?.color) {
              const teamColor = info.resource.extendedProps.color;
              info.el.style.borderLeft = `4px solid ${teamColor}`;
            }
          } else {
            info.el.style.paddingLeft = '20px';
            info.el.style.borderBottom = '1px solid #e5e7eb';
            info.el.style.color = '#4b5563';
          }
        }}
        resourceLaneDidMount={(info) => {
          if (info.resource.extendedProps?.isTeam) {
            info.el.style.backgroundColor = '#f3f4f6';
            info.el.style.cursor = 'not-allowed';

            // Si la ressource est une team et a une couleur, appliquer un indicateur visuel subtil
            if (info.resource.extendedProps?.color) {
              const teamColor = info.resource.extendedProps.color;
              // Créer une couleur plus légère pour le fond
              const lightTeamColor = `${teamColor}10`; // 10% d'opacité
              info.el.style.backgroundColor = lightTeamColor;
            }
          }
        }}
        eventAllow={(dropInfo, draggedEvent) => {
          const resourceId = dropInfo.resource ? dropInfo.resource.id : null;
          const resource = resourceId ?
            resources.find(r => r.id === resourceId) : null;

          if (resource && resource.extendedProps?.isTeam) {
            return false;
          }

          const startDate = new Date(dropInfo.start);
          const endDate = new Date(dropInfo.end);
          endDate.setDate(endDate.getDate() - 1);

          if (DateUtils.isHolidayOrWeekend(startDate, holidays) ||
            DateUtils.isHolidayOrWeekend(endDate, holidays)) {
            return false;
          }

          return true;
        }}
        // Gestionnaires de classes pour les jours fériés et week-ends
        slotLabelClassNames={(arg) => {
          if (!arg?.date) return [];
          const classes = [];
          if (arg.level === 1 && DateUtils.isHolidayOrWeekend(arg.date, holidays)) {
            // Utiliser weekend-slot pour tous les jours non ouvrés
            classes.push('weekend-slot');
          }
          return classes;
        }}
        slotLaneClassNames={(arg) => {
          if (!arg?.date) return '';
          // Utiliser weekend-column pour tous les jours non ouvrés
          return DateUtils.isHolidayOrWeekend(arg.date, holidays) ? 'weekend-column' : '';
        }}
        dayHeaderClassNames={(arg) => {
          if (!arg?.date) return '';
          // Utiliser weekend-header pour tous les jours non ouvrés
          return DateUtils.isHolidayOrWeekend(arg.date, holidays) ? 'weekend-header' : '';
        }}
        dayCellClassNames={(arg) => {
          if (!arg?.date) return [];
          const classes = [];
          // Appliquer weekend-cell à tous les jours non ouvrés
          if (DateUtils.isHolidayOrWeekend(arg.date, holidays)) {
            classes.push('weekend-cell');
          }
          // Vous pouvez toujours garder holiday-cell pour une distinction visuelle si nécessaire
          if (DateUtils.isHoliday(arg.date, holidays)) {
            classes.push('holiday-cell');
          }
          return classes;
        }}

        // Dans votre composant CalendarMain.jsx, modifiez uniquement la fonction eventContent:
        eventContent={(arg) => {
          const { event } = arg;

          // Obtenir la ressource (owner) associée à cet événement
          const resourceId = event.getResources()[0]?.id;

          const isConge = event.title?.toLowerCase().includes('conge');

          // Définir une couleur par défaut
          let backgroundColor = '';

          if (isConge) {
            // Style amélioré pour les congés
            if (arg.view.type.includes('resourceTimeline')) {
              return {
                html: `
                  <div class="fc-event-main-custom conge-event" 
                      style="position: relative;
                              height: 100%;
                              padding: 3px 6px; 
                              border-radius: 4px;
                              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                              overflow: visible; /* Changé de hidden à visible pour permettre au titre de dépasser */
                              text-overflow: ellipsis; 
                              white-space: nowrap;
                              background: repeating-linear-gradient(
                                45deg,
                                #e5e7eb,
                                #e5e7eb 4px,
                                #f3f4f6 4px,
                                #f3f4f6 8px
                              );
                              border-left: 3px solid #9ca3af;
                              color: #4b5563;
                              font-weight: 600;">
                      <!-- Conteneur pour le titre visible lors du défilement -->
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
                    
                    <!-- Contenu original (rendu invisible pour éviter la duplication visuelle) -->
                    <div style="visibility: hidden;">
                      <div style="display: flex; align-items: center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        ${event.title}
                      </div>
                    </div>
                  </div>
                `
              };
            }
            return null;
          }

          // Si nous avons une ressource et une couleur associée, l'utiliser
          if (resourceId !== null && memberColorMap[resourceId]) {
            backgroundColor = memberColorMap[resourceId];
          } else {
            backgroundColor = '#9ca3af'; // Couleur par défaut
          }

          // Créer une couleur légèrement plus foncée pour la bordure
          const darkerColor = adjustColor(backgroundColor, -15);

          // Déterminer la couleur du texte pour un bon contraste
          const textColor = getContrastTextColor(backgroundColor);

          // Appliquer le style uniquement pour les vues timeline
          if (arg.view.type.includes('resourceTimeline')) {
            // Calculer la durée de l'événement en jours
            const startDate = new Date(event.start);
            const endDate = event.end ? new Date(event.end) : new Date(startDate);
            const durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

            // Créer un dégradé léger pour donner de la profondeur à la tâche
            const gradientBg = `linear-gradient(to bottom, ${adjustColor(backgroundColor, 5)}, ${backgroundColor})`;

            // Utiliser une classe pour les tâches longues vs courtes
            const taskSizeClass = durationInDays > 5 ? 'long-task' : 'short-task';

            // Style du titre amélioré sans encadrement
            const titleHtml = `
              <div class="task-title-container" style="
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                z-index: 2;
                pointer-events: none;
                display: flex;
                align-items: center;
              ">
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
                  background-color: ${adjustColor(backgroundColor, 0, 0.9)}; /* Semi-transparent background */
                  backdrop-filter: blur(2px);
                  border-radius: 3px;
                  box-shadow: 0 0 4px rgba(0,0,0,0.1);
                ">${event.title}</span>
              </div>
            `;

            return {
              html: `
                <div class="fc-event-main-custom ${taskSizeClass}" 
                  style="background: ${gradientBg}; 
                  color: ${textColor}; 
                  padding: 3px 6px; 
                  border-radius: 4px; 
                  height: 100%;
                  position: relative;
                  overflow: visible; /* Changé de hidden à visible */
                  border-left: 3px solid ${darkerColor};
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  ">${titleHtml}
                  <span class="task-title-duplicate" 
                    style="
                    visibility: visible;
                    opacity: 0.4;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: inline-block;
                    max-width: 95%;
                  ">${event.title}</span>
                </div>
              `
            };
          }
          
          return null;
        }}
        // Gestionnaires d'événements
        eventDragStart={taskHandlers.handleEventDragStart}
        eventDrop={handleEventDrop}
        drop={taskHandlers.handleExternalDrop}
        select={taskHandlers.handleDateClick}
        eventClick={taskHandlers.handleCalendarEventClick}
        eventResize={handleEventResize}
        eventDragStop={taskHandlers.handleEventDragStop}
        eventReceive={taskHandlers.handleEventReceive}
      />
    </div>
  );
};