import React, { useState, useEffect, useCallback} from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {  Plus, Loader2, Save, X } from 'lucide-react';
import { getContrastTextColor } from '../../utils/ColorUtils';

export const OwnerForm = ({ 
    owner, 
    teams, 
    isSubmitting, 
    error, 
    onSubmit, 
    onCancel, 
    mode = 'create' 
  }) => {
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
    const buttonColor = isCreateMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700';
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
              className="w-full border-gray-300 focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white dark:border-gray-500"
              required
              disabled={isSubmitting}
            >
              <option value="">Sélectionner une team</option>
              {teams.map(team => {
                const teamId = team.team_id || team.id;
                const teamColor = team.color || '#9CA3AF';
                
                return (
                  <option 
                    key={`${mode}-${teamId}`} 
                    value={teamId}
                    style={
                      mode === 'edit' 
                        ? { backgroundColor: teamColor, color: getContrastTextColor(teamColor) } 
                        : {}
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
              className="border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 px-4 py-2 rounded-md"
            >
              <X className="mr-2 h-4 w-4" />
              Annuler
            </Button>
          )}
          
          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className={`${buttonColor} text-white py-2 px-6 rounded-md shadow-sm transition-all duration-200 font-medium`}
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
        
        {error && <p className="mt-3 text-red-500 text-sm font-medium">{error}</p>}
      </form>
    );
  };