import path from 'node:path';
import fs from 'node:fs/promises';
import esbuild from 'esbuild';
import http from 'node:http';
import { GeneratedFile, RequirementSpec } from '../types.js';

export interface ProjectRuntime {
  projectId: string;
  projectDir: string;
  projectType: 'react' | 'static-html' | 'node';
  status: 'running' | 'stopped' | 'failed';
  previewUrl: string;
  distDir: string;
  buildError?: string;
  runtimeError?: string;
  updatedAt: string;
}

export class ExecutionManager {
  private baseDir = path.resolve('/tmp', 'autonomous_projects');
  private runtimes = new Map<string, ProjectRuntime>();

  constructor() {
    // Ensure base directory exists
    fs.mkdir(this.baseDir, { recursive: true }).catch(() => {});
  }

  public getRuntime(projectId: string): ProjectRuntime | undefined {
    return this.runtimes.get(projectId);
  }

  public setRuntimeStatus(projectId: string, status: 'running' | 'stopped'): boolean {
    const runtime = this.runtimes.get(projectId);
    if (!runtime) return false;
    runtime.status = status;
    runtime.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * 1. Store generated files onto filesystem in isolated workspace
   */
  public async storeProjectFiles(
    projectId: string,
    files: GeneratedFile[],
    req?: RequirementSpec | null
  ): Promise<{ projectDir: string; projectType: 'react' | 'static-html' | 'node' }> {
    const projectDir = path.join(this.baseDir, projectId);
    await fs.mkdir(projectDir, { recursive: true });

    // Write all generated files
    for (const file of files) {
      const fullPath = path.join(projectDir, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');
    }

    // Detect project type
    const projectType = this.detectProjectType(files);

    // If React project, ensure entry points (main.tsx and index.html) exist
    if (projectType === 'react') {
      await this.ensureReactEntryPoints(projectDir, files, req);
    } else if (projectType === 'static-html') {
      await this.ensureStaticEntryPoints(projectDir, files, req);
    }

    // Ensure package.json exists
    const packageJsonPath = path.join(projectDir, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      const pkg = {
        name: projectId,
        version: '1.0.0',
        private: true,
        type: 'module',
        dependencies: {
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf-8');
    }

    return { projectDir, projectType };
  }

  /**
   * 2. Detect project type from file list and contents
   */
  public detectProjectType(files: GeneratedFile[]): 'react' | 'static-html' | 'node' {
    const hasTsx = files.some((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    const hasReactImport = files.some(
      (f) => f.content.includes("from 'react'") || f.content.includes('from "react"')
    );

    if (hasTsx || hasReactImport) {
      return 'react';
    }

    const hasHtml = files.some((f) => f.path.endsWith('.html'));
    if (hasHtml) {
      return 'static-html';
    }

    return 'react'; // Default to React app
  }

  /**
   * 3. Build project in real isolated environment using esbuild
   */
  public async buildProject(
    projectId: string,
    projectDir: string,
    projectType: 'react' | 'static-html' | 'node'
  ): Promise<{ success: boolean; error?: string; distDir?: string }> {
    const distDir = path.join(projectDir, 'dist');
    await fs.mkdir(path.join(distDir, 'assets'), { recursive: true });

    if (projectType === 'react') {
      const mainTsxPath = path.join(projectDir, 'src', 'main.tsx');

      try {
        await esbuild.build({
          entryPoints: [mainTsxPath],
          bundle: true,
          outfile: path.join(distDir, 'assets', 'main.js'),
          format: 'esm',
          target: 'es2022',
          loader: {
            '.tsx': 'tsx',
            '.ts': 'ts',
            '.jsx': 'jsx',
            '.js': 'js',
            '.json': 'json',
            '.css': 'css',
          },
          define: {
            'process.env.NODE_ENV': '"development"',
          },
          nodePaths: [path.resolve(process.cwd(), 'node_modules')],
          logLevel: 'silent',
        });

        // Copy or write dist/index.html
        const srcHtmlPath = path.join(projectDir, 'index.html');
        let htmlContent = '';
        try {
          htmlContent = await fs.readFile(srcHtmlPath, 'utf-8');
        } catch {
          htmlContent = this.getDefaultIndexHtml('Generated Application');
        }

        await fs.writeFile(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
        return { success: true, distDir };
      } catch (err: unknown) {
        let errorMsg = 'Compilation failure in generated source';
        if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as any).errors)) {
          const buildErrors = (err as any).errors;
          errorMsg = buildErrors
            .map((e: any) => {
              const file = e.location?.file ? path.relative(projectDir, e.location.file) : 'src';
              const line = e.location?.line || '?';
              const col = e.location?.column || '?';
              return `[${file}:${line}:${col}] ${e.text}`;
            })
            .join('\n');
        } else if (err instanceof Error) {
          errorMsg = err.message;
        }

        return { success: false, error: errorMsg };
      }
    } else {
      // Static HTML project
      try {
        const srcHtmlPath = path.join(projectDir, 'index.html');
        const content = await fs.readFile(srcHtmlPath, 'utf-8');
        await fs.writeFile(path.join(distDir, 'index.html'), content, 'utf-8');
        return { success: true, distDir };
      } catch (err: unknown) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Missing index.html',
        };
      }
    }
  }

  /**
   * 4. Register and run the built project in execution environment
   */
  public registerRunningApp(
    projectId: string,
    projectDir: string,
    projectType: 'react' | 'static-html' | 'node',
    distDir: string
  ): ProjectRuntime {
    const runtime: ProjectRuntime = {
      projectId,
      projectDir,
      projectType,
      status: 'running',
      previewUrl: `/api/preview/${projectId}/`,
      distDir,
      updatedAt: new Date().toISOString(),
    };
    this.runtimes.set(projectId, runtime);
    return runtime;
  }

  /**
   * 5. Verify that preview URL is actually reachable and returns HTTP 200
   */
  public async verifyReachable(
    previewUrl: string,
    port: number = Number(process.env.PORT) || 3000
  ): Promise<{ reachable: boolean; status?: number; error?: string }> {
    return new Promise((resolve) => {
      const options = {
        hostname: '127.0.0.1',
        port,
        path: previewUrl,
        method: 'GET',
        timeout: 1500,
      };

      const req = http.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ reachable: true, status: res.statusCode });
        } else {
          resolve({
            reachable: false,
            status: res.statusCode,
            error: `Preview endpoint returned HTTP status ${res.statusCode}`,
          });
        }
      });

