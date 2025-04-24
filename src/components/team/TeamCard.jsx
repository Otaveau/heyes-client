import { Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useTheme } from '../../context/ThemeContext';

export const TeamCard = ({ team, isSelected, onSelect, onDelete }) => {
    const { darkMode } = useTheme();
    const teamColor = team.color || (darkMode ? '#3B82F6' : '#000000');

    return (
      <Card
        className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/30 overflow-hidden ${
          isSelected ? 'shadow-md dark:shadow-lg dark:shadow-gray-900/30 ring-2 ring-blue-500 dark:ring-blue-600' : ''
        } bg-white dark:bg-gray-700`}
        onClick={onSelect}
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
                <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{team.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
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
  };