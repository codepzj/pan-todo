# Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Create Electron + React + TypeScript project with Vite
  - Install core dependencies: electron, react, react-dom, typescript
  - Install UI dependencies: @radix-ui/react-*, tailwindcss, class-variance-authority
  - Install drag-and-drop: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
  - Install state management: zustand
  - Install testing: vitest, @testing-library/react, @testing-library/user-event, fast-check
  - Configure TypeScript, Tailwind CSS, and Vite for Electron
  - Set up project directory structure (electron/, src/, tests/)
  - _Requirements: 8.2, 8.3_

- [x] 2. Implement core data types and storage module
  - [x] 2.1 Create TypeScript interfaces for TodoItem and QuadrantType
    - Define TodoItem interface with id, title, description, quadrant, timestamps
    - Define QuadrantType union type for four quadrants
    - Define StorageData interface for file format
    - _Requirements: 8.3_
  
  - [x] 2.2 Implement file-based storage module in main process
    - Create storage.ts with functions to read/write todos.json
    - Implement getStoragePath() to determine platform-specific storage location
    - Implement loadTodos() to read and parse JSON file
    - Implement saveTodos() to write JSON file with error handling
    - Handle file not found, parse errors, and write errors gracefully
    - _Requirements: 5.4, 5.5_
  
  - [x] 2.3 Write property test for storage round-trip
    - **Feature: eisenhower-matrix-todo, Property 8: Storage round-trip preserves data**
    - **Validates: Requirements 5.4**
    - Generate random sets of todos using fast-check
    - Save to storage, load back, verify all properties preserved
    - Run 100 iterations

- [x] 3. Set up Electron main process and IPC
  - [x] 3.1 Create main process entry point
    - Implement main.ts with window creation
    - Configure BrowserWindow with security settings (contextIsolation, nodeIntegration disabled)
    - Set up window state persistence (position, size)
    - Implement system tray integration
    - Handle window close to minimize to tray instead of quit
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 3.2 Implement preload script for IPC bridge
    - Create preload.ts to expose safe IPC APIs to renderer
    - Implement contextBridge API for todos operations
    - Implement contextBridge API for window operations
    - _Requirements: 8.1_
  
  - [x] 3.3 Implement IPC handlers in main process
    - Register handler for 'todos:load' to load from storage
    - Register handler for 'todos:save' to save to storage
    - Register handler for 'todos:create' to create new todo with UUID
    - Register handler for 'todos:update' to update existing todo
    - Register handler for 'todos:delete' to delete todo
    - Register handlers for 'window:minimize' and 'window:close'
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 3.4 Write property test for window state persistence
    - **Feature: eisenhower-matrix-todo, Property 11: Window state persistence**
    - **Validates: Requirements 9.5**
    - Generate random window positions and sizes
    - Set window state, close, reopen, verify restoration
    - Run 100 iterations

- [x] 4. Set up shadcn/ui components and base UI
  - [x] 4.1 Initialize shadcn/ui configuration
    - Run shadcn/ui init to set up components directory
    - Install base components: button, card, input, textarea, dialog
    - Configure Tailwind with shadcn/ui theme
    - _Requirements: 1.3_
  
  - [x] 4.2 Create base layout and styling
    - Implement App.tsx with 2x2 grid layout
    - Set up global styles with minimalist color scheme
    - Configure typography and spacing variables
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Implement state management with Zustand
  - [x] 5.1 Create todo store with Zustand
    - Implement useTodoStore hook with todos state
    - Implement loadTodos action to fetch from IPC
    - Implement addTodo action to create via IPC
    - Implement updateTodo action to update via IPC
    - Implement deleteTodo action to delete via IPC
    - Implement moveTodo action to change quadrant via IPC
    - Implement getTodosByQuadrant selector
    - _Requirements: 2.1, 6.1, 7.3_
  
  - [x] 5.2 Write property test for state changes persist immediately
    - **Feature: eisenhower-matrix-todo, Property 7: State changes persist immediately**
    - **Validates: Requirements 5.1, 5.2, 5.3, 7.5**
    - Generate random state-changing operations (create, update, delete, move)
    - Execute operation, verify storage updated immediately
    - Run 100 iterations

- [x] 6. Implement TodoCard component
  - [x] 6.1 Create TodoCard component with display mode
    - Implement card layout with title and optional description
    - Add edit and delete buttons
    - Style with shadcn/ui Card component
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.2 Add edit mode to TodoCard
    - Implement inline editing with input fields
    - Add save and cancel buttons
    - Validate title is non-empty before saving
    - Call updateTodo on save
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 6.3 Implement delete functionality
    - Add delete button with icon
    - Call deleteTodo on click without confirmation
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [x] 6.4 Write property test for todo card displays title
    - **Feature: eisenhower-matrix-todo, Property 3: Todo card displays title**
    - **Validates: Requirements 3.2**
    - Generate random todos
    - Render TodoCard, verify title appears in output
    - Run 100 iterations
  
  - [x] 6.5 Write property test for description display conditional
    - **Feature: eisenhower-matrix-todo, Property 4: Description display conditional**
    - **Validates: Requirements 3.3, 3.4**
    - Generate todos with and without descriptions
    - Render TodoCard, verify description presence matches data
    - Run 100 iterations
  
  - [x] 6.6 Write property test for delete removes todo
    - **Feature: eisenhower-matrix-todo, Property 9: Delete removes todo**
    - **Validates: Requirements 6.1, 6.2**
    - Generate random todos in random quadrants
    - Delete todo, verify it no longer appears in state
    - Run 100 iterations
  
  - [x] 6.7 Write property test for edit updates todo fields
    - **Feature: eisenhower-matrix-todo, Property 10: Edit updates todo fields**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Generate random todos and random valid updates
    - Edit todo, verify updates reflected in state and display
    - Run 100 iterations

