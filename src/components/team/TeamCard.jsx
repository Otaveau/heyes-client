import { Trash2 } from 'lucide-react';
import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export const TeamCard = ({ team, isSelected, onSelect, onDelete }) => {
    const teamColor = team.color || '#000000';

    return (
      <Card
        className={`p-0 cursor-pointer transition-all duration-200 hover:shadow-md overflow-hidden ${
          isSelected ? 'shadow-md' : ''
        }`}
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
                <h3 className="font-semibold text-lg">{team.name}</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };