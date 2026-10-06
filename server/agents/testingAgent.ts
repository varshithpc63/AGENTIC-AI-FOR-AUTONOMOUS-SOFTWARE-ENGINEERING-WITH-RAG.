import { ExecutionEngine } from './executionEngine.js';
import { GeneratedFile, TestReport } from '../types.js';

export class TestingAgent {
  private engine: ExecutionEngine;

  constructor() {
    this.engine = new ExecutionEngine();
  }

  public async runTests(files: GeneratedFile[]): Promise<TestReport> {
    return await this.engine.executeSandboxedSuite(files);
  }
}
