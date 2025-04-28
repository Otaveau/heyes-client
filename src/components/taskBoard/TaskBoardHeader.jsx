import React from 'react';
import { Plus } from 'lucide-react';

export const TaskBoardHeader = ({ onCreateTask }) => (
  <div className="flex justify-between items-center p-4 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
      <span className="relative">
        Taskboard
        <span className="absolute -bottom-1 left-0 w-full h-1 bg-blue-500 dark:bg-blue-600 rounded-full"></span>
      </span>
    </h2>

    {onCreateTask && (
      <button
        onClick={onCreateTask}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm"
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} />
        <span>Nouvelle tâche</span>
      </button>
    )}
  </div>
);