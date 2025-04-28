import React, { useState, useEffect, useCallback, useMemo  } from 'react';
import ownerService from '../../services/ownerService';
import teamService from '../../services/teamService';
import ConfirmationModal from '../ui/confirmationModal';
import { OwnerList } from './OwnerList';
import { OwnerDetails } from './OwnerDetails';
import { OwnerForm } from './OwnerForm';
import { useTheme } from '../../context/ThemeContext';

export default function OwnerManagement() {
  // Accès au contexte de thème
  useTheme();
  
  // États
  const [owners, setOwners] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Récupérer l'ID du owner sélectionné
  const selectedOwnerId = useMemo(() => {
    if (!selectedOwner) return null;
    return selectedOwner.id || selectedOwner.owner_id || selectedOwner.ownerId;
  }, [selectedOwner]);

  // Charger les données
  const loadOwners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await ownerService.fetchOwners();
      setOwners(data);
    } catch (error) {
      console.error('Error fetching owners:', error);
      setError('Impossible de charger les owners. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const data = await teamService.fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les teams. Veuillez réessayer plus tard.');
    }
  }, []);

  // Charger les données au montage
  useEffect(() => {
    loadOwners();
    loadTeams();
  }, [loadOwners, loadTeams]);

  // Gestionnaires d'événements
  const handleCreateOwner = useCallback(async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Vérification si le nom existe déjà
      const existingOwner = owners.find(
        owner => owner.name.toLowerCase() === formData.name.toLowerCase()
      );
      
      if (existingOwner) {
        setError('Un owner avec ce nom existe déjà');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        name: formData.name.trim(),
        teamId: formData.teamId ? parseInt(formData.teamId, 10) : null
      };

      await ownerService.createOwner(sanitizedOwner);
      await loadOwners();
    } catch (error) {
      console.error('Error creating owner:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création du owner. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [owners, loadOwners]);

  const handleUpdateOwner = useCallback(async (formData) => {
    if (!selectedOwner) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const ownerId = selectedOwner.id || selectedOwner.owner_id || selectedOwner.ownerId;

      // Vérifier si le nom existe déjà et n'appartient pas à cet owner
      const existingOwner = owners.find(owner => {
        const ownerName = owner.name.toLowerCase();
        const editedName = formData.name.toLowerCase();
        const currentOwnerId = owner.id || owner.owner_id || owner.ownerId;
      
        return ownerName === editedName && currentOwnerId !== ownerId;
      });

      if (existingOwner) {
        setError('Un autre owner utilise déjà ce nom');
        setIsSubmitting(false);
        return;
      }

      const sanitizedOwner = {
        name: formData.name.trim(),
        teamId: formData.teamId ? parseInt(formData.teamId, 10) : null
      };

      const updatedOwner = await ownerService.updateOwner(ownerId, sanitizedOwner);

      // Récupérer le nom de team
      const teamId = updatedOwner.teamId || updatedOwner.team_id;
      const teamName = teams.find(t => {
        const currentTeamId = t.team_id !== undefined ? t.team_id : t.id;
        return currentTeamId === teamId;
      })?.name || 'N/A';

      // Normaliser les propriétés
      const normalizedOwner = {
        ...updatedOwner,
        id: updatedOwner.id || updatedOwner.owner_id,
        ownerId: updatedOwner.owner_id,
        teamId: teamId,
        teamName: teamName
      };

      // Mettre à jour le owner sélectionné
      setSelectedOwner(normalizedOwner);

      // Sortir du mode édition
      setEditMode(false);

      // Recharger la liste des owners
      await loadOwners();
    } catch (error) {
      console.error('Error updating owner:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la mise à jour du owner. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedOwner, owners, teams, loadOwners]);

  const handleOpenDeleteModal = useCallback((owner) => {
    setOwnerToDelete(owner);
    setDeleteModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setOwnerToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!ownerToDelete) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtenir l'ID correct pour la suppression
      const ownerId = ownerToDelete.id || ownerToDelete.owner_id || ownerToDelete.ownerId;

      await ownerService.deleteOwner(ownerId);

      // Si le owner supprimé était sélectionné, désélectionner
      if (selectedOwner && selectedOwnerId === ownerId) {
        setSelectedOwner(null);
        setEditMode(false);
      }

      await loadOwners();
    } catch (error) {
      console.error('Error deleting owner:', error);

      if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la suppression du owner. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
      handleCloseDeleteModal();
    }
  }, [ownerToDelete, selectedOwner, selectedOwnerId, loadOwners, handleCloseDeleteModal]);

  const handleSelectOwner = useCallback((owner) => {
    // Vérifier si l'ID de l'owner est le même que celui de l'owner sélectionné
    const ownerId = owner.id || owner.owner_id || owner.ownerId;
    
    if (selectedOwner && selectedOwnerId === ownerId) {
      setSelectedOwner(null);
      setEditMode(false);
    } else {
      // Normaliser l'objet owner
      const normalizedOwner = {
        ...owner,
        id: ownerId,
        teamId: owner.teamId || owner.team_id
      };

      setSelectedOwner(normalizedOwner);
      setEditMode(false);
    }
  }, [selectedOwner, selectedOwnerId]);

  const handleEnterEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditMode(false);
  }, []);

  return (
    <div className="p-8 min-h-screen w-full md:w-4/5 lg:w-3/4 mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-3xl text-center font-bold mb-8 pb-2 border-b-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white">Gestion des owners</h2>

      {/* Formulaire d'ajout de owner */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Ajouter un owner</h3>
        <OwnerForm 
          teams={teams}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleCreateOwner}
          mode="create"
        />
      </div>

      {/* Conteneur principal */}
      <div className={`${selectedOwner ? 'grid gap-10 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des owners */}
        <div className={`space-y-6 ${!selectedOwner ? 'max-w-2xl w-full' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Liste des owners</h3>
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm py-1 px-3 rounded-full font-medium">
              {owners.length} {owners.length > 1 ? 'owners' : 'owner'}
            </div>
          </div>

          <OwnerList 
            owners={owners}
            teams={teams}
            isLoading={isLoading && !isSubmitting}
            selectedOwnerId={selectedOwnerId}
            onSelect={handleSelectOwner}
            onDelete={handleOpenDeleteModal}
          />
        </div>

        {/* Détails du owner sélectionné */}
        {selectedOwner && (
          <OwnerDetails 
            owner={selectedOwner}
            teams={teams}
            isEditing={editMode}
            isSubmitting={isSubmitting}
            error={error}
            onEdit={handleEnterEditMode}
            onSave={handleUpdateOwner}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer ce owner "${ownerToDelete?.name}" ?`}
      />
    </div>
  );
}