import React from 'react';
import { TaskCard } from './TaskCard';
import { MoveRight, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';

export const TaskBoardZone= ({
  zone,
  tasks,
  index,
  totalZones,
  reference,
  openDeleteModal,
  moveTaskLeft,
  moveTaskRight,
  handleTaskClick,
  getResourceName
}) => {
  const isInProgressZone = zone.statusId === '2';

  // Fonction pour sélectionner l'icône appropriée selon le titre de la colonne
  const getZoneIcon = () => {
    const title = zone.title.toLowerCase();
    
    if (title.includes('entrant')) return <MoveRight className={iconClass} />;
    if (title.includes('cours')) return <Clock className={iconClass} />;
    if (title.includes('attente')) return <AlertCircle className={iconClass} />;
    if (title.includes('done')) return <CheckCircle className={iconClass} />;
    return <Plus className={iconClass} />;
  };
  
  const iconClass = `h-5 w-5 mr-2 ${isInProgressZone ? 'text-blue-600 dark:text-blue-500' : 'text-gray-600 dark:text-gray-400'}`;

  return (
    <div
      ref={reference}
      className={`flex-1 w-1/4 p-5 rounded mt-5 potential-drop-target ${
        isInProgressZone 
          ? 'bg-blue-50 dark:bg-blue-900/20' 
          : 'bg-gray-100 dark:bg-gray-800 dropzone'
      } rounded-lg shadow-md`}
      data-status-id={zone.statusId}
      data-zone-id={zone.id}
      data-dropzone-id={zone.id}
    >
      <h3 className={`mb-4 font-bold text-lg flex items-center border-b pb-2 ${
        isInProgressZone 
          ? 'text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700' 
          : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
      }`}>
        {getZoneIcon()}
        {zone.title}
        <span className="ml-2 text-sm font-normal bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </h3>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          isInProgressZone={isInProgressZone}
          canMoveLeft={index > 0}
          canMoveRight={index < totalZones - 1}
          getResourceName={getResourceName}
          onTaskClick={() => handleTaskClick && handleTaskClick(task)}
          onDeleteClick={(e) => openDeleteModal(e, task)}
          onMoveLeftClick={(e) => moveTaskLeft(e, task)}
          onMoveRightClick={(e) => moveTaskRight(e, task)}
        />
      ))}

      {tasks.length === 0 && (
        <div className="text-gray-400 dark:text-gray-500 text-center p-2">
          Pas de tâches
        </div>
      )}
    </div>
  );
};