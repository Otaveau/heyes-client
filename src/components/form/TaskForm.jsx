import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Trash2, Calendar, User, FileText, Type, Tag } from 'lucide-react';
import { ERROR_MESSAGES } from '../../constants/constants';
import { formatDateForInput, isHoliday, isWeekend } from '../../utils/DateUtils';
import { DeleteConfirmationModal, ErrorMessage, WarningMessage } from './MessageForm';
import { SubmitButton } from './SubmitButtonForm';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [],
    statuses = [],
    holidays = {},
    onSubmit: handleTaskSubmit,
    onDeleteTask
}) => {

    // Initialisation du formulaire
    const getInitialFormData = useCallback(() => {
        if (selectedTask) {
            const isAssigned = selectedTask.start && selectedTask.end;

            let startDateStr, endDateStr;

            if (isAssigned) {
                const startDate = new Date(selectedTask.start);
                let endDate;

                if (selectedTask.extendedProps?.inclusiveEndDate) {
                    endDate = new Date(selectedTask.extendedProps.inclusiveEndDate);
                } else if (selectedTask.end) {
                    endDate = new Date(selectedTask.end);
                }
                else {
                    endDate = new Date(startDate);
                }

                // Formater en YYYY-MM-DD pour input type="date"
                startDateStr = startDate.toISOString().split('T')[0];
                endDateStr = endDate.toISOString().split('T')[0];
            } else {
                startDateStr = '';
                endDateStr = '';
            }

            // Vérifier si la propriété isConge existe
            const isConge = (selectedTask.isConge ?? false) || (selectedTask.title === 'CONGE');

            return {
                id: selectedTask.id,
                title: selectedTask.title || '',
                description: selectedTask.description || selectedTask.extendedProps?.description || '',
                startDate: startDateStr,
                endDate: endDateStr,
                resourceId: selectedTask.resourceId || (selectedDates ? selectedDates.resourceId : '') || '',
                statusId: selectedTask.statusId || selectedTask.extendedProps?.statusId || '2',
                isConge: isConge
            };
        }

        // Si on crée une nouvelle tâche depuis le calendrier
        if (selectedDates && !selectedTask) {
            return {
                title: '',
                description: '',
                startDate: formatDateForInput(selectedDates.start),
                endDate: formatDateForInput(selectedDates.start), // Même jour par défaut
                resourceId: selectedDates.resourceId || '',
                statusId: selectedDates.resourceId ? '2' : '',
                isConge: false
            };
        }

        // Cas par défaut (nouvelle tâche sans contexte)
        return {
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            resourceId: '',
            statusId: '',
            isConge: false
        };
    }, [selectedDates, selectedTask]);

    // État du formulaire
    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    // Déterminer si le statut actuel est "En cours" (WIP)
    const isWipStatus = formData.statusId === '2';
    // Déterminer si on est en mode édition (modification d'une tâche existante)
    const isEditMode = Boolean(selectedTask);

    // Liste des ressources filtrées (exclusion des équipes)
    const filteredResources = useMemo(() =>
        resources.filter(resource => !resource.isTeam && !resource.id.toString().startsWith('team_')),
        [resources]);

    // Réinitialiser le formulaire quand il s'ouvre
    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setErrors({});
            setShowDeleteConfirmation(false);
        }
    }, [getInitialFormData, isOpen, selectedDates, selectedTask]);

    // Gestion des changements de champs
    const handleChange = useCallback((e) => {
        if (!e || !e.target) return;

        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };

            // Si le champ modifié est la date de début
            if (name === 'startDate' && value) {
              // Si la date de fin est vide ou antérieure à la nouvelle date de début
              if (!newData.endDate || new Date(newData.endDate) < new Date(value)) {
                  // Mettre la date de fin égale à la date de début
                  newData.endDate = value;
              }
              
              // Validation des jours fériés et week-ends pour la date de début
              if (value) {
                  const selectedDate = new Date(value);
                  // Vérifier d'abord si c'est un week-end
                  if (isWeekend(selectedDate)) {
                      setTimeout(() => {
                          setErrors(prev => ({
                              ...prev,
                              startDate: '⚠️ La date de début ne peut pas être un week-end'
                          }));
                      }, 0);
                  } 
                  // Ensuite vérifier si c'est un jour férié
                  else if (holidays && Object.keys(holidays).length > 0 && isHoliday(selectedDate, holidays)) {
                      setTimeout(() => {
                          setErrors(prev => ({
                              ...prev,
                              startDate: '⚠️ La date de début ne peut pas être un jour férié'
                          }));
                      }, 0);
                  }
              }
          }
          
          // Validation des jours fériés et week-ends pour la date de fin
          if (name === 'endDate' && value) {
              const selectedDate = new Date(value);
              // Vérifier d'abord si c'est un week-end
              if (isWeekend(selectedDate)) {
                  setTimeout(() => {
                      setErrors(prev => ({
                          ...prev,
                          endDate: '⚠️ La date de fin ne peut pas être un week-end'
                      }));
                  }, 0);
              } 
              // Ensuite vérifier si c'est un jour férié
              else if (holidays && Object.keys(holidays).length > 0 && isHoliday(selectedDate, holidays)) {
                  setTimeout(() => {
                      setErrors(prev => ({
                          ...prev,
                          endDate: '⚠️ La date de fin ne peut pas être un jour férié'
                      }));
                  }, 0);
              }
          }

            // Gestion de l'option congé
            if (name === 'isConge') {
                if (checked) {
                    newData.statusId = '2';
                    newData.title = 'CONGE';
                } else {
                    newData.title = '';
                    if (!newData.resourceId) {
                        newData.statusId = '1';
                    }
                }
            }

            // Gestion de l'attribution de ressource
            if (name === 'resourceId') {
                if (value !== '') {
                    // Si une ressource est sélectionnée, on met le statut à "En cours"
                    newData.statusId = '2';
                } else if (newData.statusId === '2' && !newData.isConge) {
                    // Si la ressource est désélectionnée et que le statut est "En cours", on change le statut à "Entrant"
                    newData.statusId = '1';
                }
            }

            return newData;
        });

        // Effacer l'erreur éventuelle pour ce champ
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }

        // Ajouter des validations supplémentaires
        if (name === 'statusId' && value === '2') {
            setTimeout(() => {
                setErrors(prev => ({
                    ...prev,
                    resourceId: !formData.resourceId ? 'Veuillez attribuer une ressource pour une tâche en cours' : null,
                    startDate: !formData.startDate ? 'La date de début est requise pour une tâche en cours' : null,
                    endDate: !formData.endDate ? 'La date de fin est requise pour une tâche en cours' : null
                }));
            }, 0);
        }
    }, [errors, formData.resourceId, formData.startDate, formData.endDate, holidays]);


    // Validation du formulaire
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = ERROR_MESSAGES.TITLE_REQUIRED;
    }

    // Vérifier si le statut est "En cours" (statusId === '2')
    const isWipStatus = formData.statusId === '2';

    // Rendre les dates et le owner obligatoires si le statut est WIP
    if (isWipStatus) {
      if (!formData.resourceId) {
        newErrors.resourceId = 'Une ressource est requise pour une tâche en cours';
      }
      
      if (!formData.startDate) {
        newErrors.startDate = 'La date de début est requise pour une tâche en cours';
      }

      if (!formData.endDate) {
        newErrors.endDate = 'La date de fin est requise pour une tâche en cours';
      }
    }
    
    // Rendre les dates obligatoires uniquement si une ressource est sélectionnée
    if (formData.resourceId) {
      if (!formData.startDate) {
        newErrors.startDate = ERROR_MESSAGES.START_DATE_REQUIRED;
      }

      if (!formData.endDate) {
        newErrors.endDate = ERROR_MESSAGES.END_DATE_REQUIRED;
      }
    }

    // Validation de la chronologie des dates
    if (formData.startDate && formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = ERROR_MESSAGES.END_DATE_VALIDATION;
    }

    // Vérification des jours fériés et week-ends
    if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      // Vérifier d'abord si c'est un week-end
      if (isWeekend(startDate)) {
        newErrors.startDate = '⚠️ La date de début ne peut pas être un week-end';
      }
      // Ensuite vérifier si c'est un jour férié
      else if (holidays && Object.keys(holidays).length > 0 && isHoliday(startDate, holidays)) {
        newErrors.startDate = '⚠️ La date de début ne peut pas être un jour férié';
      }
    }

    if (formData.endDate) {
      const endDate = new Date(formData.endDate);
      // Vérifier d'abord si c'est un week-end
      if (isWeekend(endDate)) {
        newErrors.endDate = '⚠️ La date de fin ne peut pas être un week-end';
      }
      // Ensuite vérifier si c'est un jour férié
      else if (holidays && Object.keys(holidays).length > 0 && isHoliday(endDate, holidays)) {
        newErrors.endDate = '⚠️ La date de fin ne peut pas être un jour férié';
      }
    }

    if (formData.isConge) {
      if (!formData.resourceId) {
        newErrors.resourceId = 'La ressource est requise pour un congé';
      }
    } else if (!formData.statusId) {
      newErrors.statusId = ERROR_MESSAGES.STATUS_REQUIRED;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, holidays]);


  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        ...formData,
        start: formData.startDate,
        end: formData.endDate
      };

      await handleTaskSubmit(taskData);
      onClose();
    } catch (error) {
      console.error('Error:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Une erreur est survenue lors de la soumission'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

    // Gestion de la suppression
  const handleDeleteClick = () => setShowDeleteConfirmation(true);
  
  const handleConfirmDelete = async () => {
    try {
      setIsSubmitting(true);
      if (onDeleteTask && formData.id) {
        await onDeleteTask(formData.id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Une erreur est survenue lors de la suppression'
      }));
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirmation(false);
    }
  };
  
  const handleCancelDelete = () => setShowDeleteConfirmation(false);

  // Gestion du clic en dehors du modal
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      {/* Formulaire principal */}
      <div className={`bg-white p-0 rounded-lg w-[420px] relative max-h-[90vh] overflow-y-auto ${showDeleteConfirmation ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* En-tête du formulaire */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Option congé */}
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
              <input
                type="checkbox"
                id="isConge"
                name="isConge"
                checked={formData.isConge}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="isConge" className="text-blue-800 font-medium">
                Marquer comme congé
              </label>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="flex items-center text-sm font-medium text-gray-700">
                <Type size={16} className="mr-2 text-gray-500" />
                Titre
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className='w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                disabled={formData.isConge}
                required
                placeholder="Titre de la tâche"
              />
              <ErrorMessage message={errors.title} />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
                <FileText size={16} className="mr-2 text-gray-500" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Description optionnelle"
              />
            </div>

            {/* Statut */}
            <div className="space-y-1.5">
              <label htmlFor="statusId" className="flex items-center text-sm font-medium text-gray-700">
                <Tag size={16} className="mr-2 text-gray-500" />
                Statut
              </label>
              <div className="relative">
                <select
                  id="statusId"
                  name="statusId"
                  value={formData.statusId}
                  onChange={handleChange}
                  className='w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500'
                  required={!formData.isConge}
                  disabled={formData.resourceId !== '' || formData.isConge}
                >
                  <option value="">Sélectionner un statut</option>
                  {statuses.map(status => (
                    <option key={status.statusId} value={status.statusId}>
                      {status.statusType}
                    </option>
                  ))}
                </select>
              </div>
              
              <ErrorMessage message={errors.statusId} />
              {isWipStatus && !formData.resourceId && !errors.resourceId && (
                <WarningMessage message="Une ressource est requise pour une tâche en cours" />
              )}
            </div>

            {/* Assigné à */}
            <div className="space-y-1.5">
              <label htmlFor="resourceId" className="flex items-center text-sm font-medium text-gray-700">
                <User size={16} className="mr-2 text-gray-500" />
                Assigné à{isWipStatus || formData.isConge ? ' *' : ''}
              </label>
              <select
                id="resourceId"
                name="resourceId"
                value={formData.resourceId}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={isWipStatus || formData.isConge}
              >
                <option value="">Sélectionner une ressource</option>
                {filteredResources.map(resource => (
                  <option key={resource.id} value={resource.id}>
                    {resource.title}
                  </option>
                ))}
              </select>
              <ErrorMessage message={errors.resourceId} />
            </div>

            {/* Dates */}
            <div className="space-y-1.5">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Calendar size={16} className="mr-2 text-gray-500" />
                Période{isWipStatus || formData.resourceId ? ' *' : ''}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={isWipStatus || !!formData.resourceId}
                  />
                  {errors.startDate ? (
                <div className="text-red-600 text-sm font-medium mt-1.5 p-1.5 bg-red-50 border border-red-200 rounded-md">
                  {errors.startDate}
                </div>
              ) : null}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={isWipStatus || !!formData.resourceId}
                    min={formData.startDate}
                  />
                  {errors.endDate ? (
                <div className="text-red-600 text-sm font-medium mt-1.5 p-1.5 bg-red-50 border border-red-200 rounded-md">
                  {errors.endDate}
                </div>
              ) : null}
                </div>
              </div>
            </div>

            {/* Message d'erreur global */}
            {errors.submit && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Barre d'actions au bas du formulaire */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg flex justify-between items-center">
            {/* Boutons de gauche */}
            <div>
              {isEditMode && onDeleteTask && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
                >
                  <Trash2 size={16} className="mr-1" />
                  Supprimer
                </button>
              )}
            </div>
            
            {/* Boutons de droite */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-100"
              >
                Annuler
              </button>
              
              <SubmitButton isSubmitting={isSubmitting} isEditMode={isEditMode} />
            </div>
          </div>
        </form>
      </div>

      {/* Fenêtre de confirmation de suppression */}
      {showDeleteConfirmation && (
        <DeleteConfirmationModal 
          formData={formData}
          isSubmitting={isSubmitting}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};