- [x] 7. Implement TodoForm component
  - [x] 7.1 Create TodoForm for adding new todos
    - Implement form with title input (required) and description textarea (optional)
    - Add submit and cancel buttons
    - Validate title is non-empty
    - Clear form after successful submission
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 7.2 Write property test for empty title validation
    - **Feature: eisenhower-matrix-todo, Property 2: Empty title validation**
    - **Validates: Requirements 2.4, 7.4**
    - Generate whitespace-only and empty strings
    - Attempt to create/update todo, verify rejection and state unchanged
    - Run 100 iterations

- [x] 8. Implement Quadrant component
  - [x] 8.1 Create Quadrant container component
    - Implement quadrant layout with title header
    - Display list of TodoCard components for quadrant's todos
    - Add "Add Todo" button that shows TodoForm
    - Use getTodosByQuadrant selector to get todos
    - _Requirements: 1.1, 1.4, 2.1_
  
  - [x] 8.2 Write property test for adding todo creates in correct quadrant
    - **Feature: eisenhower-matrix-todo, Property 1: Adding todo creates in correct quadrant**
    - **Validates: Requirements 2.1, 2.5**
    - Generate random quadrants and valid todo data
    - Add todo to quadrant, verify it appears only in that quadrant
    - Run 100 iterations

- [x] 9. Implement drag-and-drop functionality
  - [x] 9.1 Set up DndContext in Matrix component
    - Wrap quadrants with DndContext from @dnd-kit
    - Configure sensors for mouse and touch
    - Implement handleDragEnd to call moveTodo
    - _Requirements: 4.1, 4.2_
  
  - [x] 9.2 Make TodoCard draggable
    - Use useDraggable hook from @dnd-kit
    - Apply transform styles during drag
    - Add visual feedback (opacity, cursor)
    - _Requirements: 4.1, 4.3_
  
  - [x] 9.3 Make Quadrant droppable
    - Use useDroppable hook from @dnd-kit
    - Add visual feedback when dragging over (border, background)
    - _Requirements: 4.1, 4.4_
  
  - [x] 9.4 Write property test for drag and drop updates quadrant
    - **Feature: eisenhower-matrix-todo, Property 5: Drag and drop updates quadrant**
    - **Validates: Requirements 4.1, 4.2**
    - Generate random source and target quadrants
    - Simulate drag and drop, verify quadrant property updated
    - Run 100 iterations
  
  - [x] 9.5 Write property test for cancelled drag preserves state
    - **Feature: eisenhower-matrix-todo, Property 6: Cancelled drag preserves state**
    - **Validates: Requirements 4.5**
    - Generate random todos
    - Start drag and cancel, verify todo remains in original quadrant
    - Run 100 iterations

- [x] 10. Implement Matrix component and wire everything together
  - [x] 10.1 Create Matrix component as main container
    - Render four Quadrant components in 2x2 grid
    - Pass correct quadrant type and title to each
    - Wrap with DndContext for drag-and-drop
    - _Requirements: 1.1, 1.2_
  
  - [x] 10.2 Initialize app and load data on startup
    - Call loadTodos in App.tsx useEffect on mount
    - Show loading state while fetching
    - Handle errors gracefully
    - _Requirements: 5.4, 5.5_
  
  - [x] 10.3 Write unit test for app initialization
    - Test that app displays four quadrants on render
    - Test that quadrants have correct labels
    - Test that loadTodos is called on mount
    - _Requirements: 1.1, 5.4_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Add error handling and user feedback
  - [x] 12.1 Implement error boundaries in React
    - Create ErrorBoundary component
    - Wrap main app with error boundary
    - Display user-friendly error messages
    - _Requirements: Error Handling_
  
  - [x] 12.2 Add toast notifications for operations
    - Install and configure toast library (sonner or react-hot-toast)
    - Show success toast on create/update/delete
    - Show error toast on operation failures
    - _Requirements: Error Handling_
  
  - [x] 12.3 Implement retry logic for IPC failures
    - Add retry with exponential backoff for save operations
    - Log errors for debugging
    - _Requirements: Error Handling_

- [x] 13. Polish UI and add final touches
  - [x] 13.1 Refine visual design
    - Adjust spacing, colors, and typography
    - Add hover states and transitions
    - Ensure consistent styling across components
    - _Requirements: 1.3_
  
  - [x] 13.2 Add keyboard navigation support
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators
    - Test tab order
    - _Requirements: Accessibility_
  
  - [x] 13.3 Optimize performance
    - Add React.memo to TodoCard and Quadrant
    - Debounce save operations during editing
    - Test with large number of todos (50+ per quadrant)
    - _Requirements: Performance_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
