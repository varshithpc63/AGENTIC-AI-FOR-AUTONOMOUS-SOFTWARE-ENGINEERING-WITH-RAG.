import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { AutonomousEngineerOrchestrator } from './server/orchestrator.js';
import { SoftwareProject } from './server/types.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const orchestrator = new AutonomousEngineerOrchestrator();

// Active projects cache
const activeProjects = new Map<string, SoftwareProject>();

// 1. Sample Software Requirements
app.get('/api/samples', (_req, res) => {
  res.json({
    samples: [
      {
        id: 'sample-1',
        title: 'Student Attendance Management System',
        prompt: 'Build a student attendance management system where teachers can register students, mark daily attendance (present, absent, late), view real-time attendance rate percentages, filter low-attendance students (<75%), and export daily records.',
        tag: 'Education & Operations',
      },
      {
        id: 'sample-2',
        title: 'Kanban Task & Project Management Board',
        prompt: 'Build an agile Kanban project management board with To Do, In Progress, Review, and Done columns. Allow creating tasks with priority tags, assignee names, due dates, instant search, and completion velocity metrics.',
        tag: 'Productivity & Agile',
      },
      {
        id: 'sample-3',
        title: 'Personal Expense & Budget Tracker',
        prompt: 'Build a personal expense and budget management system to track income and expenses across categories (Food, Housing, Tech), calculate monthly net balance, set budget thresholds, and show category spending breakdown.',
        tag: 'FinTech & Analytics',
      },
      {
        id: 'sample-4',
        title: 'Software Bug & Issue Tracker',
        prompt: 'Build a software bug tracker with severity levels (Critical, Major, Minor), reproducible steps, status workflow (Open, Triaged, Fixed, Closed), assignee tagging, and resolution time KPI statistics.',
        tag: 'DevOps & QA',
      },
    ],
  });
});

// 2. Technical Knowledge Base Documents
app.get('/api/knowledge-base', async (_req, res) => {
  try {
    const kbDir = path.resolve(process.cwd(), 'knowledge_base');
    const files = await fs.readdir(kbDir);
    const docs = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(kbDir, file), 'utf-8');
        const lines = content.split('\n');
        const title = lines[0].replace(/^#\s*/, '') || file;
        docs.push({
          filename: file,
          title,
          content,
          sizeBytes: content.length,
        });
      }
    }
    res.json({ docs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to read knowledge base: ' + message });
  }
});

