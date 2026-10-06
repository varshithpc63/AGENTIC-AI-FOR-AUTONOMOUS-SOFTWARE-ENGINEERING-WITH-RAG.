import { GoogleGenAI } from '@google/genai';
import { RequirementSpec } from '../types.js';
import { callGeminiSafe, getGeminiClient } from '../geminiHelper.js';

export class RequirementAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.ai = getGeminiClient();
  }

  public async analyze(prompt: string): Promise<RequirementSpec> {
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const text = await callGeminiSafe(
          this.ai,
          `You are the Lead Requirements Engineering Agent in an Autonomous Software Engineer system.
Analyze the following user software requirement and return a structured JSON response matching the schema.

User Requirement:
"${prompt}"

Rules:
1. Extract a clear application title.
2. Formulate 4 to 6 core features with priorities ('high', 'medium', 'low').
3. List user personas.
4. Extract user inputs, system outputs, technical constraints (e.g. client-side persistence, responsive layout, modular architecture).
5. Specify 4 to 6 concrete, verifiable acceptance criteria that automated tests can validate.

Output MUST be valid JSON only. Do not wrap in markdown or backticks if possible, or use standard JSON.
JSON format:
{
  "appTitle": "string",
  "summary": "string",
  "userPersonas": ["string"],
  "coreFeatures": [{"id": "f1", "title": "string", "description": "string", "priority": "high"}],
  "inputs": ["string"],
  "outputs": ["string"],
  "constraints": ["string"],
  "acceptanceCriteria": ["string"]
}`
        );

        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned) as RequirementSpec;
          if (parsed.appTitle && Array.isArray(parsed.coreFeatures)) {
            return parsed;
          }
        }
      } catch {
        // Fall through cleanly
      }
    }

    // High quality deterministic domain fallback for standard and custom requests
    return this.generateDefaultRequirements(prompt);
  }

  private generateDefaultRequirements(prompt: string): RequirementSpec {
    const isAttendance = /attendance/i.test(prompt);
    const isTask = /task|todo|kanban/i.test(prompt);
    const isExpense = /expense|budget|finance/i.test(prompt);

    if (isAttendance) {
      return {
        appTitle: 'Student Attendance Management System',
        summary: 'A comprehensive educational tool to monitor student presence, record daily class attendance, calculate overall attendance percentages, and flag low-attendance alerts.',
        userPersonas: ['Teacher / Instructor', 'Academic Administrator', 'Student / Guardian'],
        coreFeatures: [
          {
            id: 'feat-1',
            title: 'Student Roster Registry',
            description: 'Add, edit, and manage enrolled students with roll numbers, names, and contact details.',
            priority: 'high',
          },
          {
            id: 'feat-2',
            title: 'Daily Attendance Marking',
            description: 'Record status (Present, Absent, Late, Excused) with date picker and bulk mark actions.',
            priority: 'high',
          },
          {
            id: 'feat-3',
            title: 'Statistical KPI Dashboard',
            description: 'Compute real-time attendance rate %, total classes conducted, and present vs absent ratios.',
            priority: 'high',
          },
          {
            id: 'feat-4',
            title: 'Search & Low-Attendance Filter',
            description: 'Filter students whose attendance falls below critical 75% threshold with quick search.',
            priority: 'medium',
          },
          {
            id: 'feat-5',
            title: 'Audit Log & Export Support',
            description: 'Review historical logs and export records to CSV/JSON format for reporting.',
            priority: 'low',
          },
        ],
        inputs: ['Student Name', 'Roll Number', 'Class/Department', 'Date', 'Attendance Status (Present/Absent/Late/Excused)', 'Search Query'],
        outputs: ['Daily Attendance Register', 'Attendance Percentage per Student', 'Low Attendance Warning Badges', 'Overall Class Summary Statistics'],
        constraints: [
          'Client-side LocalStorage persistence for offline continuity',
          'Fast search and filtering without page reloads',
          'Responsive desktop, tablet, and mobile interface',
          'Input validation preventing duplicate roll numbers and empty student names',
        ],
        acceptanceCriteria: [
          'Verify new student registration increments total roster count',
          'Verify attendance marking calculates correct percentage: (present / total) * 100',
          'Verify validation rejects empty student name and invalid roll number',
          'Verify students with attendance < 75% are flagged with warning alert',
          'Verify filter by status properly subsets the student list',
        ],
      };
    }

    if (isTask) {
      return {
        appTitle: 'Kanban Task & Project Management System',
        summary: 'An agile task tracking application with status lanes, priority tagging, due dates, and real-time progress analytics.',
        userPersonas: ['Project Manager', 'Software Engineer', 'Team Member'],
        coreFeatures: [
          { id: 'feat-1', title: 'Task Lifecycle Columns', description: 'Manage tasks across To Do, In Progress, Review, and Done stages.', priority: 'high' },
          { id: 'feat-2', title: 'Task Creation & Metadata', description: 'Create rich tasks with priority, assignee, due date, and descriptions.', priority: 'high' },
          { id: 'feat-3', title: 'Progress Velocity Analytics', description: 'Compute completed task percentage and workload distribution.', priority: 'medium' },
          { id: 'feat-4', title: 'Keyword Search & Priority Filter', description: 'Filter tasks by priority level (Urgent/High/Medium/Low) and search query.', priority: 'medium' },
        ],
        inputs: ['Task Title', 'Description', 'Priority', 'Category', 'Due Date', 'Status'],
        outputs: ['Kanban Board View', 'Completion Metric Rate', 'Overdue Task Alerts', 'Filtered Task List'],
        constraints: ['Zero backend dependency with local storage', 'Responsive multi-column drag or click lane transitions', 'Form validation on required title'],
        acceptanceCriteria: [
          'Verify adding a new task appends it to default column',
          'Verify status update transitions task to target stage',
          'Verify completion percentage reflects ratio of Done tasks',
          'Verify search correctly filters tasks by title keyword',
        ],
      };
    }

    if (isExpense) {
      return {
        appTitle: 'Personal Expense & Budget Tracker',
        summary: 'A financial tracker to log expenses, categorize spending, track monthly budgets, and analyze spending breakdowns.',
        userPersonas: ['Individual Budgeter', 'Small Business Owner'],
        coreFeatures: [
          { id: 'feat-1', title: 'Transaction Logging', description: 'Record income and expenses with amount, date, and category.', priority: 'high' },
          { id: 'feat-2', title: 'Category Breakdown & Charts', description: 'Visualize spending distribution across Food, Utilities, Transport, etc.', priority: 'high' },
          { id: 'feat-3', title: 'Monthly Budget Limit Alerts', description: 'Set spending limits and alert when expenditure exceeds 90% threshold.', priority: 'medium' },
          { id: 'feat-4', title: 'Transaction Search & Filter', description: 'Search and filter transactions by date range and category.', priority: 'medium' },
        ],
        inputs: ['Amount', 'Category', 'Transaction Type (Income/Expense)', 'Date', 'Notes'],
        outputs: ['Total Balance', 'Total Expenses', 'Category Spending Breakdown', 'Budget Warning Indicators'],
        constraints: ['Numeric validation for positive transaction values', 'Persistent local storage', 'Accessible color coding'],
        acceptanceCriteria: [
          'Verify transaction creation updates total balance',
          'Verify negative amounts or non-numeric inputs are rejected',
          'Verify category aggregation correctly computes category totals',
          'Verify filter by date or category returns matching entries',
        ],
      };
    }

    // Generic prompt extractor
    const cleanTitle = prompt.length > 50 ? prompt.slice(0, 48) + '...' : prompt;
    const titleWords = prompt.split(' ').slice(0, 5).join(' ');
    const formattedTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);

    return {
      appTitle: `${formattedTitle} Application`,
      summary: `An autonomous full-stack software application built to satisfy: "${cleanTitle}". Features robust data management, reactive UI, and automated validation.`,
      userPersonas: ['Primary End User', 'System Administrator', 'Auditor / Viewer'],
      coreFeatures: [
        { id: 'feat-1', title: 'Core Entity Management', description: 'Complete CRUD operations for managing system records with live validation.', priority: 'high' },
        { id: 'feat-2', title: 'Real-Time KPI & Statistics', description: 'Automated calculation of key metrics, summary counts, and distribution ratios.', priority: 'high' },
        { id: 'feat-3', title: 'Smart Search & Filtering', description: 'Instant multi-field search and category filtering with reactive updates.', priority: 'medium' },
        { id: 'feat-4', title: 'Data Persistence & Export', description: 'Local storage caching and export capabilities.', priority: 'low' },
      ],
      inputs: ['Record Identifier', 'Title / Name', 'Category / Status', 'Timestamp / Date', 'Numeric Metric Values'],
      outputs: ['Interactive Data Table', 'Summary Metric Cards', 'Activity History', 'Filtered Views'],
      constraints: ['Client-side persistence', 'Input validation on all mandatory fields', 'Mobile-responsive UI'],
      acceptanceCriteria: [
        'Verify record creation increases total dataset count',
        'Verify required field validation rejects empty submissions',
        'Verify metric calculations accurately aggregate record values',
        'Verify filter filters records matching the specified criteria',
      ],
    };
  }
}