      req.on('error', (err) => {
        resolve({ reachable: false, error: `Connection failed: ${err.message}` });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ reachable: false, error: 'Verification request timed out' });
      });

      req.end();
    });
  }

  /**
   * Helper to ensure React entry points: src/main.tsx and index.html
   */
  private async ensureReactEntryPoints(
    projectDir: string,
    files: GeneratedFile[],
    req?: RequirementSpec | null
  ) {
    const mainTsxPath = path.join(projectDir, 'src', 'main.tsx');
    const indexHtmlPath = path.join(projectDir, 'index.html');

    const appTitle = req?.appTitle || 'Autonomous Software Engineer Project';

    // Check if main.tsx already provided
    let hasMain = files.some((f) => f.path === 'src/main.tsx' || f.path === 'src/index.tsx');
    if (!hasMain) {
      // Find main component
      const componentFile = files.find(
        (f) =>
          f.path.includes('components/') ||
          f.path.includes('App.tsx') ||
          f.path.includes('App.jsx')
      );

      let importStatement = '';
      let elementCode = '';

      if (componentFile) {
        const baseName = path.basename(componentFile.path, path.extname(componentFile.path));
        // Check export name inside file
        const content = componentFile.content;
        const matchNamed = content.match(/export\s+const\s+(\w+)\s*[:=]/);
        const matchFunction = content.match(/export\s+function\s+(\w+)/);
        const hasDefault = content.includes('export default');

        if (matchNamed) {
          const exportName = matchNamed[1];
          importStatement = `import { ${exportName} } from './components/${baseName}';`;
          elementCode = `React.createElement(${exportName})`;
        } else if (matchFunction) {
          const exportName = matchFunction[1];
          importStatement = `import { ${exportName} } from './components/${baseName}';`;
          elementCode = `React.createElement(${exportName})`;
        } else if (hasDefault) {
          importStatement = `import App from './components/${baseName}';`;
          elementCode = `React.createElement(App)`;
        } else {
          importStatement = `import * as Module from './components/${baseName}';`;
          elementCode = `React.createElement(Object.values(Module)[0] as React.ComponentType)`;
        }
      } else {
        // Fallback simple component
        importStatement = '';
        elementCode = `React.createElement('div', { className: 'p-6 font-sans' }, React.createElement('h1', { className: 'text-xl font-bold' }, '${appTitle}'))`;
      }

      const mainTsxContent = `import React from 'react';
import { createRoot } from 'react-dom/client';
${importStatement}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(${elementCode});
}
`;
      await fs.mkdir(path.join(projectDir, 'src'), { recursive: true });
      await fs.writeFile(mainTsxPath, mainTsxContent, 'utf-8');
    }

    // Check if index.html already provided
    let hasIndexHtml = files.some((f) => f.path === 'index.html');
    if (!hasIndexHtml) {
      const html = this.getDefaultIndexHtml(appTitle);
      await fs.writeFile(indexHtmlPath, html, 'utf-8');
    }
  }

  private async ensureStaticEntryPoints(
    projectDir: string,
    files: GeneratedFile[],
    req?: RequirementSpec | null
  ) {
    const indexHtmlPath = path.join(projectDir, 'index.html');
    const hasIndex = files.some((f) => f.path === 'index.html');
    if (!hasIndex) {
      const appTitle = req?.appTitle || 'Generated Application';
      const html = this.getDefaultIndexHtml(appTitle);
      await fs.writeFile(indexHtmlPath, html, 'utf-8');
    }
  }

  private getDefaultIndexHtml(title: string): string {
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
  <script>
    // Live runtime console logging bridge to parent workspace
    (function() {
      const origLog = console.log;
      const origWarn = console.warn;
      const origErr = console.error;
      const forward = function(level, args) {
        try {
          const msg = Array.from(args).map(function(a) {
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          window.parent.postMessage({
            type: 'PREVIEW_CONSOLE_LOG',
            level: level,
            message: msg,
            timestamp: new Date().toLocaleTimeString()
          }, '*');
        } catch(e) {}
      };
      console.log = function() {
        origLog.apply(console, arguments);
        forward('info', arguments);
      };
      console.warn = function() {
        origWarn.apply(console, arguments);
        forward('warn', arguments);
      };
      console.error = function() {
        origErr.apply(console, arguments);
        forward('error', arguments);
      };
      window.addEventListener('error', function(e) {
        forward('error', [e.message + ' (' + (e.filename || 'bundle') + ':' + (e.lineno || 0) + ')']);
      });
    })();
  </script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">
  <div id="root"></div>
  <script type="module" src="./assets/main.js"></script>
</body>
</html>`;
  }
}
