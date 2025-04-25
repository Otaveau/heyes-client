import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Save } from 'lucide-react';
import { OwnerForm } from './OwnerForm';
import { useTheme } from '../../context/ThemeContext';

export const OwnerDetails = ({ 
    owner, 
    teams, 
    isEditing, 
    isSubmitting, 
    error, 
    onEdit, 
    onSave, 
    onCancelEdit 
  }) => {
    const { darkMode } = useTheme();
    
    // Fonction pour obtenir la couleur de la team
    const getTeamColorById = useCallback((teamId) => {
      if (!teamId) return darkMode ? '#6B7280' : '#9CA3AF';
      
      const parsedTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
      
      const team = teams.find(t => {
        const currentTeamId = t.team_id !== undefined ? t.team_id : t.id;
        return currentTeamId === parsedTeamId;
      });
      
      return team && team.color ? team.color : darkMode ? '#6B7280' : '#9CA3AF';
    }, [teams, darkMode]);
  
    // Fonction pour obtenir le nom de la team
    const getTeamNameById = useCallback((teamId) => {
      if (!teamId) return 'N/A';
  
      const parsedTeamId = typeof teamId === 'string' ? parseInt(teamId, 10) : teamId;
  
      const team = teams.find(t => {
        const currentTeamId = t.team_id !== undefined ? t.team_id : t.id;
        return currentTeamId === parsedTeamId;
      });
  
      return team ? team.name : 'N/A';
    }, [teams]);
  
    const teamColor = getTeamColorById(owner.teamId || owner.team_id);
  
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Détails du owner</h3>
        <Card className="p-6 shadow-md bg-white dark:bg-gray-700 overflow-hidden">
          {/* Bande de couleur en haut de la carte */}
          <div 
            className="h-2 -mx-6 -mt-6 mb-5"
            style={{ backgroundColor: teamColor }}
          ></div>
          
          {isEditing ? (
            <OwnerForm 
              owner={owner} 
              teams={teams} 
              isSubmitting={isSubmitting} 
              error={error}
              onSubmit={onSave}
              onCancel={onCancelEdit}
              mode="edit"
            />
          ) : (
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
                <p className="font-medium text-lg mt-1 text-gray-800 dark:text-gray-100">{owner.name}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team</p>
                <div className="flex items-center mt-1">
                  <div 
                    className="w-4 h-4 rounded-full mr-2"
                    style={{ backgroundColor: teamColor }}
                  ></div>
                  <p className="font-medium text-lg text-gray-800 dark:text-gray-100">
                    {owner.teamName || getTeamNameById(owner.teamId || owner.team_id)}
                  </p>
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                <Button
                  onClick={onEdit}
                  className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 px-4 transition-colors"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  };