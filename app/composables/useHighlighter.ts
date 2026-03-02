import { createHighlighter } from 'shiki';
import type { HighlighterGeneric } from 'shiki';
import { createJavaScriptRegexEngine } from 'shiki/engine-javascript.mjs';

// Singleton pattern: reuse the same highlighter across all components
let highlighter: HighlighterGeneric<string, string> | null = null;
let promise: Promise<HighlighterGeneric<string, string>> | null = null;

export const useHighlighter = async () => {
  if (!promise) {
    promise = createHighlighter({
      langs: [
        'vue',
        'js',
        'ts',
        'jsx',
        'tsx',
        'css',
        'html',
        'json',
        'yaml',
        'markdown',
        'bash',
        'python',
        'rust',
        'go',
        'java',
        'c',
        'cpp',
      ],
      themes: ['material-theme-palenight', 'material-theme-lighter'],
      engine: createJavaScriptRegexEngine(),
    }) as Promise<HighlighterGeneric<string, string>>;
  }
  if (!highlighter) {
    highlighter = await promise;
  }
  return highlighter;
};
