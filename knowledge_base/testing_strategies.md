# Automated Testing & Verification Strategies

## 1. Unit & Functional Verification
- Every software module must be verified with an automated suite:
  - Validation tests: verify validator rejects empty titles, negative quantities, invalid dates, and accepts valid payloads.
  - State transition tests: verify adding an item increments total count, deleting removes the item, updating changes the specified field without mutating other fields.
  - Aggregation tests: verify calculation of statistics (e.g. attendance percentage = `(present / total) * 100`, total budget spent, active task ratio).
  - Search & filter tests: verify query matching by name, status filter exclusion, and case-insensitive matching.

## 2. Test Runner Execution Protocol
- Test suites must expose a standard test runner function:
  `async function runTests(): Promise<TestSuiteResult>`
- Each test case must record:
  - `id`: unique test identifier
  - `name`: human-readable description (e.g. "Calculate overall attendance rate accurately")
  - `passed`: boolean
  - `durationMs`: time taken
  - `error`: optional error message or stack trace if assertion failed
  - `expected`: expected value representation
  - `actual`: actual value returned
- Assertions should throw meaningful errors (`AssertionError: expected 85% attendance, got 60%`).
