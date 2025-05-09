import { Loader2, Plus } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useTheme } from '../../context/ThemeContext';

export const TeamAddForm = ({ onSubmit, isSubmitting, error }) => {
  const { darkMode } = useTheme();
  const [team, setTeam] = useState({ name: '', color: darkMode ? '#3B82F6' : '#000000' });

  const handleChange = useCallback((e) => {
    setTeam(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!team.name.trim()) return;

    onSubmit(team).then(() => {
      setTeam({ name: '', color: darkMode ? '#3B82F6' : '#000000' });
    });
  }, [team, onSubmit, darkMode]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center">
      <div className="flex gap-4 w-full max-w-md">
        <div className="flex-grow">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Nom de l'équipe
          </label>
          <Input
            type="text"
            value={team.name}
            onChange={handleChange}
            placeholder="Nom de l'équipe"
            className="w-full border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="self-end">
          <Button
            type="submit"
            disabled={isSubmitting || !team.name.trim()}
            className="bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white py-2 px-4 rounded-md shadow-sm transition-all duration-200 font-medium h-10 disabled:opacity-50 disabled:cursor-not-allowed"
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
      {error && <p className="mt-3 text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>}
    </form>
  );
};