import React, { useState, useRef, useMemo, createRef } from 'react';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useTaskHandlers } from '../../hooks/useTaskHandlers';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { CalendarMain } from '../calendar/CalendarMain';
import { TaskBoard } from '../taskBoard/TaskBoard';
import { TaskForm } from '../form/TaskForm';
import '../../style/CalendarView.css';

export const CalendarView = () => {
  // État principal du calendrier
  const [calendarState, setCalendarState] = useState({
    showWeekends: true,
    isFormOpen: false,
    selectedDates: null,
    selectedTask: null,
    isProcessing: false,
    currentView: 'resourceTimelineYear',
    taskboardDestination: null,
    taskOriginId: null
  });

  // Année actuellement sélectionnée dans le calendrier
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const calendarRef = useRef(null);
  const { tasks, setTasks, resources, holidays, statuses } = useCalendarData();

  // Zones de dépôt pour le TaskBoard
  const dropZones = useMemo(() => {
    // Trier les statuses par leur statusId
    const sortedStatuses = [...statuses].sort((a, b) => {
      const idA = parseInt(a.statusId, 10);
      const idB = parseInt(b.statusId, 10);
      return idA - idB;
    });

    // Transformer les statuses en dropZones
    return sortedStatuses.map(status => ({
      statusId: status.statusId.toString(),
      title: status.statusType,
      disabled: status.statusId.toString() === '2'
    }));
  }, [statuses]);

  // Créer les références pour les zones de dépôt
  const dropZoneRefs = useRef(dropZones.map(() => createRef()));

  // Gérer la fermeture du formulaire
  const handleFormClose = () => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null,
      taskOriginId: null
    }));
  };

  // Fonction pour ouvrir le formulaire de création de tâche
  const handleCreateTask = () => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: true,
      selectedTask: null,
      selectedDates: {
        start: new Date(),
        end: new Date()
      }
    }));
  };

  // Gérer le déplacement des tâches entre les taskboards
  const handleMoveTask = (taskId, newStatusId) => {
    // Trouver la tâche à déplacer
    const taskToMove = tasks.find(task => task.id.toString() === taskId.toString());

    if (!taskToMove) {
      console.error(`Tâche avec l'ID ${taskId} non trouvée`);
      return;
    }

    if (newStatusId === '2') {
      // Ouvrir le formulaire pour modifier la tâche
      setCalendarState(prev => ({
        ...prev,
        isFormOpen: true,
        selectedTask: taskToMove,
        taskboardDestination: '2',
        taskOriginId: taskId
      }));
    } else {
      // Vérifier si la tâche est actuellement dans le taskboard "En cours"
      const isMovingFromInProgress = (taskToMove.extendedProps?.statusId === '2' || taskToMove.statusId === '2');

      // Préparer les mises à jour
      const updates = {
        statusId: newStatusId,
        extendedProps: {
          ...taskToMove.extendedProps,
          statusId: newStatusId
        }
      };

      // Si la tâche sort du taskboard "En cours", réinitialiser les dates et le propriétaire
      if (isMovingFromInProgress) {
        updates.start = null;
        updates.end = null;
        updates.start_date = null;
        updates.end_date = null;
        updates.resourceId = null;
        updates.owner_id = null;
      }

      // Utiliser handleTaskUpdate du hook
      taskHandlers.handleTaskUpdate(
        taskId,
        updates,
        {
          successMessage: `Tâche déplacée vers ${dropZones.find(zone => zone.statusId === newStatusId)?.title || 'nouveau statut'}`,
          skipApiCall: false
        }
      );
    }
  };

  // Gérer la soumission du formulaire
  const handleFormSubmit = async (updatedTask) => {
    try {
      // Passer l'information de destination si applicable
      await taskHandlers.handleTaskSubmit(updatedTask, {
        taskboardDestination: calendarState.taskboardDestination
      });

      // La réinitialisation de l'état est maintenant gérée dans le hook
    } catch (error) {
      console.error('Erreur dans handleFormSubmit:', error);
    }
  };

  // Hook pour gérer les interactions avec les tâches
  const taskHandlers = useTaskHandlers(
    setTasks,
    setCalendarState,
    tasks,
    dropZoneRefs,
    dropZones,
    holidays,
    calendarRef
  );

  // Hook pour la navigation dans le calendrier
  const {
    navigateToMonth,
    goToPreviousYear,
    goToNextYear,
    goToPreviousWeek,
    goToNextWeek,
    handleViewChange,
    months
  } = useCalendarNavigation(calendarRef, selectedYear, setSelectedYear);

  return (
    <div className="flex flex-col">
      <div className="w-full calendar">
        <CalendarMain
          calendarRef={calendarRef}
          tasks={tasks}
          resources={resources}
          holidays={holidays}
          taskHandlers={taskHandlers}
          handleViewChange={handleViewChange}
          months={months}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          goToPreviousYear={goToPreviousYear}
          goToNextYear={goToNextYear}
          goToPreviousWeek={goToPreviousWeek}
          goToNextWeek={goToNextWeek}
          navigateToMonth={navigateToMonth}
          dropZoneRefs={dropZoneRefs}
          dropZones={dropZones}
        />
      </div>

      <div className="w-full m-4">
        <TaskBoard
          dropZones={dropZones}
          dropZoneRefs={dropZoneRefs}
          externalTasks={tasks}
          handleExternalTaskClick={taskHandlers.handleExternalTaskClick}
          onDeleteTask={taskHandlers.handleDeleteTask}
          resources={resources}
          onMoveTask={handleMoveTask}
          onCreateTask={handleCreateTask}
        />
      </div>

      <TaskForm
        isOpen={calendarState.isFormOpen}
        onClose={handleFormClose}
        selectedDates={calendarState.selectedDates}
        selectedTask={calendarState.selectedTask}
        resources={resources}
        statuses={statuses}
        onSubmit={handleFormSubmit}
        holidays={holidays}
        onDeleteTask={taskHandlers.handleDeleteTask}
      />
    </div>
  );
};