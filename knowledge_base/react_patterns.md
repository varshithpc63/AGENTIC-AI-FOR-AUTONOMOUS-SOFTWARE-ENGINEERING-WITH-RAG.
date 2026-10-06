# React State & Lifecycle Architecture

## 1. Modular State Management
- Prefer localized component state (`useState`, `useReducer`) for view-specific states.
- For shared cross-component state, use custom hooks (`useAttendanceStore`, `useTaskManager`) backed by a clean pub/sub or React Context pattern.
- Always initialize state with safe default types (empty arrays `[]`, clean objects `{}`) to prevent `undefined` runtime exceptions.

## 2. LocalStorage Persistence Pattern
- When storing client-side data, always parse with `try/catch` error boundaries.
- Ensure fallback to initial seed data if `localStorage.getItem(key)` returns null or invalid JSON.
- Provide a clear `resetToDefault()` action for testability and user recovery.

## 3. Form Handling and Validation
- Keep inputs controlled via state or typed form hooks.
- Validate on input and submission: verify required fields, numeric bounds (e.g. positive percentages, valid dates), and non-empty strings.
- Surface field-level inline error messages before committing state mutations.

## 4. Derived State Computation
- Do not store redundant filtered lists in state; derive filtered and sorted views using `useMemo` based on active search terms, status filters, and sort orders.
