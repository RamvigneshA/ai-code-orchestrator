import fs from 'fs/promises';
import path from 'path';

/**
 * Scans code for local import statements and returns the content of those files.
 * This provides the AI with the necessary context to understand dependencies.
 */
export async function gatherContext(code: string, baseDir: string = process.cwd()) {
  const importRegex = /import\s+.*\s+from\s+['"](\.?\.?\/.*|@\/.*)['"]/g;
  const matches = [...code.matchAll(importRegex)];
  
  const contextFiles: { path: string; content: string }[] = [];

  for (const match of matches) {
    let importPath = match[1];
    
    // Resolve alias @/ to src/
    if (importPath.startsWith('@/')) {
      importPath = importPath.replace('@/', 'src/');
    }

    // Try to resolve the absolute path
    const absolutePath = path.resolve(baseDir, importPath);
    
    // Attempt to find the file (trying common extensions)
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
      try {
        const fullPath = absolutePath + ext;
        const content = await fs.readFile(fullPath, 'utf-8');
        contextFiles.push({ path: importPath, content });
        break; // Stop if we found it
      } catch (e) {
        // Continue trying other extensions
      }
    }
  }

  return contextFiles;
}

export function formatContext(contextFiles: { path: string; content: string }[]) {
  if (contextFiles.length === 0) return '';
  
  return `
### PROJECT CONTEXT
The following files are imported in the current code and are provided for your reference:

${contextFiles.map(f => `--- FILE: ${f.path} ---\n${f.content}\n`).join('\n')}
------------------
`;
}
