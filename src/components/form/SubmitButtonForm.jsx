import { Save } from 'lucide-react';

// Bouton de soumission avec état de chargement
export const SubmitButton = ({ isSubmitting, isEditMode }) => (
    <button
      type="submit"
      disabled={isSubmitting}
      className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
    >
      {isSubmitting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          En cours...
        </>
      ) : (
        <>
          <Save size={16} className="mr-1.5" />
          {isEditMode ? 'Enregistrer' : 'Créer'}
        </>
      )}
    </button>
  );