import React, { useCallback} from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Trash2, Loader2, } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const OwnerList = ({ 
    owners, 
    teams, 
    isLoading, 
    selectedOwnerId, 
    onSelect, 
    onDelete 
  }) => {
    const { darkMode } = useTheme();

    // Fonction pour obtenir la couleur de la team
    const getTeamColorById = useCallback((teamId) => {
      if (!teamId) return darkMode ? '#6B7280' : '#9CA3AF'; // Couleur grise adaptative
      
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
  
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 dark:text-blue-400" />
        </div>
      );
    }
  
    if (owners.length === 0) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full">
              <Trash2 className="h-8 w-8 text-gray-400 dark:text-gray-300" />
            </div>
            <p className="font-medium">Aucun owner disponible</p>
            <p className="text-sm">Utilisez le formulaire ci-dessus pour créer votre premier owner</p>
          </div>
        </div>
      );
    }
  
    return (
      <div className="grid gap-4 sm:grid-cols-1">
        {owners.map(owner => {
          const ownerId = owner.id || owner.owner_id || owner.ownerId;
          const teamId = owner.teamId || owner.team_id;
          const teamColor = getTeamColorById(teamId);
          const isSelected = ownerId === selectedOwnerId;
          
          return (
            <Card
              key={ownerId}
              className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/30 overflow-hidden ${
                isSelected ? 'shadow-md dark:shadow-lg dark:shadow-gray-900/30 ring-2 ring-blue-500 dark:ring-blue-600' : ''
              } bg-white dark:bg-gray-700`}
              onClick={() => onSelect(owner)}
            >
              <div className="flex">
                {/* Bande de couleur de team */}
                <div 
                  className="w-2"
                  style={{ backgroundColor: teamColor }}
                ></div>
                
                <div className="flex-1 p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{owner.name}</h3>
                      <div className="mt-2 flex items-center">
                        {/* Pastille de couleur de team */}
                        <div 
                          className="w-3 h-3 rounded-full mr-1"
                          style={{ backgroundColor: teamColor }}
                        ></div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {owner.teamName || getTeamNameById(teamId)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(owner);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 rounded-full"
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
    );
  };