# Data Modeling & Validation Standards

## 1. Type Safety with TypeScript
- Define strict types for all entities:
  - Unique ID (`id: string`, e.g., `crypto.randomUUID()` or timestamp-based ID)
  - Timestamps (`createdAt: string`, `updatedAt?: string`)
  - Enums or Union String Types for statuses (e.g. `'present' | 'absent' | 'late' | 'excused'`)
- Never use `any`. Use generics or strict union types.

## 2. Business Logic Validation Rules
- Data validation rules must be centralized into reusable validator functions:
  - `validateStudent(data)`: ensures rollNumber format, non-empty student name, valid email.
  - `validateAttendanceRecord(record)`: prevents duplicate marking for the same student on the same date.
- Validate bounds: percentages between 0 and 100, positive integers for counts.

## 3. Data Integrity & Relationships
- Maintain referential integrity across entities (e.g. attendance records referencing valid student IDs).
- When a student is removed, handle cascade deletion or archiving of associated attendance records cleanly.
