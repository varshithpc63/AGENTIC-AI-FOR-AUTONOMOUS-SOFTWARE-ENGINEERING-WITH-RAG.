import fs from 'node:fs/promises';
import path from 'node:path';
import { RagDoc, RequirementSpec, SystemDesignSpec } from '../types.js';

interface KnowledgeFile {
  filename: string;
  title: string;
  content: string;
}

export class RagAgent {
  private knowledgeDir: string;
  private cachedKnowledge: KnowledgeFile[] = [];

  constructor() {
    this.knowledgeDir = path.resolve(process.cwd(), 'knowledge_base');
  }

  public async initialize(): Promise<void> {
    try {
      const files = await fs.readdir(this.knowledgeDir);
      const docs: KnowledgeFile[] = [];
      for (const file of files) {
        if (file.endsWith('.md')) {
          const fullPath = path.join(this.knowledgeDir, file);
          const content = await fs.readFile(fullPath, 'utf-8');
          const firstLine = content.split('\n')[0].replace(/^#\s*/, '').trim();
          docs.push({
            filename: file,
            title: firstLine || file,
            content,
          });
        }
      }
      this.cachedKnowledge = docs;
    } catch {
      // Fallback if knowledge_base dir isn't present
      this.cachedKnowledge = [];
    }
  }

  public async retrieveRelevantKnowledge(
    userPrompt: string,
    requirements?: RequirementSpec | null,
    design?: SystemDesignSpec | null
  ): Promise<RagDoc[]> {
    if (this.cachedKnowledge.length === 0) {
      await this.initialize();
    }

    const searchCorpus = [
      userPrompt,
      requirements?.summary || '',
      requirements?.coreFeatures.map(f => f.title + ' ' + f.description).join(' ') || '',
      requirements?.constraints.join(' ') || '',
      design?.architectureOverview || '',
      design?.stateStrategy || '',
    ].join(' ').toLowerCase();

    const terms = Array.from(new Set(searchCorpus.split(/\W+/).filter(w => w.length > 2)));

    const scoredDocs: RagDoc[] = this.cachedKnowledge.map((doc, idx) => {
      const docLower = doc.content.toLowerCase();
      let matchCount = 0;
      for (const term of terms) {
        if (docLower.includes(term)) {
          matchCount++;
        }
      }

      // Boost specific architectural docs
      if (doc.filename.includes('react_patterns') && searchCorpus.includes('state')) matchCount += 3;
      if (doc.filename.includes('data_modeling') && searchCorpus.includes('student')) matchCount += 4;
      if (doc.filename.includes('testing_strategies')) matchCount += 4;
      if (doc.filename.includes('isolated_sandbox_runner')) matchCount += 3;

      const relevanceScore = Math.min(0.98, Math.max(0.65, Number(((matchCount / (terms.length || 1)) * 2 + 0.6).toFixed(2))));

      // Extract a summary
      const paragraphs = doc.content.split('\n\n').filter(p => !p.startsWith('#'));
      const summary = paragraphs[0]?.replace(/\n/g, ' ').slice(0, 180) + '...' || 'Technical engineering specifications.';

      return {
        id: `rag-doc-${idx + 1}`,
        title: doc.title,
        sourceFile: doc.filename,
        relevanceScore,
        summary,
        content: doc.content,
      };
    });

    // Sort by relevance score descending and take top 4 relevant guidelines
    scoredDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scoredDocs.slice(0, 4);
  }
}
