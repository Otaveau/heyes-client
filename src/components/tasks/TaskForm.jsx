import React, { useState, useCallback, useEffect } from 'react';
import { X, Trash2, Save, AlertTriangle, Calendar, User, FileText, Type, Tag } from 'lucide-react';
import { ERROR_MESSAGES } from '../../constants/constants';

export const TaskForm = ({
    isOpen,
    onClose,
    selectedDates,
    selectedTask,
    resources = [],
    statuses = [],
    onSubmit: handleTaskSubmit,
    onDeleteTask
}) => {

    const formatDateForInput = useCallback((date) => {
        if (!date) return '';

        const d = new Date(date);

        // Vérifier si la date est valide
        if (isNaN(d.getTime())) return '';

        // Utiliser les méthodes UTC pour éviter les décalages de fuseau horaire
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');

        // Retourner au format YYYY-MM-DD pour l'élément input type="date"
        return `${year}-${month}-${day}`;
    }, []);

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
    }, [selectedDates, selectedTask, formatDateForInput]);

    const [formData, setFormData] = useState(getInitialFormData());
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setErrors({});
            setShowDeleteConfirmation(false);
        }
    }, [getInitialFormData, isOpen, selectedDates, selectedTask]);

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
            }

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

            if (name === 'resourceId') {
                if (value !== '') {
                    // Si une ressource est sélectionnée, on met le statut à "En cours"
                    newData.statusId = '2';
                } else {
                    // Si la ressource est désélectionnée
                    // et que le statut est "En cours", on change le statut à "Entrant"
                    if (newData.statusId === '2' && !newData.isConge) {
                        newData.statusId = '1';
                    }
                }
            }

            // Si on change le statut à "En cours" mais qu'il n'y a pas de ressource
            if (name === 'statusId' && value === '2' && !newData.resourceId && !newData.isConge) {
                // Afficher un message pour demander à l'utilisateur d'attribuer une ressource
                setTimeout(() => {
                    setErrors(prevErrors => ({
                        ...prevErrors,
                        resourceId: 'Veuillez attribuer une ressource pour une tâche en cours'
                    }));
                }, 0);
            }

            // Si on change le statut à "En cours", vérifier aussi les dates
            if (name === 'statusId' && value === '2') {
                if (!newData.startDate) {
                    setTimeout(() => {
                        setErrors(prevErrors => ({
                            ...prevErrors,
                            startDate: 'La date de début est requise pour une tâche en cours'
                        }));
                    }, 0);
                }
                
                if (!newData.endDate) {
                    setTimeout(() => {
                        setErrors(prevErrors => ({
                            ...prevErrors,
                            endDate: 'La date de fin est requise pour une tâche en cours'
                        }));
                    }, 0);
                }
            }

            return newData;
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    }, [errors]);

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

        if (formData.isConge) {
            if (!formData.resourceId) {
                newErrors.resourceId = 'La ressource est requise pour un congé';
            }
        } else if (!formData.statusId) {
            newErrors.statusId = ERROR_MESSAGES.STATUS_REQUIRED;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        try {
            // Les dates sont déjà au format YYYY-MM-DD comme attendu
            const taskData = {
                ...formData,
                start: formData.startDate,
                end: formData.endDate
            };

            // Appeler la fonction de soumission
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

    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
    };

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

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
        }
    }, [onClose]);

    // Déterminer si le statut actuel est "En cours" (WIP)
    const isWipStatus = formData.statusId === '2';
    // Déterminer si on est en mode édition (modification d'une tâche existante)
    const isEditMode = Boolean(selectedTask);

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
                            {errors.title && (
                                <p className="text-red-500 text-xs italic mt-1">{errors.title}</p>
                            )}
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
                            
                            {errors.statusId && (
                                <p className="text-red-500 text-xs italic mt-1">{errors.statusId}</p>
                            )}
                            {isWipStatus && !formData.resourceId && !errors.resourceId && (
                                <p className="text-amber-500 text-xs italic mt-1 flex items-center">
                                    <AlertTriangle size={12} className="mr-1" />
                                    Une ressource est requise pour une tâche en cours
                                </p>
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
                                {resources
                                    .filter(resource => !resource.isTeam && !resource.id.toString().startsWith('team_'))
                                    .map(resource => (
                                        <option key={resource.id} value={resource.id}>
                                            {resource.title}
                                        </option>
                                    ))}
                            </select>
                            {errors.resourceId && (
                                <p className="text-red-500 text-xs italic mt-1">{errors.resourceId}</p>
                            )}
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
                                    {errors.startDate && (
                                        <p className="text-red-500 text-xs italic mt-1">{errors.startDate}</p>
                                    )}
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
                                    {errors.endDate && (
                                        <p className="text-red-500 text-xs italic mt-1">{errors.endDate}</p>
                                    )}
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
                            
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        En cours...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className="mr-1.5" />
                                        {selectedTask ? 'Enregistrer' : 'Créer'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Fenêtre de confirmation de suppression */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 flex items-center justify-center z-60">
                    <div 
                        className="bg-red-50 border-2 border-red-200 rounded-lg shadow-2xl max-w-md mx-auto p-6 w-11/12 sm:w-96 transform translate-y-0 scale-100 transition-all duration-200 animate-fadeIn"
                        style={{ 
                            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5), 0 8px 10px -6px rgba(220, 38, 38, 0.2)'
                        }}
                    >
                        <div className="text-center mb-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Confirmer la suppression</h3>
                        </div>
                        
                        <div className="bg-white rounded-md p-4 mb-4 border border-red-100">
                            <p className="text-sm text-gray-700 mb-1">
                                Vous êtes sur le point de supprimer :
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                                "{formData.title}"
                            </p>
                        </div>
                        
                        <p className="text-sm text-red-600 mb-5 font-medium flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Cette action est irréversible
                        </p>
                        
                        <div className="flex space-x-3 justify-center">
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-1/2"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors w-1/2"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Suppression...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};