import React, { useState, useEffect, useCallback} from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Loader2, Save, X } from 'lucide-react';
import { getContrastTextColor } from '../../utils/ColorUtils';
import { useTheme } from '../../context/ThemeContext';

export const OwnerForm = ({ 
    owner, 
    teams, 
    isSubmitting, 
    error, 
    onSubmit, 
    onCancel, 
    mode = 'create' 
  }) => {
    const { darkMode } = useTheme();
    
    const [formData, setFormData] = useState({
      name: owner?.name || '',
      teamId: owner?.teamId?.toString() || owner?.team_id?.toString() || ''
    });
  
    useEffect(() => {
      if (owner) {
        setFormData({
          name: owner.name || '',
          teamId: (owner.teamId || owner.team_id || '').toString()
        });
      }
    }, [owner]);
  
    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    }, []);
  
    const handleSubmit = useCallback((e) => {
      e.preventDefault();
      onSubmit(formData);
    }, [formData, onSubmit]);
  
    const isCreateMode = mode === 'create';
    const buttonLabel = isCreateMode ? 'Ajouter un owner' : 'Enregistrer';
    const buttonIcon = isCreateMode ? <Plus className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-4 w-4" />;
    
    // Ajout des classes dark pour les boutons
    const buttonColor = isCreateMode 
      ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800' 
      : 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800';
      
    const isFormValid = formData.name.trim() && formData.teamId;
  
    return (
      <form onSubmit={handleSubmit} className={isCreateMode ? "flex flex-col items-center" : "space-y-5"}>
        <div className={isCreateMode ? "grid gap-4 md:grid-cols-2 w-full" : "space-y-5"}>
          <div className="space-y-1">
            <label htmlFor={`owner-name-${mode}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom
            </label>
            <Input
              id={`owner-name-${mode}`}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nom du owner"
              required
              disabled={isSubmitting}
              className="w-full border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`owner-team-${mode}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Team
            </label>
            <select
              id={`owner-team-${mode}`}
              name="teamId"
              value={formData.teamId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:focus:ring-blue-600"
              required
              disabled={isSubmitting}
            >
              <option value="" className={darkMode ? "bg-gray-700 text-white" : ""}>Sélectionner une team</option>
              {teams.map(team => {
                const teamId = team.team_id || team.id;
                const teamColor = team.color || '#9CA3AF';
                
                // Ajuster la couleur de fond pour le mode sombre
                const bgColor = darkMode && mode === 'edit' ? 
                  `${teamColor}80` : // Ajouter de la transparence en mode sombre
                  teamColor;
                
                return (
                  <option 
                    key={`${mode}-${teamId}`} 
                    value={teamId}
                    style={
                      mode === 'edit' 
                        ? { backgroundColor: bgColor, color: getContrastTextColor(teamColor) } 
                        : darkMode ? { backgroundColor: "#374151", color: "#ffffff" } : {}
                    }
                  >
                    {team.name}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        
        <div className={isCreateMode ? "mt-6" : "flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-600"}>
          {!isCreateMode && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors duration-200 px-4 py-2 rounded-md"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className={`${buttonColor} text-white py-2 px-6 rounded-md shadow-sm transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isCreateMode ? 'Ajout en cours...' : 'Enregistrement...'}
              </>
            ) : (
              <>
                {buttonIcon}
                {buttonLabel}
              </>
            )}
          </Button>
        </div>
        
        {error && <p className="mt-3 text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>}
      </form>
    );
  };