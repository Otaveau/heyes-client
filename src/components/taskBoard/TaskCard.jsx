import React from 'react';
import { Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { getInclusiveEndDate } from '../../utils/DateUtils';

export const TaskCard = ({
  task,
  isInProgressZone,
  canMoveLeft,
  canMoveRight,
  getResourceName,
  onTaskClick,
  onDeleteClick,
  onMoveLeftClick,
  onMoveRightClick
}) => {
  // Vérifier si c'est un congé
  const isConge =
    task.isConge === true ||
    task.extendedProps?.isConge === true ||
    task.title === 'CONGE';

  // Fonction pour formater une date en format lisible
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return 'Date invalide';
    }
  };

  return (
    <div
      data-task-id={task.id}
      className={`${isConge ? 'conge-task' : 'fc-event'} p-2 mb-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 relative`}
      data-is-conge={isConge ? 'true' : 'false'}
      onClick={onTaskClick}
    >
      {/* Titre affiché pour toutes les tâches */}
      <div className="font-medium dark:text-white">{task.title}</div>

      {/* Description affichée pour toutes les tâches si elle existe */}
      {(task.description || task.extendedProps?.description) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {task.description || task.extendedProps?.description}
        </div>
      )}

      {/* Informations supplémentaires uniquement pour le taskboard "En cours" */}
      {isInProgressZone && (
        <>
          {task.resourceId && (
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              <span className="font-medium">Assigné à:</span> {getResourceName(task.resourceId)}
            </div>
          )}

          {/* Dates de la tâche */}
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            <div><span className="font-medium">Début:</span> {formatDate(task.start)}</div>
            <div><span className="font-medium">Fin:</span> {formatDate(getInclusiveEndDate(task))}</div>
          </div>
        </>
      )}

      {/* Barre d'actions avec boutons de déplacement et suppression */}
      <div className="flex justify-end mt-2 space-x-2">
        {/* Flèche gauche - visible sauf pour le premier taskboard */}
        {canMoveLeft && (
          <button
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
            onClick={onMoveLeftClick}
            title="Déplacer vers la gauche"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Bouton de suppression */}
        <button
          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
          onClick={onDeleteClick}
          title="Supprimer la tâche"
        >
          <Trash2 size={16} />
        </button>

        {/* Flèche droite - visible sauf pour le dernier taskboard */}
        {canMoveRight && (
          <button
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 focus:outline-none"
            onClick={onMoveRightClick}
            title="Déplacer vers la droite"
          >
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
