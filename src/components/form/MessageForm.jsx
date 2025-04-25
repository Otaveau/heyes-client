import { AlertTriangle, Trash2 } from 'lucide-react';

// Composant pour l'affichage des messages d'erreur
export const ErrorMessage = ({ message }) => (
    message ? <p className="text-red-500 dark:text-red-400 text-xs italic mt-1">{message}</p> : null
  );
  
// Composant pour l'affichage d'un avertissement
export const WarningMessage = ({ message }) => (
    message ? (
      <p className="text-amber-500 dark:text-amber-400 text-xs italic mt-1 flex items-center">
        <AlertTriangle size={12} className="mr-1" />
        {message}
      </p>
    ) : null
  );

// Modal de confirmation de suppression
export const DeleteConfirmationModal = ({ formData, isSubmitting, onCancel, onConfirm }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
    <div 
      className="bg-red-50 dark:bg-red-900 border-2 border-red-200 dark:border-red-800 rounded-lg shadow-2xl max-w-md mx-auto p-6 w-11/12 sm:w-96 transform translate-y-0 scale-100 transition-all duration-200 animate-fadeIn"
      style={{ 
        boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5), 0 8px 10px -6px rgba(220, 38, 38, 0.2)'
      }}
    >
      <div className="text-center mb-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-800 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Confirmer la suppression</h3>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-md p-4 mb-4 border border-red-100 dark:border-red-800">
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
          Vous êtes sur le point de supprimer :
        </p>
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          "{formData.title}"
        </p>
      </div>
      
      <p className="text-sm text-red-600 dark:text-red-400 mb-5 font-medium flex items-center justify-center">
        <AlertTriangle className="h-4 w-4 mr-1" />
        Cette action est irréversible
      </p>
      
      <div className="flex space-x-3 justify-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-colors w-1/2 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-red-600 transition-colors w-1/2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Suppression...
            </span>
          ) : (
            <span className="flex items-center">
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </span>
          )}
        </button>
      </div>
    </div>
  </div>
);