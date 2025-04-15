import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Trash2, Plus, Loader2, Save, X, Palette } from 'lucide-react';
import { fetchTeams, deleteTeam, createTeam, updateTeam } from '../../services/api/teamService';
import ConfirmationModal from '../ui/confirmationModal';
import ColorPickerPortal from 'components/ui/ColorPickerPortal';


export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '', color: '#000000' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedTeam, setEditedTeam] = useState({ name: '', color: '' });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerButtonRef = useRef(null);

  const loadTeams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Impossible de charger les teams. Veuillez réessayer plus tard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTeam(newTeam);
      await loadTeams();
      setNewTeam({ name: '', color :'#000000' });
    } catch (error) {
      console.error('Error creating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la création de l\'team. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (team, e) => {
    e.stopPropagation(); // Empêche le clic de sélectionner team
    setTeamToDelete(team);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setTeamToDelete(null);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;

    setIsLoading(true);
    setError(null);

    try {
      await deleteTeam(teamToDelete.team_id);

      // Si team supprimée était sélectionnée, désélectionner
      if (selectedTeam && selectedTeam.team_id === teamToDelete.team_id) {
        setSelectedTeam(null);
        setEditMode(false);
      }

      await loadTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError('Erreur lors de la suppression de l\'team. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
      closeDeleteModal();
    }
  };

  const handleTeamSelect = (team) => {
    // Si on clique sur team déjà sélectionnée, on désélectionne
    if (selectedTeam && selectedTeam.team_id === team.team_id) {
      setSelectedTeam(null);
      setEditMode(false);
    } else {
      setSelectedTeam(team);
      setEditedTeam({ ...team });
      setEditMode(false); // On commence par juste sélectionner, pas éditer
    }
  };

  const handleEditMode = (e) => {
    e.preventDefault();
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    // Remettre les valeurs originales
    setEditedTeam({ ...selectedTeam });
    // Fermer le sélecteur de couleurs s'il est ouvert
    setColorPickerOpen(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editedTeam.name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Utilisation du service updateTeam
      const updatedTeam = await updateTeam(editedTeam.team_id, {
        name: editedTeam.name.trim(),
        color: editedTeam.color
      });

      // Mettre à jour la liste complète des teams
      await loadTeams();

      // Mettre à jour team sélectionnée avec les données mises à jour
      setSelectedTeam(updatedTeam);

      // Sortir du mode édition
      setEditMode(false);
    } catch (error) {
      console.error('Error updating team:', error);

      if (error.message && error.message.includes('validation')) {
        setError(error.message);
      } else if (error.status === 401) {
        window.location.href = '/login';
        return;
      } else {
        setError('Erreur lors de la mise à jour de l\'team. Veuillez réessayer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour ouvrir le sélecteur de couleurs
  const handleOpenColorPicker = () => {
    setColorPickerOpen(true);
  };

  // Fonction pour fermer le sélecteur de couleurs
  const handleCloseColorPicker = () => {
    setColorPickerOpen(false);
  };

  // Fonction pour gérer le changement de couleur
  const handleColorChange = (color) => {
    setEditedTeam(prev => ({
      ...prev,
      color: color
    }));
  };

  return (
    <div className="p-8 min-h-screen w-full md:w-4/5 lg:w-3/4 mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-3xl text-center font-bold mb-8 pb-2 border-b-2 border-gray-200 dark:border-gray-700">Gestion des teams</h2>

      {/* Formulaire d'ajout team */}
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm mb-10">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Ajouter une team</h3>
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          <div className="flex gap-4 w-full max-w-md">
            <div className="flex-grow">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Nom de team</label>
              <Input
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Nom de team"
                className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="self-end">
              <Button
                type="submit"
                disabled={isSubmitting || !newTeam.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm transition-all duration-200 font-medium h-10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
        </form>
      </div>

      {/* Conteneur principal qui change de layout basé sur la sélection team */}
      <div className={`${selectedTeam ? 'grid gap-10 grid-cols-1 md:grid-cols-2' : 'flex justify-center'}`}>
        {/* Liste des teams - sera centrée quand aucune team n'est sélectionnée */}
        <div className={`space-y-6 ${!selectedTeam ? 'max-w-2xl w-full' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Liste des teams</h3>
            <div className="bg-blue-50 text-blue-700 text-sm py-1 px-3 rounded-full font-medium">
              {teams.length} {teams.length > 1 ? 'teams' : 'team'}
            </div>
          </div>

          {isLoading && !isSubmitting ? (
            <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full">
                  <Trash2 className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                </div>
                <p className="font-medium">Aucune team disponible</p>
                <p className="text-sm">Utilisez le formulaire ci-dessus pour créer votre première team</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1">
              {teams.map(team => {
                const teamColor = team.color
                return (
                  <Card
                    key={team.team_id}
                    className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
                      selectedTeam && selectedTeam.team_id === team.team_id
                        ? 'shadow-md'
                        : ''
                    }`}
                    onClick={() => handleTeamSelect(team)}
                  >
                    <div className="flex">
                      {/* Bande de couleur */}
                      <div 
                        className="w-2"
                        style={{ backgroundColor: teamColor }}
                      ></div>
                      
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            {/* Pastille de couleur */}
                            <div 
                              className="w-5 h-5 rounded-full mr-3 flex-shrink-0"
                              style={{ backgroundColor: teamColor }}
                            ></div>
                            <h3 className="font-semibold text-lg">{team.name}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => openDeleteModal(team, e)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Détails de team sélectionnée */}
        {selectedTeam && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Détails de team</h3>
            <Card className="p-6 shadow-md bg-white dark:bg-gray-700 overflow-hidden">
              {/* Bande de couleur en haut de la carte */}
              <div 
                className="h-2 -mx-6 -mt-6 mb-5"
                style={{ backgroundColor: selectedTeam.color || '#000000' }}
              ></div>
              
              {editMode ? (
                <form onSubmit={handleSaveEdit} className="space-y-5">
                  <div>
                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom de team
                    </label>
                    <Input
                      id="teamName"
                      type="text"
                      value={editedTeam.name}
                      onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                      placeholder="Nom de team"
                      required
                      disabled={isSubmitting}
                      className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="teamColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Couleur de team
                    </label>
                    <div>
                      {/* Bouton pour ouvrir le sélecteur de couleur */}
                      <button
                        id="teamColor"
                        type="button"
                        ref={colorPickerButtonRef}
                        onClick={handleOpenColorPicker}
                        className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <div 
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: editedTeam.color || '#000000' }}
                        ></div>
                        <span className="text-sm font-medium">{editedTeam.color || '#000000'}</span>
                        <Palette className="h-4 w-4 text-gray-500" />
                      </button>

                      {/* Portail pour le sélecteur de couleur */}
                      <ColorPickerPortal
                        isOpen={colorPickerOpen}
                        initialColor={editedTeam.color || '#000000'}
                        onColorChange={handleColorChange}
                        onClose={handleCloseColorPicker}
                        referenceElement={colorPickerButtonRef}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-3 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-gray-500" />
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Couleur team: 
                      <span 
                        className="inline-block w-4 h-4 ml-2 rounded-full align-middle"
                        style={{ backgroundColor: editedTeam.color || '#000000' }}
                      ></span>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      (Cette couleur est utilisée pour toutes les tâches de team)
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 px-4 py-2 rounded-md"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !editedTeam.name.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
                    <div className="flex items-center mt-1">
                      <div 
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: selectedTeam.color || '#000000' }}
                      ></div>
                      <p className="font-medium text-lg">{selectedTeam.name}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Couleur team</p>
                    <div className="flex items-center mt-2">
                      <div 
                        className="w-6 h-6 rounded mr-3"
                        style={{ backgroundColor: selectedTeam.color || '#000000' }}
                      ></div>
                      <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm">
                        {selectedTeam.color || '#000000'}
                      </code>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <Button
                      onClick={handleEditMode}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer team "${teamToDelete?.name}" ?`}
      />
    </div>
  );
}