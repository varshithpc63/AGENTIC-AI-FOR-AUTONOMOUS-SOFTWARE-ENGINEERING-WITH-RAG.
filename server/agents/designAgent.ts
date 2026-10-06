import { GoogleGenAI } from '@google/genai';
import { RequirementSpec, SystemDesignSpec } from '../types.js';
import { callGeminiSafe, getGeminiClient } from '../geminiHelper.js';

export class DesignAgent {
  private ai: GoogleGenAI | null = null;

  constructor() {
    this.ai = getGeminiClient();
  }

  public async design(requirements: RequirementSpec): Promise<SystemDesignSpec> {
    if (this.ai && process.env.GEMINI_API_KEY) {
      try {
        const text = await callGeminiSafe(
          this.ai,
          `You are the Lead Systems Architect Agent in an Autonomous Software Engineer system.
Convert the following software requirements into a comprehensive technical design specification.

Requirements:
${JSON.stringify(requirements, null, 2)}

Rules:
1. Provide a clear architecture overview explaining frontend structure, state layer, and isolated execution.
2. Define 4 to 6 modular UI components with their types ('layout', 'table', 'form', 'modal', 'stat', 'filter') and responsibilities.
3. Define strict data models with fields, types, and descriptions.
4. Specify the state management strategy.
5. Detail 3 to 5 core user interaction flows.
6. Choose a cohesive color theme (e.g. 'Indigo & Slate Modern', 'Emerald Enterprise', etc.).

Return strictly valid JSON matching this schema:
{
  "architectureOverview": "string",
  "components": [{"name": "string", "type": "table", "responsibility": "string"}],
  "dataModels": [{"name": "string", "fields": [{"name": "string", "type": "string", "required": true, "description": "string"}]}],
  "stateStrategy": "string",
  "userFlow": ["string"],
  "colorTheme": "string"
}`
        );

        if (text) {
          const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned) as SystemDesignSpec;
          if (parsed.architectureOverview && Array.isArray(parsed.components) && Array.isArray(parsed.dataModels)) {
            return parsed;
          }
        }
      } catch {
        // Fall through to deterministic domain generator
      }
    }

    return this.generateDefaultDesign(requirements);
  }

  private generateDefaultDesign(req: RequirementSpec): SystemDesignSpec {
    const isAttendance = /attendance/i.test(req.appTitle);

    if (isAttendance) {
      return {
        architectureOverview: 'Single-Page Application architected with a decoupled presentation tier, centralized in-memory & LocalStorage state store, automated validation pipeline, and reactive statistical derivations.',
        components: [
          { name: 'HeaderBar', type: 'layout', responsibility: 'Renders application title, quick actions (New Student, Mark All Present, Reset), and live date display.' },
          { name: 'KpiStatGrid', type: 'stat', responsibility: 'Displays computed metrics: Total Students, Overall Attendance Rate %, Total Absences, and Critical Alerts.' },
          { name: 'FilterToolbar', type: 'filter', responsibility: 'Provides instant search input, department/class filter, and low-attendance toggle filter.' },
          { name: 'AttendanceRosterTable', type: 'table', responsibility: 'Renders student records with avatar, roll number, status badges, and quick mark buttons.' },
          { name: 'AddStudentModal', type: 'modal', responsibility: 'Form dialog for registering new students with client-side field validation.' },
        ],
        dataModels: [
          {
            name: 'Student',
            fields: [
              { name: 'id', type: 'string', required: true, description: 'Unique UUID' },
              { name: 'rollNo', type: 'string', required: true, description: 'Academic roll identifier' },
              { name: 'name', type: 'string', required: true, description: 'Full student name' },
              { name: 'department', type: 'string', required: true, description: 'Academic department / grade' },
              { name: 'totalClasses', type: 'number', required: true, description: 'Total classes attended or held' },
              { name: 'attendedClasses', type: 'number', required: true, description: 'Number of attended sessions' },
              { name: 'todayStatus', type: "'present' | 'absent' | 'late' | 'excused'", required: true, description: 'Current day status' },
              { name: 'email', type: 'string', required: false, description: 'Contact email' },
            ],
          },
        ],
        stateStrategy: 'Centralized reactive store with custom React hook (`useAttendanceStore`) backed by LocalStorage with initial mock seed recovery.',
        userFlow: [
          'Instructor views real-time attendance rate on KPI cards upon opening.',
          'Instructor types a student name in the search bar to locate specific students instantly.',
          'Instructor clicks Present/Absent/Late buttons to update attendance with immediate percentage recalculation.',
          'Instructor clicks "+ Add Student" to register a new pupil, validating input constraints.',
          'Students below 75% are visually flagged with an alert badge to prompt teacher action.',
        ],
        colorTheme: 'Indigo & Slate Modern (Primary: #4F46E5, Background: #F8FAFC, Surface: #FFFFFF)',
      };
    }

    return {
      architectureOverview: 'Modular component-based architecture featuring reactive state synchronization, isolated test harness integration, and responsive layout hierarchy.',
      components: [
        { name: 'AppHeader', type: 'layout', responsibility: 'Application navigation, title banner, and global action controls.' },
        { name: 'MetricsOverview', type: 'stat', responsibility: 'Real-time KPI calculations and summary performance badges.' },
        { name: 'DataControlToolbar', type: 'filter', responsibility: 'Search filter input and category dropdown selectors.' },
        { name: 'RecordsDataTable', type: 'table', responsibility: 'Interactive data listing with sort, status toggles, and delete actions.' },
        { name: 'CreateItemModal', type: 'modal', responsibility: 'Controlled form for new record submission with live input validation.' },
      ],
      dataModels: [
        {
          name: 'ItemRecord',
          fields: [
            { name: 'id', type: 'string', required: true, description: 'Unique identifier' },
            { name: 'title', type: 'string', required: true, description: 'Primary record label' },
            { name: 'category', type: 'string', required: true, description: 'Grouping taxonomy' },
            { name: 'status', type: 'string', required: true, description: 'Active status state' },
            { name: 'value', type: 'number', required: true, description: 'Numeric metric' },
            { name: 'createdAt', type: 'string', required: true, description: 'ISO Timestamp' },
          ],
        },
      ],
      stateStrategy: 'Decoupled reactive state hook with auto-persistence in LocalStorage and validation guards.',
      userFlow: [
        'User loads application and reviews top-level metrics.',
        'User interacts with filter controls to slice data.',
        'User adds new records using modal dialog with immediate feedback.',
        'User modifies or deletes records with instant state recalculation.',
      ],
      colorTheme: 'Slate & Blue Enterprise (#2563EB primary, #0F172A dark slate text, #F1F5F9 background)',
    };
  }
}
