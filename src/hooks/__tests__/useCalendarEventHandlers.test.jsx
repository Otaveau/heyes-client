import { renderHook } from '@testing-library/react';
import { useCalendarEventHandlers } from '../useCalendarEventHandlers';
import { toast } from 'react-toastify';
import { hasValidEventBoundaries } from '../../utils/DateUtils';
import { ONE_DAY_MS, TOAST_CONFIG } from '../../constants/constants';

// Mock des dépendances
jest.mock('react-toastify', () => ({
  toast: {
    warning: jest.fn(),
    error: jest.fn(),
    success: jest.fn()
  }
}));

jest.mock('../../utils/DateUtils', () => ({
  hasValidEventBoundaries: jest.fn()
}));

describe('useCalendarEventHandlers hook', () => {
  // Variables de test réutilisables
  const mockSetCalendarState = jest.fn();
  const mockHandleTaskUpdate = jest.fn();
  
  const mockTasks = [
    {
      id: '1',
      title: 'Tâche 1',
      start: new Date('2023-05-01'),
      end: new Date('2023-05-03'),
      resourceId: 'resource1',
      extendedProps: {
        statusId: 'status1',
        description: 'Description de la tâche 1'
      }
    },
    {
      id: '2',
      title: 'Tâche 2',
      start: new Date('2023-05-05'),
      end: new Date('2023-05-07'),
      resourceId: 'resource2',
      extendedProps: {
        statusId: 'status2',
        description: 'Description de la tâche 2'
      }
    }
  ];
  
  const mockHolidays = [
    { date: '2023-05-01', name: 'Fête du Travail' },
    { date: '2023-05-08', name: 'Victoire 1945' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    hasValidEventBoundaries.mockReturnValue(true);
  });

  test('handleTaskSelection devrait mettre à jour l\'état du calendrier avec la tâche sélectionnée', () => {
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const taskToSelect = mockTasks[0];
    
    result.current.handleTaskSelection(taskToSelect);
    
    expect(mockSetCalendarState).toHaveBeenCalledTimes(1);
    expect(mockSetCalendarState).toHaveBeenCalledWith(expect.any(Function));
    
    // Vérifier que la fonction de mise à jour est correcte
    const setStateFn = mockSetCalendarState.mock.calls[0][0];
    const newState = setStateFn({ someOtherState: true });
    
    expect(newState).toEqual({
      someOtherState: true,
      selectedTask: taskToSelect,
      selectedDates: {
        start: taskToSelect.start,
        end: taskToSelect.end,
        resourceId: taskToSelect.resourceId
      },
      isFormOpen: true,
    });
  });

  test('handleTaskSelection ne devrait rien faire si la tâche est invalide', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    // Tâche invalide (sans ID)
    result.current.handleTaskSelection({});
    
    expect(mockSetCalendarState).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('handleCalendarEventClick devrait sélectionner la tâche correspondante', () => {
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockClickInfo = {
      event: {
        id: '1',
        title: 'Tâche 1'
      }
    };
    
    result.current.handleCalendarEventClick(mockClickInfo);
    
    expect(mockSetCalendarState).toHaveBeenCalledTimes(1);
  });

  test('handleCalendarEventClick devrait afficher un avertissement si la tâche n\'est pas trouvée', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockClickInfo = {
      event: {
        id: '999', // ID qui n'existe pas
        title: 'Tâche inexistante'
      }
    };
    
    result.current.handleCalendarEventClick(mockClickInfo);
    
    expect(mockSetCalendarState).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('handleDateClick devrait ouvrir le formulaire avec les dates sélectionnées', () => {
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockDate = new Date('2023-05-15');
    const mockResource = { id: 'resource3' };
    
    const mockSelectInfo = {
      start: mockDate,
      resource: mockResource,
      view: {
        calendar: {
          unselect: jest.fn()
        }
      }
    };
    
    result.current.handleDateClick(mockSelectInfo);
    
    expect(mockSetCalendarState).toHaveBeenCalledTimes(1);
    
    // Vérifier que la fonction de mise à jour est correcte
    const setStateFn = mockSetCalendarState.mock.calls[0][0];
    const newState = setStateFn({ someOtherState: true });
    
    expect(newState).toEqual({
      someOtherState: true,
      selectedDates: {
        start: mockDate,
        end: mockDate,
        resourceId: 'resource3',
      },
      isFormOpen: true,
    });
    
    expect(mockSelectInfo.view.calendar.unselect).toHaveBeenCalledTimes(1);
  });

  test('handleEventDrop devrait mettre à jour la tâche avec succès', async () => {
    // Configuration du test
    hasValidEventBoundaries.mockReturnValue(true);
    mockHandleTaskUpdate.mockResolvedValue(true);
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    const mockEndDate = new Date('2023-05-12');
    
    const mockDropInfo = {
      event: {
        id: '1',
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
        _def: {
          extendedProps: {
            statusId: 'status1'
          },
          resourceIds: ['resource1']
        }
      },
      revert: jest.fn()
    };
    
    await result.current.handleEventDrop(mockDropInfo);
    
    // Vérifier que la fonction de mise à jour de tâche a été appelée
    expect(mockHandleTaskUpdate).toHaveBeenCalledTimes(1);
    expect(mockHandleTaskUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
        resourceId: 'resource1',
        statusId: 'status1',
      }),
      expect.objectContaining({
        revertFunction: mockDropInfo.revert,
        successMessage: 'Tâche "Tâche 1" déplacée'
      })
    );
    
    // Vérifier que revert n'a pas été appelé (succès)
    expect(mockDropInfo.revert).not.toHaveBeenCalled();
  });

  test('handleEventDrop devrait annuler le changement si les dates sont invalides', async () => {
    // Configuration du test avec dates invalides
    hasValidEventBoundaries.mockReturnValue(false);
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    const mockEndDate = new Date('2023-05-12');
    
    const mockDropInfo = {
      event: {
        id: '1',
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
        _def: {
          extendedProps: {
            statusId: 'status1'
          },
          resourceIds: ['resource1']
        }
      },
      revert: jest.fn()
    };
    
    await result.current.handleEventDrop(mockDropInfo);
    
    // Vérifier que la mise à jour n'a pas été appelée
    expect(mockHandleTaskUpdate).not.toHaveBeenCalled();
    
    // Vérifier que revert a été appelé (annulation)
    expect(mockDropInfo.revert).toHaveBeenCalledTimes(1);
    
    // Vérifier que le toast d'avertissement a été affiché
    expect(toast.warning).toHaveBeenCalledWith(
      'Les dates de début et de fin doivent être des jours ouvrés',
      TOAST_CONFIG
    );
  });

  test('handleEventDrop devrait gérer les erreurs', async () => {
    // Configuration du test avec une erreur
    hasValidEventBoundaries.mockReturnValue(true);
    mockHandleTaskUpdate.mockRejectedValue(new Error('Erreur de mise à jour'));
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    const mockEndDate = new Date('2023-05-12');
    
    const mockDropInfo = {
      event: {
        id: '1',
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
        _def: {
          extendedProps: {
            statusId: 'status1'
          },
          resourceIds: ['resource1']
        }
      },
      revert: jest.fn()
    };
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await result.current.handleEventDrop(mockDropInfo);
    
    // Vérifier que revert a été appelé (annulation)
    expect(mockDropInfo.revert).toHaveBeenCalledTimes(1);
    
    // Vérifier que le toast d'erreur a été affiché
    expect(toast.error).toHaveBeenCalledWith(
      'Une erreur est survenue lors de la mise à jour de la tâche',
      TOAST_CONFIG
    );
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('handleEventResize devrait mettre à jour la tâche avec succès', async () => {
    // Configuration du test
    hasValidEventBoundaries.mockReturnValue(true);
    mockHandleTaskUpdate.mockResolvedValue(true);
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    const mockEndDate = new Date('2023-05-15'); // Date étendue
    
    const mockResizeInfo = {
      event: {
        id: '1',
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
        _def: {
          extendedProps: {
            statusId: 'status1'
          },
          resourceIds: ['resource1']
        }
      },
      revert: jest.fn()
    };
    
    await result.current.handleEventResize(mockResizeInfo);
    
    // Vérifier que la fonction de mise à jour de tâche a été appelée
    expect(mockHandleTaskUpdate).toHaveBeenCalledTimes(1);
    expect(mockHandleTaskUpdate).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        title: 'Tâche 1',
        start: mockStartDate,
        end: mockEndDate,
      }),
      expect.objectContaining({
        revertFunction: mockResizeInfo.revert,
        successMessage: 'Tâche "Tâche 1" redimensionnée'
      })
    );
    
    // Vérifier que revert n'a pas été appelé (succès)
    expect(mockResizeInfo.revert).not.toHaveBeenCalled();
  });

  test('prepareTaskUpdates devrait gérer correctement une tâche sans date de fin', async () => {
    // Configuration du test
    hasValidEventBoundaries.mockReturnValue(true);
    mockHandleTaskUpdate.mockResolvedValue(true);
    
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    
    // Pas de date de fin fournie
    const mockEvent = {
      id: '1',
      title: 'Tâche sans date de fin',
      start: mockStartDate,
      end: null, // Pas de date de fin
      _def: {
        extendedProps: {
          statusId: 'status1'
        },
        resourceIds: ['resource1']
      }
    };
    
    const mockDropInfo = {
      event: mockEvent,
      revert: jest.fn()
    };
    
    // Appeler handleEventDrop qui utilise prepareTaskUpdates en interne
    await result.current.handleEventDrop(mockDropInfo);
    
    // Vérifier les appels à handleTaskUpdate
    expect(mockHandleTaskUpdate).toHaveBeenCalledTimes(1);
    
    // Extraire les arguments passés à handleTaskUpdate
    const updateArgs = mockHandleTaskUpdate.mock.calls[0];
    const updatedTaskId = updateArgs[0];
    const updates = updateArgs[1];
    
    // Vérifications
    expect(updatedTaskId).toBe('1');
    expect(updates).toBeDefined();
    
    // Vérifier que la date de fin a été calculée correctement (start + 1 jour)
    const expectedEndDate = new Date(mockStartDate.getTime() + ONE_DAY_MS);
    
    // Comparer seulement les dates sans l'heure pour éviter les problèmes de fuseau horaire
    const updatedEndDateStr = new Date(updates.end).toISOString().split('T')[0];
    const expectedEndDateStr = expectedEndDate.toISOString().split('T')[0];
    
    expect(updatedEndDateStr).toEqual(expectedEndDateStr);
  });

  test('handleEventResize devrait annuler le redimensionnement si la tâche n\'est pas trouvée', async () => {
    const { result } = renderHook(() => useCalendarEventHandlers(
      mockSetCalendarState,
      mockTasks,
      mockHandleTaskUpdate,
      mockHolidays
    ));

    const mockStartDate = new Date('2023-05-10');
    const mockEndDate = new Date('2023-05-15');
    
    const mockResizeInfo = {
      event: {
        id: '999', // ID qui n'existe pas
        title: 'Tâche inexistante',
        start: mockStartDate,
        end: mockEndDate,
      },
      revert: jest.fn()
    };
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    await result.current.handleEventResize(mockResizeInfo);
    
    // Vérifier que revert a été appelé
    expect(mockResizeInfo.revert).toHaveBeenCalledTimes(1);
    
    // Vérifier que l'avertissement a été journalisé
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});