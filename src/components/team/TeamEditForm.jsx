import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, Save, X, Palette } from 'lucide-react';
import { TeamColorPicker } from './TeamColorPicker';
import { useTheme } from '../../context/ThemeContext';

export const TeamEditForm = ({ team, onSave, onCancel, isSubmitting }) => {
  const { darkMode } = useTheme();
  
  // État local pour l'équipe en cours d'édition
  const [editedTeam, setEditedTeam] = useState({ 
    ...team,
    name: team?.name || '',
    color: team?.color || (darkMode ? '#3B82F6' : '#000000')
  });

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerButtonRef = useRef(null);

  // Mise à jour de l'état local quand team change
  useEffect(() => {
    if (team) {
      setEditedTeam({
        ...team,
        name: team.name || '',
        color: team.color || (darkMode ? '#3B82F6' : '#000000')
      });
    }
  }, [team, darkMode]);

  const handleNameChange = useCallback((e) => {
    const { value } = e.target;
    setEditedTeam(prev => ({ ...prev, name: value }));
  }, []);

  const handleColorChange = useCallback((color) => {
    console.log('Nouvelle couleur sélectionnée:', color);
    setEditedTeam(prev => ({ ...prev, color }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!editedTeam.name.trim()) return;
    onSave(editedTeam);
  }, [editedTeam, onSave]);

  const toggleColorPicker = useCallback(() => {
    setColorPickerOpen(prev => !prev);
  }, []);

  const closeColorPicker = useCallback(() => {
    setColorPickerOpen(false);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nom de l'équipe
        </label>
        <Input
          id="teamName"
          type="text"
          value={editedTeam.name}
          onChange={handleNameChange}
          placeholder="Nom de l'équipe"
          required
          disabled={isSubmitting}
          className="w-full border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="teamColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Couleur de l'équipe
        </label>
        <div>
          {/* Bouton pour ouvrir le sélecteur de couleur */}
          <button
            id="teamColor"
            type="button"
            ref={colorPickerButtonRef}
            onClick={toggleColorPicker}
            className="flex items-center space-x-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <div 
              className="w-6 h-6 rounded border border-gray-200 dark:border-gray-500"
              style={{ backgroundColor: editedTeam.color || (darkMode ? '#3B82F6' : '#000000') }}
            ></div>
            <span className="text-sm font-medium">{editedTeam.color || (darkMode ? '#3B82F6' : '#000000')}</span>
            <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Portail pour le sélecteur de couleur */}
          <TeamColorPicker
            isOpen={colorPickerOpen}
            initialColor={editedTeam.color}
            onColorChange={handleColorChange}
            onClose={closeColorPicker}
            referenceElement={colorPickerButtonRef}
          />
        </div>
      </div>

      <div className="pt-3 flex items-center gap-2">
        <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Couleur équipe: 
          <span 
            className="inline-block w-4 h-4 ml-2 rounded-full align-middle border border-gray-200 dark:border-gray-500"
            style={{ backgroundColor: editedTeam.color || (darkMode ? '#3B82F6' : '#000000') }}
          ></span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          (Cette couleur est utilisée pour toutes les tâches de l'équipe)
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200 px-4 py-2 rounded-md"
        >
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !editedTeam.name.trim()}
          className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white transition-colors duration-200 px-4 py-2 rounded-md shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
};