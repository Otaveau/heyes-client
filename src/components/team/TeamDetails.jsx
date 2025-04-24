import { Save } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../context/ThemeContext';

export const TeamDetails = ({ team, onEdit }) => {
    const { darkMode } = useTheme();
    const teamColor = team?.color || (darkMode ? '#3B82F6' : '#000000');

    return (
      <div className="space-y-5">
        <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</p>
          <div className="flex items-center mt-1">
            <div 
              className="w-4 h-4 rounded-full mr-2"
              style={{ backgroundColor: teamColor }}
            ></div>
            <p className="font-medium text-lg text-gray-800 dark:text-gray-100">{team.name}</p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-600 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Couleur équipe</p>
          <div className="flex items-center mt-2">
            <div 
              className="w-6 h-6 rounded mr-3 border border-gray-300 dark:border-gray-500"
              style={{ backgroundColor: teamColor }}
            ></div>
            <code className="bg-white dark:bg-gray-700 px-2 py-1 rounded text-sm text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
              {teamColor}
            </code>
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
    );
  };