// 3. Generate Autonomous Software via SSE Stream
app.get('/api/generate-stream', async (req, res) => {
  const prompt = (req.query.prompt as string) || 'Build a student attendance management system.';

  // Setup Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Pipeline initialized' })}\n\n`);

  try {
    const project = await orchestrator.runPipeline(prompt, (updatedProject) => {
      // Stream state snapshot on every progress step
      res.write(`data: ${JSON.stringify({ type: 'update', project: updatedProject })}\n\n`);
    });

    activeProjects.set(project.id, project);
    res.write(`data: ${JSON.stringify({ type: 'complete', project })}\n\n`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
  } finally {
    res.end();
  }
});

// 3.5. Modify Existing Generated Application via SSE Stream
app.get('/api/modify-stream', async (req, res) => {
  const projectId = (req.query.projectId as string) || '';
  const instruction = (req.query.instruction as string) || '';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Find active project by id or fallback to most recent
  let project = activeProjects.get(projectId);
  if (!project && activeProjects.size > 0) {
    project = Array.from(activeProjects.values()).pop();
  }

  if (!project) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'No active application found to modify. Please generate an application first.' })}\n\n`);
    res.end();
    return;
  }

  res.write(`data: ${JSON.stringify({ type: 'start', message: 'Modification analysis started' })}\n\n`);

  try {
    const updated = await orchestrator.modifyProject(project, instruction, (progressProject) => {
      res.write(`data: ${JSON.stringify({ type: 'update', project: progressProject })}\n\n`);
    });

    activeProjects.set(updated.id, updated);
    res.write(`data: ${JSON.stringify({ type: 'complete', project: updated })}\n\n`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
  } finally {
    res.end();
  }
});

// 4. Re-run tests in isolated sandbox
app.post('/api/retest', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Missing files array' });
    }
    const report = await orchestrator.retestProject({
      id: 'sandbox-run',
      userPrompt: '',
      requirements: null,
      design: null,
      ragKnowledge: [],
      files,
      testReport: null,
      debugAttempts: [],
      previewHtml: '',
      status: 'generating',
      activeAgent: 'testing',
      agentProgress: {
        requirement: { status: 'completed' },
        design: { status: 'completed' },
        rag: { status: 'completed' },
        code: { status: 'completed' },
        execution: { status: 'completed' },
        testing: { status: 'running' },
        debug: { status: 'idle' },
        completed: { status: 'idle' },
      },
      logs: [],
      createdAt: new Date().toISOString(),
    });
    return res.json({ report });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
});

// 4.5. Update files directly from Code Editor and re-compile in sandbox runner
app.post('/api/update-files', async (req, res) => {
  try {
    const { projectId, files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'Missing files array' });
    }

    let project = activeProjects.get(projectId);
    if (!project && activeProjects.size > 0) {
      project = Array.from(activeProjects.values()).pop();
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    project.files = files;

    const { projectDir, projectType } = await executionManager.storeProjectFiles(
      project.id,
      files,
      project.requirements
    );

    const buildRes = await executionManager.buildProject(project.id, projectDir, projectType);
    const testReport = await orchestrator.retestProject(project);

    if (buildRes.success) {
      project.buildStatus = 'success';
      project.buildError = undefined;
      const runtime = executionManager.registerRunningApp(
        project.id,
        projectDir,
        projectType,
        buildRes.distDir || path.join(projectDir, 'dist')
      );
      project.previewUrl = runtime.previewUrl + '?t=' + Date.now();
      project.runtimeStatus = 'running';
    } else {
      project.buildStatus = 'failed';
      project.buildError = buildRes.error;
      project.runtimeStatus = 'failed';
      testReport.buildError = buildRes.error;
      testReport.failed = Math.max(1, testReport.failed);
    }

    project.testReport = testReport;
    res.json({ project, testReport, buildRes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 5. Test Healing / Debug demonstration: deliberately introduces a failing test or real bug
// to demonstrate how the Debug Agent diagnoses and fixes genuine errors
app.post('/api/simulate-genuine-test-failure', async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = activeProjects.get(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Modify a validator or calculation function to simulate a genuine logic defect
    const storeFileIndex = project.files.findIndex(f => f.path.includes('store.ts'));
    if (storeFileIndex !== -1) {
      // Break the calculation or validation logic
      project.files[storeFileIndex].content = project.files[storeFileIndex].content.replace(
        'if (!name || name.trim().length < 2)',
        'if (false)' // creates an actual bug where empty student names are accepted
      );
    }

    // Re-run testing agent in isolated execution environment
    const testReport = await orchestrator.retestProject(project);
    project.testReport = testReport;

    res.json({ project, testReport });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 6. Run Debug Agent on failing project
app.post('/api/run-debug-agent', async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = activeProjects.get(projectId);
    if (!project || !project.testReport) {
      return res.status(404).json({ error: 'Project or test report not found' });
    }

    // Re-run full pipeline debug cycle
    // Import DebugAgent
    const { DebugAgent } = await import('./server/agents/debugAgent.js');
    const { TestingAgent } = await import('./server/agents/testingAgent.js');
    const debugAgent = new DebugAgent();
    const testAgent = new TestingAgent();

    const attemptsCount = project.debugAttempts.length + 1;
    const debugResult = await debugAgent.diagnoseAndFix(
      project.files,
      project.testReport,
      attemptsCount,
      project.requirements || {
        appTitle: 'Software Application',
        summary: '',
        userPersonas: [],
        coreFeatures: [],
        inputs: [],
        outputs: [],
        constraints: [],
        acceptanceCriteria: [],
      }
    );

    project.files = debugResult.updatedFiles;
    const retestReport = await testAgent.runTests(project.files);
    project.testReport = retestReport;

    debugResult.attempt.postTestReport = { passed: retestReport.passed, failed: retestReport.failed };
    debugResult.attempt.resolved = retestReport.failed === 0;
    project.debugAttempts.push(debugResult.attempt);

    project.logs.push({
      id: 'log-' + Math.random().toString(36).substring(2, 8),
      agent: 'debug',
      timestamp: new Date().toLocaleTimeString(),
      level: debugResult.attempt.resolved ? 'success' : 'warn',
      message: `Debug Agent applied fix: "${debugResult.attempt.fixApplied}". Result: ${retestReport.passed}/${retestReport.totalTests} tests passing.`,
    });

    res.json({ project, attempt: debugResult.attempt, testReport: retestReport });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// 7. Live Preview Runner & Isolated Application Serving
const executionManager = orchestrator.getExecutionManager();

// Serve assets and index.html for running project
app.use('/api/preview/:projectId', (req, res, next) => {
  const { projectId } = req.params;
  const runtime = executionManager.getRuntime(projectId);

  // If URL doesn't have trailing slash for the root path, redirect once
  const urlPath = req.originalUrl.split('?')[0];
  if (!urlPath.endsWith('/') && req.path === '/') {
    const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
    return res.redirect(302, `${urlPath}/${query}`);
  }

  if (!runtime) {
    return res.status(404).send(`<!DOCTYPE html>
<html>
<head><title>Project Not Found</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen p-6 font-sans">
  <div class="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-md text-center">
    <h2 class="text-lg font-bold text-rose-400">Application Not Initialized</h2>
    <p class="text-xs text-slate-400 mt-2">The project build is either compiling or has not been created yet.</p>
  </div>
</body>
</html>`);
  }

  if (runtime.status === 'stopped') {
    return res.status(503).send(`<!DOCTYPE html>
<html>
<head><title>Application Stopped</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-950 text-slate-200 flex items-center justify-center min-h-screen p-6 font-sans">
  <div class="bg-slate-900 p-6 rounded-xl border border-slate-800 max-w-md text-center">
    <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">⏸</div>
    <h2 class="text-base font-bold text-slate-200">Application Execution Paused</h2>
    <p class="text-xs text-slate-400 mt-1">Application process is stopped. Click "Run" in the toolbar above to restart execution.</p>
  </div>
</body>
</html>`);
  }

  // Use express.static to serve dist directory
  express.static(runtime.distDir, {
    index: 'index.html',
    extensions: ['html', 'js', 'css', 'json', 'svg', 'png'],
    fallthrough: true,
  })(req, res, () => {
    // If not found in dist, check if requesting index.html fallback
    if (req.path === '/' || req.path === '') {
      res.sendFile(path.join(runtime.distDir, 'index.html'));
    } else {
      res.status(404).send('Asset not found');
    }
  });
});

// Toggle application status (Run / Stop)
app.post('/api/project/status', (req, res) => {
  const { projectId, status } = req.body;
  if (!projectId || !status) {
    return res.status(400).json({ error: 'Missing projectId or status' });
  }
  const ok = executionManager.setRuntimeStatus(projectId, status);
  res.json({ ok, status });
});

// Setup Vite development middlewares or production static hosting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = Number(process.env.PORT) || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Autonomous Software Engineer running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
