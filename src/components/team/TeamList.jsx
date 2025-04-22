import { Loader2, Trash2 } from 'lucide-react';
import React from 'react';
import { TeamCard } from './TeamCard';


export const TeamList = ({ teams, selectedTeamId, onSelectTeam, onDeleteTeam, isLoading }) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      );
    }

    if (teams.length === 0) {
      return (
        <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-full">
              <Trash2 className="h-8 w-8 text-gray-400 dark:text-gray-300" />
            </div>
            <p className="font-medium">Aucune équipe disponible</p>
            <p className="text-sm">Utilisez le formulaire ci-dessus pour créer votre première équipe</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-1">
        {teams.map(team => (
          <TeamCard 
            key={team.team_id}
            team={team}
            isSelected={selectedTeamId === team.team_id}
            onSelect={() => onSelectTeam(team)}
            onDelete={(e) => {
              e.stopPropagation();
              onDeleteTeam(team);
            }}
          />
        ))}
      </div>
    );
  };