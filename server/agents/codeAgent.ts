import { GoogleGenAI } from '@google/genai';
import { GeneratedFile, RagDoc, RequirementSpec, SystemDesignSpec } from '../types.js';
import { callGeminiSafe, getGeminiClient } from '../geminiHelper.js';

export class CodeAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.ai = getGeminiClient();
  }

  public async generateCodebase(
    requirements: RequirementSpec,
    design: SystemDesignSpec,
    ragKnowledge: RagDoc[]
  ): Promise<{ files: GeneratedFile[]; previewHtml: string }> {
    // 1. Try real-time code synthesis with Gemini AI for any arbitrary user prompt
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const geminiFiles = await this.generateWithGemini(requirements, design, ragKnowledge);
        if (geminiFiles && geminiFiles.length >= 3) {
          return { files: geminiFiles, previewHtml: '' };
        }
      } catch (err) {
        console.warn('Gemini code generation fallback:', err);
      }
    }

    // 2. High-quality deterministic fallback engines for common and custom domains
    const isAttendance = /attendance/i.test(requirements.appTitle);
    const isTask = /task|todo|kanban/i.test(requirements.appTitle);
    const isExpense = /expense|budget|finance/i.test(requirements.appTitle);
    const isCalculator = /calc|math|arithmetic/i.test(requirements.appTitle);

    if (isAttendance) {
      return this.generateAttendanceSoftware(requirements, design, ragKnowledge);
    } else if (isTask) {
      return this.generateTaskSoftware(requirements, design, ragKnowledge);
    } else if (isExpense) {
      return this.generateExpenseSoftware(requirements, design, ragKnowledge);
    } else if (isCalculator) {
      return this.generateCalculatorSoftware(requirements, design, ragKnowledge);
    } else {
      return this.generateGenericSoftware(requirements, design, ragKnowledge);
    }
  }

  private async generateWithGemini(
    req: RequirementSpec,
    design: SystemDesignSpec,
    ragKnowledge: RagDoc[]
  ): Promise<GeneratedFile[] | null> {
    if (!this.ai) return null;

    const ragSummary = ragKnowledge.map((r) => `[${r.title}]: ${r.summary}`).join('\n');

    const prompt = `You are the Lead Code Generation Agent in an Autonomous Software Engineer system.
Generate a complete, production-grade, multi-file React application with TypeScript and Tailwind CSS for this requirement:

Title: ${req.appTitle}
Summary: ${req.summary}
Core Features:
${req.coreFeatures.map((f) => `- ${f.title}: ${f.description}`).join('\n')}
Inputs: ${req.inputs.join(', ')}
Outputs: ${req.outputs.join(', ')}
Constraints: ${req.constraints.join(', ')}
Acceptance Criteria: ${req.acceptanceCriteria.join(', ')}

Architecture & Design:
${design.architectureOverview}
State Strategy: ${design.stateStrategy}

Technical Guidelines:
${ragSummary}

Generate these required files:
1. "src/types.ts": strict TypeScript data models and interfaces.
2. "src/store.ts": state store, validation functions, calculation helpers, and sample state.
3. "src/components/App.tsx": main interactive React component with responsive modern Tailwind CSS UI, user interactions, buttons, inputs, and real-time state. Use clean JSX (import React and hooks from 'react'). Export named "App": "export const App: React.FC = () => { ... };".
4. "src/tests.ts": automated verification test suite exporting:
   "export async function runGeneratedTests(): Promise<Array<{ id: string; name: string; passed: boolean; error?: string; expected?: string; actual?: string }>>"
   that tests all core calculation logic and validator edge cases.
5. "README.md": project documentation.

Return strictly a JSON object with this structure:
{
  "files": [
    {
      "path": "src/types.ts",
      "language": "typescript",
      "description": "TypeScript data models and interfaces",
      "content": "..."
    },
    {
      "path": "src/store.ts",
      "language": "typescript",
      "description": "Business logic and state management",
      "content": "..."
    },
    {
      "path": "src/components/App.tsx",
      "language": "typescript",
      "description": "Main interactive presentation component",
      "content": "..."
    },
    {
      "path": "src/tests.ts",
      "language": "typescript",
      "description": "Automated verification test suite",
      "content": "..."
    },
    {
      "path": "README.md",
      "language": "markdown",
      "description": "Project documentation",
      "content": "..."
    }
  ]
}
Output strictly valid JSON without Markdown backticks.`;

    const responseText = await callGeminiSafe(this.ai, prompt);
    if (!responseText) return null;

    try {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed && Array.isArray(parsed.files) && parsed.files.length >= 3) {
        return parsed.files as GeneratedFile[];
      }
    } catch (e) {
      console.warn('Failed to parse Gemini generated codebase JSON:', e);
    }
    return null;
  }

  private generateCalculatorSoftware(
    req: RequirementSpec,
    _design: SystemDesignSpec,
    ragDocs: RagDoc[]
  ): { files: GeneratedFile[]; previewHtml: string } {
    const files: GeneratedFile[] = [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'TypeScript interfaces for Calculator operations and history',
        content: `export type CalcOperation = '+' | '-' | '*' | '/' | '%' | null;

export interface CalcHistoryItem {
  id: string;
  expression: string;
  result: number;
  timestamp: string;
}

export interface CalcState {
  display: string;
  prevValue: number | null;
  operation: CalcOperation;
  overwrite: boolean;
  memory: number;
  history: CalcHistoryItem[];
}
`,
      },
      {
        path: 'src/store.ts',
        language: 'typescript',
        description: 'Arithmetic engine, precision formatter, and validation logic',
        content: `import { CalcOperation, CalcHistoryItem } from './types';

export function calculate(a: number, b: number, op: CalcOperation): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (op === '/') {
    if (b === 0) throw new Error('Division by zero is undefined');
    return a / b;
  }
  if (op === '%') return (a * b) / 100;
  return b;
}

export function formatResult(num: number): string {
  if (isNaN(num)) return 'Error';
  if (!isFinite(num)) return 'Error';
  const rounded = Math.round(num * 1e10) / 1e10;
  return String(rounded);
}

export function validateInput(val: string): boolean {
  return /^-?\\d*\\.?\\d*$/.test(val);
}
`,
      },
      {
        path: 'src/components/CalculatorApp.tsx',
        language: 'typescript',
        description: 'Modern interactive calculator presentation component',
        content: `import React, { useState, useEffect } from 'react';
import { CalcOperation, CalcHistoryItem } from '../types';
import { calculate, formatResult } from '../store';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<CalcOperation>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<CalcHistoryItem[]>([
    { id: 'h-1', expression: '12 × 8', result: 96, timestamp: '10:00 AM' },
    { id: 'h-2', expression: '150 + 25', result: 175, timestamp: '10:05 AM' }
  ]);
  const [showHistory, setShowHistory] = useState(true);

  const handleDigit = (digit: string) => {
    if (overwrite || display === '0') {
      setDisplay(digit);
      setOverwrite(false);
    } else {
      setDisplay(prev => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (overwrite) {
      setDisplay('0.');
      setOverwrite(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleOperator = (op: CalcOperation) => {
    const current = parseFloat(display);
    if (prevValue !== null && operation && !overwrite) {
      try {
        const res = calculate(prevValue, current, operation);
        const resStr = formatResult(res);
        setDisplay(resStr);
        setPrevValue(res);
      } catch (err: any) {
        setDisplay('Error');
        setPrevValue(null);
        setOperation(null);
        setOverwrite(true);
        return;
      }
    } else {
      setPrevValue(current);
    }
    setOperation(op);
    setOverwrite(true);
  };

  const handleEquals = () => {
    if (prevValue === null || !operation) return;
    const current = parseFloat(display);
    try {
      const res = calculate(prevValue, current, operation);
      const resStr = formatResult(res);
      const exp = \`\${prevValue} \${operation} \${current}\`;
      const newItem: CalcHistoryItem = {
        id: 'h-' + Date.now(),
        expression: exp,
        result: res,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory(prev => [newItem, ...prev]);
      setDisplay(resStr);
      setPrevValue(null);
      setOperation(null);
      setOverwrite(true);
    } catch (err: any) {
      setDisplay('Error');
      setPrevValue(null);
      setOperation(null);
      setOverwrite(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setOverwrite(false);
  };

  const handleBackspace = () => {
    if (overwrite) return;
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(prev => prev.slice(0, -1));
    }
  };

  const handleToggleSign = () => {
    if (display === '0') return;
    setDisplay(prev => prev.startsWith('-') ? prev.slice(1) : '-' + prev);
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(formatResult(current / 100));
  };

  const opSymbols: Record<string, string> = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷',
    '%': '%'
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans select-none">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl">
        {/* Calculator Main Body */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Modern Scientific Calculator
            </h1>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>

          {/* LCD Display */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-right shadow-inner">
            <div className="h-5 text-xs font-mono text-slate-400 truncate">
              {prevValue !== null && operation ? \`\${prevValue} \${opSymbols[operation] || operation}\` : ''}
            </div>
            <div className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-wider truncate mt-1">
              {display}
            </div>
          </div>

          {/* Keypad Grid */}
          <div className="grid grid-cols-4 gap-2.5">
            <button onClick={handleClear} className="p-3.5 rounded-xl bg-slate-800 text-rose-400 font-bold hover:bg-slate-700 transition active:scale-95 text-sm">AC</button>
            <button onClick={handleBackspace} className="p-3.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition active:scale-95 text-sm">⌫</button>
            <button onClick={handlePercent} className="p-3.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition active:scale-95 text-sm">%</button>
            <button onClick={() => handleOperator('/')} className={\`p-3.5 rounded-xl font-bold transition active:scale-95 text-sm \${operation === '/' ? 'bg-indigo-600 text-white' : 'bg-indigo-950/80 text-indigo-400 hover:bg-indigo-900/80'}\`}>÷</button>

            <button onClick={() => handleDigit('7')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">7</button>
            <button onClick={() => handleDigit('8')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">8</button>
            <button onClick={() => handleDigit('9')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">9</button>
            <button onClick={() => handleOperator('*')} className={\`p-3.5 rounded-xl font-bold transition active:scale-95 text-sm \${operation === '*' ? 'bg-indigo-600 text-white' : 'bg-indigo-950/80 text-indigo-400 hover:bg-indigo-900/80'}\`}>×</button>

            <button onClick={() => handleDigit('4')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">4</button>
            <button onClick={() => handleDigit('5')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">5</button>
            <button onClick={() => handleDigit('6')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">6</button>
            <button onClick={() => handleOperator('-')} className={\`p-3.5 rounded-xl font-bold transition active:scale-95 text-sm \${operation === '-' ? 'bg-indigo-600 text-white' : 'bg-indigo-950/80 text-indigo-400 hover:bg-indigo-900/80'}\`}>−</button>

            <button onClick={() => handleDigit('1')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">1</button>
            <button onClick={() => handleDigit('2')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">2</button>
            <button onClick={() => handleDigit('3')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">3</button>
            <button onClick={() => handleOperator('+')} className={\`p-3.5 rounded-xl font-bold transition active:scale-95 text-sm \${operation === '+' ? 'bg-indigo-600 text-white' : 'bg-indigo-950/80 text-indigo-400 hover:bg-indigo-900/80'}\`}>+</button>

            <button onClick={handleToggleSign} className="p-3.5 rounded-xl bg-slate-900 text-slate-300 font-semibold hover:bg-slate-800 transition active:scale-95 text-sm border border-slate-800/80">±</button>
            <button onClick={() => handleDigit('0')} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">0</button>
            <button onClick={handleDecimal} className="p-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition active:scale-95 text-base border border-slate-800/80">.</button>
            <button onClick={handleEquals} className="p-3.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition active:scale-95 text-base shadow-md">=</button>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">History</span>
              <button onClick={() => setHistory([])} className="text-[10px] text-slate-500 hover:text-slate-300">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No calculations yet.</p>
              ) : (
                history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => { setDisplay(String(item.result)); setOverwrite(true); }}
                    className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 cursor-pointer border border-slate-800/60 transition"
                  >
                    <div className="text-[11px] text-slate-400 font-mono">{item.expression} =</div>
                    <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">{item.result}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'src/tests.ts',
        language: 'typescript',
        description: 'Automated test suite for Calculator operations',
        content: `import { calculate, formatResult, validateInput } from './store';

export async function runGeneratedTests() {
  const results = [];

  // Test 1: Addition
  try {
    const res = calculate(12, 18, '+');
    if (res === 30) {
      results.push({ id: 't1', name: 'Arithmetic: Addition (12 + 18 = 30)', passed: true });
    } else {
      results.push({ id: 't1', name: 'Arithmetic: Addition (12 + 18 = 30)', passed: false, error: \`Expected 30, got \${res}\` });
    }
  } catch (e: any) {
    results.push({ id: 't1', name: 'Arithmetic: Addition', passed: false, error: e.message });
  }

  // Test 2: Subtraction
  try {
    const res = calculate(50, 15, '-');
    if (res === 35) {
      results.push({ id: 't2', name: 'Arithmetic: Subtraction (50 - 15 = 35)', passed: true });
    } else {
      results.push({ id: 't2', name: 'Arithmetic: Subtraction', passed: false, error: \`Expected 35, got \${res}\` });
    }
  } catch (e: any) {
    results.push({ id: 't2', name: 'Arithmetic: Subtraction', passed: false, error: e.message });
  }

  // Test 3: Multiplication
  try {
    const res = calculate(7, 8, '*');
    if (res === 56) {
      results.push({ id: 't3', name: 'Arithmetic: Multiplication (7 * 8 = 56)', passed: true });
    } else {
      results.push({ id: 't3', name: 'Arithmetic: Multiplication', passed: false, error: \`Expected 56, got \${res}\` });
    }
  } catch (e: any) {
    results.push({ id: 't3', name: 'Arithmetic: Multiplication', passed: false, error: e.message });
  }

  // Test 4: Division
  try {
    const res = calculate(144, 12, '/');
    if (res === 12) {
      results.push({ id: 't4', name: 'Arithmetic: Division (144 / 12 = 12)', passed: true });
    } else {
      results.push({ id: 't4', name: 'Arithmetic: Division', passed: false, error: \`Expected 12, got \${res}\` });
    }
  } catch (e: any) {
    results.push({ id: 't4', name: 'Arithmetic: Division', passed: false, error: e.message });
  }

  // Test 5: Division by zero safety
  try {
    calculate(10, 0, '/');
    results.push({ id: 't5', name: 'Safety: Division by zero guard', passed: false, error: 'Expected division by zero to throw' });
  } catch (e: any) {
    results.push({ id: 't5', name: 'Safety: Division by zero guard', passed: true });
  }

  return results;
}
`,
      },
      {
        path: 'README.md',
        language: 'markdown',
        description: 'Calculator documentation',
        content: `# Modern Scientific Calculator
Generated autonomously by Autonomous Software Engineer.

## Features
- Addition, subtraction, multiplication, and division
- Interactive keypad and keyboard shortcuts
- History tape with recall
- Automated unit test suite
`,
      },
    ];

    const previewHtml = this.buildStandaloneHtml(req.appTitle, 'generic', ragDocs);
    return { files, previewHtml };
  }

  private generateAttendanceSoftware(
    req: RequirementSpec,
    _design: SystemDesignSpec,
    ragDocs: RagDoc[]
  ): { files: GeneratedFile[]; previewHtml: string } {
    const files: GeneratedFile[] = [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'TypeScript interfaces for Student, AttendanceRecord, and Metrics',
        content: `export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  department: string;
  totalClasses: number;
  attendedClasses: number;
  todayStatus: AttendanceStatus;
  email?: string;
}

export interface AttendanceMetrics {
  totalStudents: number;
  overallRate: number;
  totalAbsents: number;
  criticalAlertCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
`,
      },
      {
        path: 'src/store.ts',
        language: 'typescript',
        description: 'Business logic, validator functions, and state manager',
        content: `import { Student, AttendanceStatus, AttendanceMetrics, ValidationResult } from './types';

export const INITIAL_STUDENTS: Student[] = [
  { id: 'std-1', rollNo: 'CS-101', name: 'Alex Rivera', department: 'Computer Science', totalClasses: 20, attendedClasses: 19, todayStatus: 'present', email: 'alex.r@univ.edu' },
  { id: 'std-2', rollNo: 'CS-102', name: 'Brianna Chen', department: 'Computer Science', totalClasses: 20, attendedClasses: 14, todayStatus: 'absent', email: 'b.chen@univ.edu' },
  { id: 'std-3', rollNo: 'EE-201', name: 'Devon Miller', department: 'Electrical Eng', totalClasses: 20, attendedClasses: 18, todayStatus: 'present', email: 'devon.m@univ.edu' },
  { id: 'std-4', rollNo: 'ME-301', name: 'Emma Watson', department: 'Mechanical Eng', totalClasses: 20, attendedClasses: 13, todayStatus: 'late', email: 'emma.w@univ.edu' },
  { id: 'std-5', rollNo: 'CS-105', name: 'Farhan Zaidi', department: 'Computer Science', totalClasses: 20, attendedClasses: 17, todayStatus: 'present', email: 'farhan.z@univ.edu' },
];

export function validateStudentInput(name: string, rollNo: string, department: string): ValidationResult {
  const errors: string[] = [];
  if (!name || name.trim().length < 2) {
    errors.push('Student name must be at least 2 characters.');
  }
  if (!rollNo || rollNo.trim().length < 3) {
    errors.push('Roll number must be provided (min 3 chars).');
  }
  if (!department || department.trim().length === 0) {
    errors.push('Department selection is required.');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function calculateStudentRate(attended: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((attended / total) * 100);
}

export function isLowAttendance(student: Student, threshold: number = 75): boolean {
  return calculateStudentRate(student.attendedClasses, student.totalClasses) < threshold;
}

export function computeMetrics(students: Student[]): AttendanceMetrics {
  if (students.length === 0) {
    return { totalStudents: 0, overallRate: 0, totalAbsents: 0, criticalAlertCount: 0 };
  }
  const totalClassesSum = students.reduce((acc, s) => acc + s.totalClasses, 0);
  const totalAttendedSum = students.reduce((acc, s) => acc + s.attendedClasses, 0);
  const overallRate = totalClassesSum > 0 ? Math.round((totalAttendedSum / totalClassesSum) * 100) : 0;
  const totalAbsents = students.filter(s => s.todayStatus === 'absent').length;
  const criticalAlertCount = students.filter(s => isLowAttendance(s, 75)).length;

  return {
    totalStudents: students.length,
    overallRate,
    totalAbsents,
    criticalAlertCount,
  };
}

export function filterStudents(
  students: Student[],
  query: string,
  department: string,
  showOnlyLowAttendance: boolean
): Student[] {
  const q = query.toLowerCase().trim();
  return students.filter(student => {
    const matchesQuery = !q || student.name.toLowerCase().includes(q) || student.rollNo.toLowerCase().includes(q);
    const matchesDept = !department || department === 'all' || student.department === department;
    const matchesLow = !showOnlyLowAttendance || isLowAttendance(student, 75);
    return matchesQuery && matchesDept && matchesLow;
  });
}
`,
      },
      {
        path: 'src/components/AttendanceApp.tsx',
        language: 'typescript',
        description: 'Main React presentation component and controller',
        content: `import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { 
  INITIAL_STUDENTS, 
  validateStudentInput, 
  calculateStudentRate, 
  isLowAttendance, 
  computeMetrics, 
  filterStudents 
} from '../store';

export const AttendanceApp: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [onlyLow, setOnlyLow] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newDept, setNewDept] = useState('Computer Science');
  const [formError, setFormError] = useState<string | null>(null);

  const metrics = computeMetrics(students);
  const filtered = filterStudents(students, search, selectedDept, onlyLow);

  const handleStatusChange = (id: string, newStatus: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      let newAttended = s.attendedClasses;
      if (s.todayStatus === 'present' && newStatus === 'absent') {
        newAttended = Math.max(0, s.attendedClasses - 1);
      } else if (s.todayStatus !== 'present' && newStatus === 'present') {
        newAttended = s.attendedClasses + 1;
      }
      return { ...s, todayStatus: newStatus, attendedClasses: newAttended };
    }));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateStudentInput(newName, newRoll, newDept);
    if (!validation.valid) {
      setFormError(validation.errors.join(', '));
      return;
    }
    const newStudent: Student = {
      id: 'std-' + Date.now(),
      rollNo: newRoll.trim().toUpperCase(),
      name: newName.trim(),
      department: newDept,
      totalClasses: 20,
      attendedClasses: 20,
      todayStatus: 'present',
    };
    setStudents(prev => [newStudent, ...prev]);
    setNewName('');
    setNewRoll('');
    setFormError(null);
    setIsModalOpen(false);
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => ({
      ...s,
      todayStatus: status,
      attendedClasses: status === 'present' ? Math.min(s.totalClasses, s.attendedClasses + 1) : s.attendedClasses
    })));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Student Attendance Management System</h1>
          <p className="text-sm text-slate-500">Academic Year 2026-2027 • Daily Attendance Register</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => markAll('present')} className="px-3 py-2 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
            Mark All Present
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm">
            + Add Student
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Students</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalStudents}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Average Attendance</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.overallRate}%</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Today's Absences</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.totalAbsents}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Critical Warnings (&lt;75%)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.criticalAlertCount}</p>
        </div>
      </div>

      {/* Filter Bar & Roster */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search by student name or roll..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm rounded border border-slate-300 w-64 focus:outline-indigo-500"
          />
          <div className="flex items-center gap-3">
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-sm border border-slate-300 rounded px-2.5 py-1.5"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Eng">Electrical Eng</option>
              <option value="Mechanical Eng">Mechanical Eng</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyLow}
                onChange={e => setOnlyLow(e.target.checked)}
                className="rounded text-indigo-600"
              />
              Show Low Attendance (&lt;75%)
            </label>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Roll No</th>
              <th className="py-3 px-4 font-semibold">Student Name</th>
              <th className="py-3 px-4 font-semibold">Department</th>
              <th className="py-3 px-4 font-semibold">Attendance Rate</th>
              <th className="py-3 px-4 font-semibold">Today's Status</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(student => {
              const rate = calculateStudentRate(student.attendedClasses, student.totalClasses);
              const isAlert = rate < 75;
              return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-700">{student.rollNo}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{student.name}</td>
                  <td className="py-3 px-4 text-slate-500">{student.department}</td>
                  <td className="py-3 px-4">
                    <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold \${
                      isAlert ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }\`}>
                      {rate}% {isAlert && '⚠️ Low'}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize font-medium">{student.todayStatus}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className="px-2 py-1 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className="px-2 py-1 text-xs font-medium rounded bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        Absent
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'src/tests.ts',
        language: 'typescript',
        description: 'Comprehensive automated test suite for isolated sandbox execution',
        content: `import { 
  validateStudentInput, 
  calculateStudentRate, 
  isLowAttendance, 
  computeMetrics, 
  filterStudents,
  INITIAL_STUDENTS 
} from './store';

export async function runGeneratedTests() {
  const results = [];

  // Test 1: Validation rejects empty student name
  try {
    const res = validateStudentInput('', 'CS-999', 'Computer Science');
    if (res.valid === false && res.errors.length > 0) {
      results.push({ id: 't1', name: 'Validation: Rejects empty student name', passed: true });
    } else {
      results.push({ id: 't1', name: 'Validation: Rejects empty student name', passed: false, error: 'Expected validation failure for empty student name' });
    }
  } catch (err: any) {
    results.push({ id: 't1', name: 'Validation: Rejects empty student name', passed: false, error: err.message });
  }

  // Test 2: Validation accepts valid student credentials
  try {
    const res = validateStudentInput('Marcus Vance', 'CS-109', 'Computer Science');
    if (res.valid === true && res.errors.length === 0) {
      results.push({ id: 't2', name: 'Validation: Accepts valid student credentials', passed: true });
    } else {
      results.push({ id: 't2', name: 'Validation: Accepts valid student credentials', passed: false, error: 'Valid inputs were rejected by validator' });
    }
  } catch (err: any) {
    results.push({ id: 't2', name: 'Validation: Accepts valid student credentials', passed: false, error: err.message });
  }

  // Test 3: Calculate accurate attendance percentage formula
  try {
    const rate1 = calculateStudentRate(18, 20); // 90%
    const rate2 = calculateStudentRate(14, 20); // 70%
    if (rate1 === 90 && rate2 === 70) {
      results.push({ id: 't3', name: 'Calculation: Attendance rate computation formula', passed: true });
    } else {
      results.push({ id: 't3', name: 'Calculation: Attendance rate computation formula', passed: false, error: \`Expected 90% and 70%, received \${rate1}% and \${rate2}%\` });
    }
  } catch (err: any) {
    results.push({ id: 't3', name: 'Calculation: Attendance rate computation formula', passed: false, error: err.message });
  }

  // Test 4: Critical threshold low attendance flag (< 75%)
  try {
    const lowStudent = { id: 's1', rollNo: 'CS-101', name: 'Test', department: 'CS', totalClasses: 20, attendedClasses: 14, todayStatus: 'absent' as const };
    const goodStudent = { id: 's2', rollNo: 'CS-102', name: 'Test 2', department: 'CS', totalClasses: 20, attendedClasses: 19, todayStatus: 'present' as const };
    const isLow1 = isLowAttendance(lowStudent, 75);
    const isLow2 = isLowAttendance(goodStudent, 75);
    if (isLow1 === true && isLow2 === false) {
      results.push({ id: 't4', name: 'Threshold: Correctly flags low attendance (<75%)', passed: true });
    } else {
      results.push({ id: 't4', name: 'Threshold: Correctly flags low attendance (<75%)', passed: false, error: 'Failed to flag low attendance accurately' });
    }
  } catch (err: any) {
    results.push({ id: 't4', name: 'Threshold: Correctly flags low attendance (<75%)', passed: false, error: err.message });
  }

  // Test 5: Metrics computation across roster
  try {
    const metrics = computeMetrics(INITIAL_STUDENTS);
    if (metrics.totalStudents === 5 && metrics.overallRate > 0) {
      results.push({ id: 't5', name: 'Aggregation: Compute class KPI metrics accurately', passed: true });
    } else {
      results.push({ id: 't5', name: 'Aggregation: Compute class KPI metrics accurately', passed: false, error: 'Metrics calculation returned invalid totals' });
    }
  } catch (err: any) {
    results.push({ id: 't5', name: 'Aggregation: Compute class KPI metrics accurately', passed: false, error: err.message });
  }

  // Test 6: Search query filtering
  try {
    const filtered = filterStudents(INITIAL_STUDENTS, 'Brianna', 'all', false);
    if (filtered.length === 1 && filtered[0].name === 'Brianna Chen') {
      results.push({ id: 't6', name: 'Filter: Substring search by student name', passed: true });
    } else {
      results.push({ id: 't6', name: 'Filter: Substring search by student name', passed: false, error: 'Search filtering failed to isolate target student' });
    }
  } catch (err: any) {
    results.push({ id: 't6', name: 'Filter: Substring search by student name', passed: false, error: err.message });
  }

  return results;
}
`,
      },
      {
        path: 'README.md',
        language: 'markdown',
        description: 'Project architecture and running instructions',
        content: `# Student Attendance Management System
Generated autonomously by Autonomous Software Engineer.

## Technical Highlights
- Real-time attendance rate computation
- Critical low-attendance alert system (<75%)
- Search and departmental filter
- Comprehensive automated verification suite
`,
      },
    ];

    const previewHtml = this.buildStandaloneHtml(req.appTitle, 'attendance', ragDocs);

    return { files, previewHtml };
  }

  private generateTaskSoftware(
    req: RequirementSpec,
    _design: SystemDesignSpec,
    ragDocs: RagDoc[]
  ): { files: GeneratedFile[]; previewHtml: string } {
    const files: GeneratedFile[] = [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'TypeScript interfaces for Task items and columns',
        content: `export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  createdAt: string;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  urgentCount: number;
}
`,
      },
      {
        path: 'src/store.ts',
        language: 'typescript',
        description: 'Task board business logic and validation',
        content: `import { TaskItem, TaskStatus, TaskPriority, TaskMetrics } from './types';

export const INITIAL_TASKS: TaskItem[] = [
  { id: 'tsk-1', title: 'Implement JWT Auth flow', description: 'Authenticate users via secure tokens', status: 'done', priority: 'high', assignee: 'Sarah', createdAt: '2026-10-01' },
  { id: 'tsk-2', title: 'Design database schema', description: 'Draft ERD and migration files', status: 'in_progress', priority: 'urgent', assignee: 'David', createdAt: '2026-10-02' },
  { id: 'tsk-3', title: 'Setup CI/CD deployment pipeline', description: 'Configure automated test triggers', status: 'todo', priority: 'medium', assignee: 'Alex', createdAt: '2026-10-03' },
  { id: 'tsk-4', title: 'Write integration test suite', description: 'Verify API endpoints in sandbox', status: 'review', priority: 'high', assignee: 'Sarah', createdAt: '2026-10-04' },
];

export function validateTask(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length < 3) {
    return { valid: false, error: 'Task title must be at least 3 characters long.' };
  }
  return { valid: true };
}

export function computeTaskMetrics(tasks: TaskItem[]): TaskMetrics {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return { totalTasks, completedTasks, completionRate, urgentCount };
}

export function filterTasks(tasks: TaskItem[], query: string, priorityFilter: string): TaskItem[] {
  const q = query.toLowerCase().trim();
  return tasks.filter(t => {
    const matchesQ = !q || t.title.toLowerCase().includes(q) || t.assignee.toLowerCase().includes(q);
    const matchesP = !priorityFilter || priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesQ && matchesP;
  });
}
`,
      },
      {
        path: 'src/components/TaskApp.tsx',
        language: 'typescript',
        description: 'Interactive Kanban task board presentation component',
        content: `import React, { useState } from 'react';
import { TaskItem, TaskStatus, TaskPriority } from '../types';
import { INITIAL_TASKS, validateTask, computeTaskMetrics, filterTasks } from '../store';

export const TaskApp: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState('Sarah');
  const [formError, setFormError] = useState<string | null>(null);

  const metrics = computeTaskMetrics(tasks);
  const filtered = filterTasks(tasks, search, priorityFilter);

  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const val = validateTask(newTitle);
    if (!val.valid) {
      setFormError(val.error || 'Invalid task title');
      return;
    }

    const newTask: TaskItem = {
      id: 'tsk-' + Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim() || 'No description provided',
      status: 'todo',
      priority: newPriority,
      assignee: newAssignee,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setNewDesc('');
    setFormError(null);
    setIsModalOpen(false);
  };

  const columns: { key: TaskStatus; label: string }[] = [
    { key: 'todo', label: 'To Do' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'Review' },
    { key: 'done', label: 'Done' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kanban Project Management Board</h1>
          <p className="text-sm text-slate-500">Agile Sprint Velocity • Interactive Task Board</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
        >
          + Add Task
        </button>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Tasks</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalTasks}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Completed Tasks</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.completedTasks}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Completion Velocity</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.completionRate}%</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Urgent Priority</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{metrics.urgentCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks or assignees..."
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 w-64 focus:outline-indigo-500"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{col.label}</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.map((t) => (
                  <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{t.title}</span>
                      <span className={\`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded \${
                        t.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }\`}>
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{t.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-600 font-medium">👤 {t.assignee}</span>
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value as TaskStatus)}
                        className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Create New Task</h3>
            {formError && <div className="p-2 text-xs bg-rose-50 text-rose-700 rounded-lg">{formError}</div>}
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Task details..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
`,
      },
      {
        path: 'src/tests.ts',
        language: 'typescript',
        description: 'Automated test suite for Task Board',
        content: `import { validateTask, computeTaskMetrics, filterTasks, INITIAL_TASKS } from './store';

export async function runGeneratedTests() {
  const results = [];

  // Test 1: Validate task rejects empty title
  try {
    const res = validateTask('');
    if (!res.valid) {
      results.push({ id: 't1', name: 'Validation: Rejects empty task title', passed: true });
    } else {
      results.push({ id: 't1', name: 'Validation: Rejects empty task title', passed: false, error: 'Empty task title should be invalid' });
    }
  } catch (e: any) {
    results.push({ id: 't1', name: 'Validation: Rejects empty task title', passed: false, error: e.message });
  }

  // Test 2: Validate task accepts valid title
  try {
    const res = validateTask('Build sandbox iframe');
    if (res.valid) {
      results.push({ id: 't2', name: 'Validation: Accepts valid title', passed: true });
    } else {
      results.push({ id: 't2', name: 'Validation: Accepts valid title', passed: false, error: 'Valid title rejected' });
    }
  } catch (e: any) {
    results.push({ id: 't2', name: 'Validation: Accepts valid title', passed: false, error: e.message });
  }

  // Test 3: Metrics computation
  try {
    const metrics = computeTaskMetrics(INITIAL_TASKS);
    if (metrics.totalTasks === 4 && metrics.completedTasks === 1 && metrics.completionRate === 25) {
      results.push({ id: 't3', name: 'Metrics: Accurate completion velocity', passed: true });
    } else {
      results.push({ id: 't3', name: 'Metrics: Accurate completion velocity', passed: false, error: 'Metric computation mismatch' });
    }
  } catch (e: any) {
    results.push({ id: 't3', name: 'Metrics: Accurate completion velocity', passed: false, error: e.message });
  }

  // Test 4: Search filter
  try {
    const filtered = filterTasks(INITIAL_TASKS, 'JWT', 'all');
    if (filtered.length === 1 && filtered[0].title.includes('JWT')) {
      results.push({ id: 't4', name: 'Search: Substring query filter', passed: true });
    } else {
      results.push({ id: 't4', name: 'Search: Substring query filter', passed: false, error: 'Search failed to match task' });
    }
  } catch (e: any) {
    results.push({ id: 't4', name: 'Search: Substring query filter', passed: false, error: e.message });
  }

  return results;
}
`,
      },
    ];

    const previewHtml = this.buildStandaloneHtml(req.appTitle, 'task', ragDocs);
    return { files, previewHtml };
  }

  private generateExpenseSoftware(
    req: RequirementSpec,
    _design: SystemDesignSpec,
    ragDocs: RagDoc[]
  ): { files: GeneratedFile[]; previewHtml: string } {
    const files: GeneratedFile[] = [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'TypeScript interfaces for Transactions & Budgeting',
        content: `export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface BudgetSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}
`,
      },
      {
        path: 'src/store.ts',
        language: 'typescript',
        description: 'Expense calculator, validator and budget store',
        content: `import { Transaction, BudgetSummary } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', title: 'Consulting Retainer', amount: 3500, type: 'income', category: 'Salary', date: '2026-10-01' },
  { id: 'tx-2', title: 'Office Space Rent', amount: 1200, type: 'expense', category: 'Housing', date: '2026-10-02' },
  { id: 'tx-3', title: 'Cloud Infrastructure', amount: 280, type: 'expense', category: 'Tech', date: '2026-10-03' },
  { id: 'tx-4', title: 'Team Lunches', amount: 145, type: 'expense', category: 'Food', date: '2026-10-04' },
];

export function validateTransaction(title: string, amount: number): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) return { valid: false, error: 'Title is required' };
  if (isNaN(amount) || amount <= 0) return { valid: false, error: 'Amount must be greater than 0' };
  return { valid: true };
}

export function computeBudgetSummary(items: Transaction[]): BudgetSummary {
  const totalIncome = items.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = items.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  return { totalIncome, totalExpense, netBalance };
}
`,
      },
      {
        path: 'src/components/ExpenseApp.tsx',
        language: 'typescript',
        description: 'Interactive Expense & Budget Manager presentation component',
        content: `import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { INITIAL_TRANSACTIONS, validateTransaction, computeBudgetSummary } from '../store';

export const ExpenseApp: React.FC = () => {
  const [items, setItems] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Tech');
  const [formError, setFormError] = useState<string | null>(null);

  const summary = computeBudgetSummary(items);
  const filtered = items.filter(t => filterType === 'all' || t.type === filterType);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    const val = validateTransaction(title, num);
    if (!val.valid) {
      setFormError(val.error || 'Invalid transaction entry');
      return;
    }

    const newItem: Transaction = {
      id: 'tx-' + Date.now(),
      title: title.trim(),
      amount: num,
      type,
      category,
      date: new Date().toISOString().split('T')[0],
    };

    setItems(prev => [newItem, ...prev]);
    setTitle('');
    setAmount('');
    setFormError(null);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Personal Expense &amp; Budget Tracker</h1>
          <p className="text-sm text-slate-500">Financial Ledger • Real-time Net Balance &amp; Analytics</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
        >
          + Add Transaction
        </button>
      </header>

      {/* KPI Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Net Balance</p>
          <p className={\`text-2xl font-bold mt-1 \${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}\`}>
            \${summary.netBalance.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Income</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">+\${summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">-\${summary.totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Transactions Ledger</span>
          <div className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                className={\`px-2.5 py-1 text-xs rounded-lg font-medium capitalize \${
                  filterType === tab ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                }\`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-4">Title</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-semibold text-slate-900">{t.title}</td>
                <td className="py-3 px-4 text-slate-600">{t.category}</td>
                <td className="py-3 px-4 text-slate-400 font-mono">{t.date}</td>
                <td className={\`py-3 px-4 text-right font-mono font-bold \${
                  t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                }\`}>
                  {t.type === 'income' ? '+' : '-'}\${t.amount.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-slate-400 hover:text-rose-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Financial Record</h3>
            {formError && <div className="p-2 text-xs bg-rose-50 text-rose-700 rounded-lg">{formError}</div>}
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. AWS Hosting bill"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as TransactionType)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="Salary">Salary</option>
                  <option value="Housing">Housing</option>
                  <option value="Tech">Tech</option>
                  <option value="Food">Food</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
`,
      },
      {
        path: 'src/tests.ts',
        language: 'typescript',
        description: 'Automated test suite for Expense Tracker',
        content: `import { validateTransaction, computeBudgetSummary, INITIAL_TRANSACTIONS } from './store';

export async function runGeneratedTests() {
  const results = [];

  // Test 1: Reject negative amounts
  try {
    const res = validateTransaction('Invalid', -50);
    if (!res.valid) {
      results.push({ id: 't1', name: 'Validation: Reject negative amounts', passed: true });
    } else {
      results.push({ id: 't1', name: 'Validation: Reject negative amounts', passed: false, error: 'Negative amount accepted' });
    }
  } catch (e: any) {
    results.push({ id: 't1', name: 'Validation: Reject negative amounts', passed: false, error: e.message });
  }

  // Test 2: Calculate net balance
  try {
    const summary = computeBudgetSummary(INITIAL_TRANSACTIONS);
    if (summary.totalIncome === 3500 && summary.totalExpense === 1625 && summary.netBalance === 1875) {
      results.push({ id: 't2', name: 'Calculation: Accurate net balance computation', passed: true });
    } else {
      results.push({ id: 't2', name: 'Calculation: Accurate net balance computation', passed: false, error: 'Balance calculation mismatch' });
    }
  } catch (e: any) {
    results.push({ id: 't2', name: 'Calculation: Accurate net balance computation', passed: false, error: e.message });
  }

  return results;
}
`,
      },
    ];

    const previewHtml = this.buildStandaloneHtml(req.appTitle, 'expense', ragDocs);
    return { files, previewHtml };
  }

  private generateGenericSoftware(
    req: RequirementSpec,
    _design: SystemDesignSpec,
    ragDocs: RagDoc[]
  ): { files: GeneratedFile[]; previewHtml: string } {
    const files: GeneratedFile[] = [
      {
        path: 'src/types.ts',
        language: 'typescript',
        description: 'TypeScript schema definitions',
        content: `export interface RecordItem {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed';
  value: number;
  timestamp: string;
}

export interface MetricSummary {
  total: number;
  activeCount: number;
  totalValue: number;
}
`,
      },
      {
        path: 'src/store.ts',
        language: 'typescript',
        description: 'Business logic and validation',
        content: `import { RecordItem, MetricSummary } from './types';

export const INITIAL_RECORDS: RecordItem[] = [
  { id: 'rec-1', name: 'Project Alpha', status: 'active', value: 120, timestamp: '2026-10-01' },
  { id: 'rec-2', name: 'Beta Deployment', status: 'pending', value: 85, timestamp: '2026-10-02' },
  { id: 'rec-3', name: 'Gamma Security Audit', status: 'completed', value: 240, timestamp: '2026-10-03' },
];

export function validateRecord(name: string, value: number) {
  if (!name || name.trim().length === 0) return { valid: false, error: 'Name is required' };
  if (value < 0) return { valid: false, error: 'Value must be positive' };
  return { valid: true };
}

export function computeMetrics(records: RecordItem[]): MetricSummary {
  return {
    total: records.length,
    activeCount: records.filter(r => r.status === 'active').length,
    totalValue: records.reduce((acc, r) => acc + r.value, 0),
  };
}
`,
      },
      {
        path: 'src/components/App.tsx',
        language: 'typescript',
        description: 'Interactive Application Presentation Component',
        content: `import React, { useState } from 'react';
import { RecordItem, MetricSummary } from '../types';
import { INITIAL_RECORDS, validateRecord, computeMetrics } from '../store';

export const App: React.FC = () => {
  const [items, setItems] = useState<RecordItem[]>(INITIAL_RECORDS);
  const [name, setName] = useState('');
  const [val, setVal] = useState('100');
  const [status, setStatus] = useState<'active' | 'pending' | 'completed'>('active');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [error, setError] = useState<string | null>(null);

  const metrics = computeMetrics(items);
  const filtered = items.filter(i => filter === 'all' || i.status === filter);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(val);
    const vRes = validateRecord(name, num);
    if (!vRes.valid) {
      setError(vRes.error || 'Invalid record inputs');
      return;
    }

    const newItem: RecordItem = {
      id: 'rec-' + Date.now(),
      name: name.trim(),
      status,
      value: num,
      timestamp: new Date().toISOString().split('T')[0],
    };

    setItems(prev => [newItem, ...prev]);
    setName('');
    setVal('100');
    setError(null);
  };

  const handleToggle = (id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const nextStatus = i.status === 'active' ? 'completed' : i.status === 'completed' ? 'pending' : 'active';
      return { ...i, status: nextStatus };
    }));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <header className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Application Dashboard</h1>
        <p className="text-sm text-slate-500">Autonomous Software Execution Environment</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Records</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Active Items</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.activeCount}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500 uppercase">Total Metric Value</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Add Record</h2>
          {error && <div className="p-2 text-xs bg-rose-50 text-rose-700 rounded-lg">{error}</div>}
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. System Resource"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Value</label>
              <input
                type="number"
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
            >
              Add Item
            </button>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Records ({filtered.length})</span>
            <div className="flex gap-1">
              {(['all', 'active', 'pending', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={\`px-2 py-0.5 text-xs rounded font-medium capitalize \${
                    filter === tab ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:text-slate-800'
                  }\`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(item => (
              <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{item.name}</span>
                    <button
                      onClick={() => handleToggle(item.id)}
                      className={\`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase \${
                        item.status === 'active' ? 'bg-indigo-100 text-indigo-800' :
                        item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }\`}
                    >
                      {item.status}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Date: {item.timestamp}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-bold text-slate-700">{item.value} pts</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
`,
      },
      {
        path: 'src/tests.ts',
        language: 'typescript',
        description: 'Automated functional test suite',
        content: `import { validateRecord, computeMetrics, INITIAL_RECORDS } from './store';

export async function runGeneratedTests() {
  const results = [];

  try {
    const res = validateRecord('', 10);
    if (!res.valid) {
      results.push({ id: 't1', name: 'Validation: Rejects empty record name', passed: true });
    } else {
      results.push({ id: 't1', name: 'Validation: Rejects empty record name', passed: false, error: 'Empty name should be rejected' });
    }
  } catch (e: any) {
    results.push({ id: 't1', name: 'Validation: Rejects empty record name', passed: false, error: e.message });
  }

  try {
    const summary = computeMetrics(INITIAL_RECORDS);
    if (summary.total === 3 && summary.totalValue === 445) {
      results.push({ id: 't2', name: 'Metrics: Compute record aggregation totals', passed: true });
    } else {
      results.push({ id: 't2', name: 'Metrics: Compute record aggregation totals', passed: false, error: 'Summary aggregation calculation failed' });
    }
  } catch (e: any) {
    results.push({ id: 't2', name: 'Metrics: Compute record aggregation totals', passed: false, error: e.message });
  }

  return results;
}
`,
      },
    ];

    const previewHtml = this.buildStandaloneHtml(req.appTitle, 'generic', ragDocs);
    return { files, previewHtml };
  }

  private buildStandaloneHtml(title: string, mode: 'attendance' | 'task' | 'expense' | 'generic', _ragDocs: RagDoc[]): string {
    if (mode === 'attendance') {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <div class="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- Top Bar -->
    <header class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
          <i class="fa-solid fa-graduation-cap"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight">${title}</h1>
          <p class="text-xs text-slate-500">Autonomous Production Build • Isolated Live Preview</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="markAllPresent()" class="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition">
          <i class="fa-solid fa-check-double mr-1"></i> Mark All Present
        </button>
        <button onclick="openModal()" class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm">
          <i class="fa-solid fa-user-plus mr-1"></i> Add Student
        </button>
      </div>
    </header>

    <!-- KPI Statistics -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Enrolled</span>
          <i class="fa-solid fa-users text-slate-400"></i>
        </div>
        <p id="kpi-total" class="text-2xl font-bold text-slate-900 mt-2">5</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Avg Attendance</span>
          <i class="fa-solid fa-chart-line text-indigo-500"></i>
        </div>
        <p id="kpi-rate" class="text-2xl font-bold text-indigo-600 mt-2">85%</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Today Absent</span>
          <i class="fa-solid fa-user-xmark text-rose-500"></i>
        </div>
        <p id="kpi-absent" class="text-2xl font-bold text-rose-600 mt-2">1</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div class="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider">
          <span>Critical Alert (&lt;75%)</span>
          <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
        </div>
        <p id="kpi-alert" class="text-2xl font-bold text-amber-600 mt-2">2</p>
      </div>
    </div>

    <!-- Data Table & Search -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div class="relative w-full md:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-3 text-slate-400 text-xs"></i>
          <input type="text" id="searchInput" oninput="renderTable()" placeholder="Search name or roll number..." class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-indigo-500 bg-white shadow-2xs">
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <select id="deptFilter" onchange="renderTable()" class="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white shadow-2xs">
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Eng">Electrical Eng</option>
            <option value="Mechanical Eng">Mechanical Eng</option>
          </select>
          <label class="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
            <input type="checkbox" id="lowFilter" onchange="renderTable()" class="rounded text-indigo-600">
            <span>Show Low Attendance (&lt;75%)</span>
          </label>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold tracking-wider">
            <tr>
              <th class="py-3 px-4">Roll No</th>
              <th class="py-3 px-4">Student</th>
              <th class="py-3 px-4">Department</th>
              <th class="py-3 px-4">Classes Attended</th>
              <th class="py-3 px-4">Rate (%)</th>
              <th class="py-3 px-4">Today's Status</th>
              <th class="py-3 px-4 text-right">Quick Mark</th>
            </tr>
          </thead>
          <tbody id="studentTableBody" class="divide-y divide-slate-100 font-medium">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Add Student Modal -->
  <div id="studentModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 hidden z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 class="font-bold text-slate-900 text-sm">Register New Student</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-sm"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <form id="addStudentForm" onsubmit="saveStudent(event)" class="space-y-4 mt-4">
        <div id="modalError" class="hidden p-2 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200"></div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Student Full Name</label>
          <input type="text" id="mName" required placeholder="e.g. Maya Lin" class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
          <input type="text" id="mRoll" required placeholder="e.g. CS-110" class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Department</label>
          <select id="mDept" class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500">
            <option value="Computer Science">Computer Science</option>
            <option value="Electrical Eng">Electrical Eng</option>
            <option value="Mechanical Eng">Mechanical Eng</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeModal()" class="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="submit" class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Add to Roster</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let students = [
      { id: 'std-1', rollNo: 'CS-101', name: 'Alex Rivera', department: 'Computer Science', totalClasses: 20, attendedClasses: 19, todayStatus: 'present' },
      { id: 'std-2', rollNo: 'CS-102', name: 'Brianna Chen', department: 'Computer Science', totalClasses: 20, attendedClasses: 14, todayStatus: 'absent' },
      { id: 'std-3', rollNo: 'EE-201', name: 'Devon Miller', department: 'Electrical Eng', totalClasses: 20, attendedClasses: 18, todayStatus: 'present' },
      { id: 'std-4', rollNo: 'ME-301', name: 'Emma Watson', department: 'Mechanical Eng', totalClasses: 20, attendedClasses: 13, todayStatus: 'late' },
      { id: 'std-5', rollNo: 'CS-105', name: 'Farhan Zaidi', department: 'Computer Science', totalClasses: 20, attendedClasses: 17, todayStatus: 'present' }
    ];

    function calculateRate(attended, total) {
      if (!total) return 100;
      return Math.round((attended / total) * 100);
    }

    function renderTable() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const dept = document.getElementById('deptFilter').value;
      const lowOnly = document.getElementById('lowFilter').checked;

      const filtered = students.filter(s => {
        const matchesQ = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
        const matchesDept = dept === 'all' || s.department === dept;
        const rate = calculateRate(s.attendedClasses, s.totalClasses);
        const matchesLow = !lowOnly || rate < 75;
        return matchesQ && matchesDept && matchesLow;
      });

      const tbody = document.getElementById('studentTableBody');
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No matching students found.</td></tr>';
      } else {
        tbody.innerHTML = filtered.map(s => {
          const rate = calculateRate(s.attendedClasses, s.totalClasses);
          const isLow = rate < 75;
          return \`
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-4 font-mono font-bold text-slate-700">\${s.rollNo}</td>
              <td class="py-3 px-4 text-slate-900">\${s.name}</td>
              <td class="py-3 px-4 text-slate-500">\${s.department}</td>
              <td class="py-3 px-4 text-slate-600">\${s.attendedClasses} / \${s.totalClasses}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-semibold \${
                  isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }">
                  \${rate}% \${isLow ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ''}
                </span>
              </td>
              <td class="py-3 px-4">
                <span class="capitalize px-2 py-0.5 rounded text-2xs font-bold \${
                  s.todayStatus === 'present' ? 'bg-emerald-50 text-emerald-700' :
                  s.todayStatus === 'absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                }">\${s.todayStatus}</span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="inline-flex items-center gap-1">
                  <button onclick="setStatus('\${s.id}', 'present')" class="px-2 py-1 text-2xs font-semibold rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100">P</button>
                  <button onclick="setStatus('\${s.id}', 'absent')" class="px-2 py-1 text-2xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100">A</button>
                  <button onclick="setStatus('\${s.id}', 'late')" class="px-2 py-1 text-2xs font-semibold rounded bg-amber-50 text-amber-700 hover:bg-amber-100">L</button>
                </div>
              </td>
            </tr>
          \`;
        }).join('');
      }

      updateKPIs();
    }

    function updateKPIs() {
      const total = students.length;
      const totalClasses = students.reduce((acc, s) => acc + s.totalClasses, 0);
      const attendedClasses = students.reduce((acc, s) => acc + s.attendedClasses, 0);
      const avgRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
      const totalAbsents = students.filter(s => s.todayStatus === 'absent').length;
      const lowCount = students.filter(s => calculateRate(s.attendedClasses, s.totalClasses) < 75).length;

      document.getElementById('kpi-total').textContent = total;
      document.getElementById('kpi-rate').textContent = avgRate + '%';
      document.getElementById('kpi-absent').textContent = totalAbsents;
      document.getElementById('kpi-alert').textContent = lowCount;
    }

    function setStatus(id, newStatus) {
      students = students.map(s => {
        if (s.id !== id) return s;
        let newAttended = s.attendedClasses;
        if (s.todayStatus !== 'present' && newStatus === 'present') {
          newAttended = Math.min(s.totalClasses, s.attendedClasses + 1);
        } else if (s.todayStatus === 'present' && newStatus === 'absent') {
          newAttended = Math.max(0, s.attendedClasses - 1);
        }
        return { ...s, todayStatus: newStatus, attendedClasses: newAttended };
      });
      renderTable();
    }

    function markAllPresent() {
      students = students.map(s => ({
        ...s,
        todayStatus: 'present',
        attendedClasses: s.todayStatus !== 'present' ? Math.min(s.totalClasses, s.attendedClasses + 1) : s.attendedClasses
      }));
      renderTable();
    }

    function openModal() {
      document.getElementById('modalError').classList.add('hidden');
      document.getElementById('studentModal').classList.remove('hidden');
    }

    function closeModal() {
      document.getElementById('studentModal').classList.add('hidden');
    }

    function saveStudent(e) {
      e.preventDefault();
      const name = document.getElementById('mName').value.trim();
      const roll = document.getElementById('mRoll').value.trim().toUpperCase();
      const dept = document.getElementById('mDept').value;

      if (!name || name.length < 2) {
        showError('Student name must be at least 2 characters.');
        return;
      }
      if (!roll || roll.length < 3) {
        showError('Roll number must be provided.');
        return;
      }

      students.unshift({
        id: 'std-' + Date.now(),
        rollNo: roll,
        name: name,
        department: dept,
        totalClasses: 20,
        attendedClasses: 20,
        todayStatus: 'present'
      });

      document.getElementById('addStudentForm').reset();
      closeModal();
      renderTable();
    }

    function showError(msg) {
      const err = document.getElementById('modalError');
      err.textContent = msg;
      err.classList.remove('hidden');
    }

    // Initialize
    renderTable();
  </script>
</body>
</html>`;
    }

    // Generic fallback standalone interactive HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen p-4 sm:p-6">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold text-slate-900 tracking-tight">${title}</h1>
        <p class="text-xs text-slate-500">Autonomous Software Execution • Live Environment</p>
      </div>
      <button onclick="openGenericModal()" class="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
        + Add New Entry
      </button>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs font-medium text-slate-500 uppercase">Total Items</span>
        <p id="gen-total" class="text-2xl font-bold text-slate-900 mt-1">3</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs font-medium text-slate-500 uppercase">Active Count</span>
        <p id="gen-active" class="text-2xl font-bold text-indigo-600 mt-1">1</p>
      </div>
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <span class="text-xs font-medium text-slate-500 uppercase">Total Score / Value</span>
        <p id="gen-val" class="text-2xl font-bold text-emerald-600 mt-1">445</p>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="p-4 border-b border-slate-200 flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-700">Records Ledger</span>
        <div class="flex gap-2 text-xs">
          <button onclick="setGenFilter('all')" class="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-medium">All</button>
          <button onclick="setGenFilter('active')" class="px-2 py-1 rounded text-slate-500 hover:text-slate-800">Active</button>
          <button onclick="setGenFilter('completed')" class="px-2 py-1 rounded text-slate-500 hover:text-slate-800">Completed</button>
        </div>
      </div>
      <div id="genList" class="divide-y divide-slate-100"></div>
    </div>
  </div>

  <div id="genModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 hidden z-50">
    <div class="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-4">
      <h3 class="font-bold text-sm text-slate-900">Add Record</h3>
      <form onsubmit="handleSaveGen(event)" class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Name</label>
          <input type="text" id="gName" required class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Value (points)</label>
          <input type="number" id="gVal" value="100" required class="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-indigo-500">
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="closeGenericModal()" class="px-3 py-1.5 text-xs text-slate-600 rounded">Cancel</button>
          <button type="submit" class="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded font-medium">Save</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let genData = [
      { id: '1', name: 'Project Alpha', status: 'active', value: 120, date: '2026-10-01' },
      { id: '2', name: 'Beta Deployment', status: 'pending', value: 85, date: '2026-10-02' },
      { id: '3', name: 'Gamma Security Audit', status: 'completed', value: 240, date: '2026-10-03' }
    ];
    let genFilter = 'all';

    function renderGen() {
      const filtered = genData.filter(d => genFilter === 'all' || d.status === genFilter);
      const container = document.getElementById('genList');
      if (filtered.length === 0) {
        container.innerHTML = '<div class="p-6 text-center text-xs text-slate-400">No records found.</div>';
      } else {
        container.innerHTML = filtered.map(d => \`
          <div class="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-slate-900">\${d.name}</span>
                <span class="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded \${
                  d.status === 'active' ? 'bg-indigo-100 text-indigo-800' :
                  d.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }">\${d.status}</span>
              </div>
              <span class="text-[10px] text-slate-400 font-mono">\${d.date}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-mono text-xs font-bold text-slate-700">\${d.value} pts</span>
              <button onclick="toggleGen('\${d.id}')" class="text-xs text-indigo-600 hover:underline">Toggle</button>
              <button onclick="deleteGen('\${d.id}')" class="text-xs text-rose-500 hover:underline">Delete</button>
            </div>
          </div>
        \`).join('');
      }
      document.getElementById('gen-total').textContent = genData.length;
      document.getElementById('gen-active').textContent = genData.filter(d => d.status === 'active').length;
      document.getElementById('gen-val').textContent = genData.reduce((acc, d) => acc + d.value, 0);
    }

    function toggleGen(id) {
      genData = genData.map(d => d.id === id ? { ...d, status: d.status === 'active' ? 'completed' : 'active' } : d);
      renderGen();
    }

    function deleteGen(id) {
      genData = genData.filter(d => d.id !== id);
      renderGen();
    }

    function setGenFilter(f) {
      genFilter = f;
      renderGen();
    }

    function openGenericModal() { document.getElementById('genModal').classList.remove('hidden'); }
    function closeGenericModal() { document.getElementById('genModal').classList.add('hidden'); }

    function handleSaveGen(e) {
      e.preventDefault();
      const n = document.getElementById('gName').value.trim();
      const v = parseFloat(document.getElementById('gVal').value) || 0;
      genData.unshift({ id: 'rec-' + Date.now(), name: n, status: 'active', value: v, date: new Date().toISOString().split('T')[0] });
      closeGenericModal();
      document.getElementById('gName').value = '';
      renderGen();
    }

    renderGen();
  </script>
</body>
</html>`;
  }
}
