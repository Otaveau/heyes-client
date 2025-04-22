import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../../services/api/teamService';
import { Card } from '../ui/card';
import ConfirmationModal from '../ui/confirmationModal';
import { TeamAddForm } from './TeamAddForm';
import { TeamEditForm } from './TeamEditForm';
import { TeamList } from './TeamList';
import { TeamDetails } from './TeamDetails';



export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ID de l'équipe sélectionnée
  const selectedTeamId = useMemo(() => 
    selectedTeam ? selectedTeam.team_id : null
  , [selectedTeam]);

  // Charger les équipes
  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les équipes. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  // Création d'une équipe
  const handleCreateTeam = useCallback(async (newTeam) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await createTeam(newTeam);
      await loadTeams();
      return true;
    } catch (error) {
      console.error('Error creating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Erreur lors de la création de l\'équipe. Veuillez réessayer.');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadTeams]);

  // Sélection d'une équipe
  const handleSelectTeam = useCallback((team) => {
    if (selectedTeam && selectedTeam.team_id === team.team_id) {
      setSelectedTeam(null);
      setEditMode(false);
    } else {
      setSelectedTeam(team);
      setEditMode(false);
    }
  }, [selectedTeam]);

  // Entrer en mode édition
  const handleEnterEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  // Annuler l'édition
  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  // Mise à jour d'une équipe
  const handleUpdateTeam = useCallback(async (editedTeam) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedTeam = await updateTeam(editedTeam.team_id, {
        name: editedTeam.name.trim(),
        color: editedTeam.color
      });

      await loadTeams();
      setSelectedTeam(updatedTeam);
      setEditMode(false);
    } catch (error) {
      console.error('Error updating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
      } else {
        setError('Erreur lors de la mise à jour de l\'équipe. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [loadTeams]);

  // Supprimer une équipe - Étape 1: ouvrir la confirmation
  const handleDeleteClick = useCallback((team) => {
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  }, []);

  // Supprimer une équipe - Étape 2: fermer la confirmation
  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setTeamToDelete(null);
  }, []);

  // Supprimer une équipe - Étape 3: confirmer la suppression
  const handleConfirmDelete = useCallback(async () => {
    if (!teamToDelete) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteTeam(teamToDelete.team_id);

      // Si l'équipe supprimée était sélectionnée, désélectionner
      if (selectedTeam && selectedTeam.team_id === teamToDelete.team_id) {
        setSelectedTeam(null);
        setEditMode(false);
      }

      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Erreur lors de la suppression de l\'équipe. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      handleCloseDeleteModal();
    }
  }, [teamToDelete, selectedTeam, loadTeams, handleCloseDeleteModal]);

  return (
    <div className="p-8 min-h-screen w-full md:w-4/5 lg:w-3/4 mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-3xl text-center font-bold mb-8 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
        Gestion des équipes
      </h2>

      {/* Formulaire d'ajout d'équipe */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Ajouter une équipe
        </h3>
        <TeamAddForm 
          onSubmit={handleCreateTeam}
          isSubmitting={isSubmitting}
          error={error}
        />
      </div>

      {/* Conteneur principal */}
      <div className={`${selectedTeam ? 'grid gap-10 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des équipes */}
        <div className={`space-y-6 ${!selectedTeam ? 'max-w-2xl w-full' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Liste des équipes
            </h3>
            <div className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full font-medium">
              {teams.length} {teams.length > 1 ? 'équipes' : 'équipe'}
            </div>
          </div>

          <TeamList 
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelectTeam={handleSelectTeam}
            onDeleteTeam={handleDeleteClick}
            isLoading={isLoading && !isSubmitting}
          />
        </div>

        {/* Détails de l'équipe sélectionnée */}
        {selectedTeam && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Détails de l'équipe
            </h3>
            <Card className="p-6 shadow-md bg-white dark:bg-gray-700 overflow-hidden">
              {/* Bande de couleur en haut de la carte */}
              <div 
                className="h-2 -mx-6 -mt-6 mb-5"
                style={{ backgroundColor: selectedTeam.color || '#000000' }}
              ></div>

              {editMode ? (
                <TeamEditForm 
                  team={selectedTeam}
                  onSave={handleUpdateTeam}
                  onCancel={handleCancelEdit}
                  isSubmitting={isSubmitting}
                />
              ) : (
                <TeamDetails 
                  team={selectedTeam}
                  onEdit={handleEnterEditMode}
                />
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'équipe "${teamToDelete?.name}" ?`}
      />
    </div>
  );
}