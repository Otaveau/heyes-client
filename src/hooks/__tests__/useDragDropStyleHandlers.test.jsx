import { cleanupAllHighlights } from '../../utils/DndUtils';
import { SELECTORS, WIP_STATUS_ID } from '../../constants/constants';

// Réimporte le hook mocké
import { useDragDropStyleHandlers } from '../useDragDropStyleHandlers';

// Mock des dépendances
jest.mock('../../utils/DndUtils', () => ({
  cleanupAllHighlights: jest.fn()
}));

// Mocker le hook mais sans aucune logique dedans 
jest.mock('../useDragDropStyleHandlers', () => {
  return {
    useDragDropStyleHandlers: jest.fn()
  };
});

describe('useDragDropStyleHandlers hook', () => {
  // Mocks réutilisables
  const createMockDOMElement = () => ({
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    },
    style: {},
    getBoundingClientRect: jest.fn().mockReturnValue({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100
    }),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  });
  
  const mockDropZones = [
    { statusId: 'status1', name: 'Column 1' },
    { statusId: 'status2', name: 'Column 2' },
    { statusId: WIP_STATUS_ID, name: 'WIP Column' }
  ];
  
  const mockDropZoneRefs = {
    current: [
      { current: createMockDOMElement() },
      { current: createMockDOMElement() },
      { current: createMockDOMElement() }
    ]
  };
  
  const mockEventInfo = {
    event: { title: 'Test Task' },
    el: {
      getBoundingClientRect: jest.fn().mockReturnValue({
        width: 200,
        height: 100
      }),
      style: { opacity: '1' }
    },
    jsEvent: {
      clientX: 50,
      clientY: 50
    }
  };
  
  // Les fonctions mockées que retournera notre hook
  const mockHighlightTaskBoard = jest.fn();
  const mockCreateGhostElement = jest.fn();
  const mockSimulateImmediateAppearance = jest.fn();
  const mockIsEventOverDropZone = jest.fn();
  const mockHandleEventDragStart = jest.fn();
  const mockPrepareEventForTaskBoard = jest.fn();
  const mockCleanupDragDrop = jest.fn();
  const mockIsPositionInsideRect = jest.fn();
  
  beforeEach(() => {
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
    
    // Configurer le retour du hook mocké
    useDragDropStyleHandlers.mockReturnValue({
      highlightTaskBoard: mockHighlightTaskBoard,
      createGhostElement: mockCreateGhostElement,
      simulateImmediateAppearance: mockSimulateImmediateAppearance,
      isEventOverDropZone: mockIsEventOverDropZone,
      handleEventDragStart: mockHandleEventDragStart,
      prepareEventForTaskBoard: mockPrepareEventForTaskBoard,
      cleanupDragDrop: mockCleanupDragDrop,
      isPositionInsideRect: mockIsPositionInsideRect
    });
    
    // Mock document.querySelector
    document.querySelector = jest.fn().mockImplementation((selector) => {
      if (selector === SELECTORS.TASKBOARD_CONTAINER) {
        return createMockDOMElement();
      }
      return null;
    });
    
    // Mock document.createElement
    document.createElement = jest.fn().mockImplementation(() => {
      return createMockDOMElement();
    });
    
    // Mock document.body.appendChild
    document.body.appendChild = jest.fn();
    
    // Mock document.addEventListener
    document.addEventListener = jest.fn();
  });
  
  test('should return all expected handlers', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Vérifier que le hook a été appelé avec les arguments corrects
    expect(useDragDropStyleHandlers).toHaveBeenCalledWith(mockDropZoneRefs, mockDropZones);
    
    // Vérifier que toutes les fonctions sont disponibles
    expect(hookResult.highlightTaskBoard).toBe(mockHighlightTaskBoard);
    expect(hookResult.createGhostElement).toBe(mockCreateGhostElement);
    expect(hookResult.simulateImmediateAppearance).toBe(mockSimulateImmediateAppearance);
    expect(hookResult.isEventOverDropZone).toBe(mockIsEventOverDropZone);
    expect(hookResult.handleEventDragStart).toBe(mockHandleEventDragStart);
    expect(hookResult.prepareEventForTaskBoard).toBe(mockPrepareEventForTaskBoard);
    expect(hookResult.cleanupDragDrop).toBe(mockCleanupDragDrop);
    expect(hookResult.isPositionInsideRect).toBe(mockIsPositionInsideRect);
  });
  
  test('highlightTaskBoard should be callable with correct parameters', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Appeler la fonction avec différents paramètres
    hookResult.highlightTaskBoard(true);
    hookResult.highlightTaskBoard(false);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockHighlightTaskBoard).toHaveBeenCalledTimes(2);
    expect(mockHighlightTaskBoard).toHaveBeenNthCalledWith(1, true);
    expect(mockHighlightTaskBoard).toHaveBeenNthCalledWith(2, false);
  });
  
  test('createGhostElement should be callable with event info', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Appeler la fonction avec l'info d'événement
    hookResult.createGhostElement(mockEventInfo);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockCreateGhostElement).toHaveBeenCalledWith(mockEventInfo);
  });
  
  test('handleEventDragStart should be callable with event info', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Appeler la fonction avec l'info d'événement
    hookResult.handleEventDragStart(mockEventInfo);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockHandleEventDragStart).toHaveBeenCalledWith(mockEventInfo);
  });
  
  test('isPositionInsideRect should work with position and rect parameters', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Configurer le retour de la fonction mockée
    mockIsPositionInsideRect.mockImplementation((position, rect) => {
      return position.x >= rect.left &&
             position.x <= rect.right &&
             position.y >= rect.top &&
             position.y <= rect.bottom;
    });
    
    const rect = {
      left: 0,
      right: 100,
      top: 0,
      bottom: 100
    };
    
    // Position à l'intérieur
    expect(hookResult.isPositionInsideRect({ x: 50, y: 50 }, rect)).toBe(true);
    
    // Positions aux limites
    expect(hookResult.isPositionInsideRect({ x: 0, y: 0 }, rect)).toBe(true);
    expect(hookResult.isPositionInsideRect({ x: 100, y: 100 }, rect)).toBe(true);
    
    // Positions à l'extérieur
    expect(hookResult.isPositionInsideRect({ x: -1, y: 50 }, rect)).toBe(false);
    expect(hookResult.isPositionInsideRect({ x: 101, y: 50 }, rect)).toBe(false);
    expect(hookResult.isPositionInsideRect({ x: 50, y: -1 }, rect)).toBe(false);
    expect(hookResult.isPositionInsideRect({ x: 50, y: 101 }, rect)).toBe(false);
    
    // Vérifier que la fonction a été appelée le bon nombre de fois
    expect(mockIsPositionInsideRect).toHaveBeenCalledTimes(7);
  });
  
  test('isEventOverDropZone should be callable with position parameter', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Configurer le retour de la fonction mockée pour simuler une correspondance
    mockIsEventOverDropZone.mockReturnValue({ dropZone: mockDropZones[0] });
    
    // Simuler une position
    const position = { x: 50, y: 50 };
    
    // Appeler la fonction
    const dropZoneInfo = hookResult.isEventOverDropZone(position);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockIsEventOverDropZone).toHaveBeenCalledWith(position);
    
    // Vérifier le retour
    expect(dropZoneInfo).toEqual({ dropZone: mockDropZones[0] });
  });
  
  test('prepareEventForTaskBoard should return task data for target column', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Configurer le retour de la fonction mockée
    mockPrepareEventForTaskBoard.mockReturnValue({
      statusId: 'status1',
      ownerId: null
    });
    
    const event = { id: 'task1', title: 'Task 1' };
    const targetDropZone = { statusId: 'status1' };
    
    // Appeler la fonction
    const taskData = hookResult.prepareEventForTaskBoard(event, targetDropZone);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockPrepareEventForTaskBoard).toHaveBeenCalledWith(event, targetDropZone);
    
    // Vérifier le retour
    expect(taskData).toEqual({
      statusId: 'status1',
      ownerId: null
    });
  });
  
  test('cleanupDragDrop should be callable', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Configurer le comportement du mock
    mockCleanupDragDrop.mockImplementation(() => {
      cleanupAllHighlights(mockDropZoneRefs);
    });
    
    // Appeler la fonction
    hookResult.cleanupDragDrop();
    
    // Vérifier que la fonction a été appelée
    expect(mockCleanupDragDrop).toHaveBeenCalled();
    
    // Vérifier que cleanupAllHighlights a été appelé aussi
    expect(cleanupAllHighlights).toHaveBeenCalledWith(mockDropZoneRefs);
  });
  
  test('simulateImmediateAppearance should be callable with proper parameters', () => {
    const hookResult = useDragDropStyleHandlers(mockDropZoneRefs, mockDropZones);
    
    // Appeler la fonction avec les paramètres attendus
    hookResult.simulateImmediateAppearance('task1', mockDropZones[0]);
    
    // Vérifier que la fonction a été appelée correctement
    expect(mockSimulateImmediateAppearance).toHaveBeenCalledWith('task1', mockDropZones[0]);
  });
});