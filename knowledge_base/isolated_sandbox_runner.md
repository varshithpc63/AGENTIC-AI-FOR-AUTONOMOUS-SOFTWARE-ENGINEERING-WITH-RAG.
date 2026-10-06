# Isolated Execution & Sandbox Architecture

## 1. Zero Direct Host Execution
- Generated application code must NEVER be executed directly within the host process or main application DOM.
- Code must be isolated within a sandboxed `iframe` with `sandbox="allow-scripts allow-forms allow-modals"`.
- Communication between host and sandbox must occur exclusively via postMessage or safe state serialization.

## 2. Test Execution in Virtual Sandbox
- The test harness runs generated logic functions inside a isolated JS context (Node.js isolated VM context or Web Worker / iframe runner) with strict execution timeouts (e.g. 5000ms max).
- Exceptions are caught, formatted, and reported back with line numbers, error types (`SyntaxError`, `TypeError`, `AssertionError`), and call stacks.

## 3. Self-Contained Bundle Generation
- The Code Agent must compile all components, stores, styles, and markup into a standalone executable document for the sandbox.
- It includes interactive Tailwind styling, reactive state, and full CRUD interactions so the live preview is 100% functional immediately.
