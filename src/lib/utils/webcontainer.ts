import { WebContainer, FileSystemTree } from '@webcontainer/api';
import { VFSState } from '../types/vfs';

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainerInstance(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance;
  if (bootPromise) return bootPromise;

  bootPromise = WebContainer.boot().then((instance) => {
    webcontainerInstance = instance;
    return instance;
  });

  return bootPromise;
}

export function flatToTree(files: VFSState): FileSystemTree {
  const tree: FileSystemTree = {};

  for (const [path, file] of Object.entries(files)) {
    const parts = path.split('/');
    let currentDir = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        // Skip our hidden marker files for directories
        if (part !== '.keep') {
          currentDir[part] = {
            file: {
              contents: file.content
            }
          };
        }
      } else {
        if (!currentDir[part]) {
          currentDir[part] = {
            directory: {}
          };
        }
        currentDir = (currentDir[part] as any).directory;
      }
    }
  }

  return tree;
}

export let isInternalChange = false;

export function setInternalChange(value: boolean) {
  isInternalChange = value;
}

export async function writeToWebContainer(files: VFSState) {
  setInternalChange(true);
  const wc = await getWebContainerInstance();
  
  // To avoid overwriting node_modules, we only write the specific files in our VFS
  for (const [path, file] of Object.entries(files)) {
    const parts = path.split('/');
    let currentPath = '';
    
    // Ensure directories exist
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
      try {
        await wc.fs.mkdir(currentPath);
      } catch (e: any) {
        // WebContainer API might not set e.code, so we check the message too
        const isExist = e.code === 'EEXIST' || (e.message && e.message.includes('EEXIST'));
        if (!isExist) {
          console.error("mkdir error:", e);
        }
      }
    }
    
    // Write file only if content has changed (prevents Vite infinite restart loops)
    if (parts[parts.length - 1] !== '.keep') {
      try {
        const existing = await wc.fs.readFile(path, 'utf-8').catch(() => null);
        if (existing !== file.content) {
          await wc.fs.writeFile(path, file.content);
        }
      } catch (e) {
        console.error("Failed to write file", path, e);
      }
    }
  }
  
  // Allow a short delay before unlocking, so watcher ignores these writes
  setTimeout(() => {
    setInternalChange(false);
  }, 300);
}

const IGNORE_PATTERNS = [/node_modules/, /\.next/, /\.git/, /package-lock\.json/, /pnpm-lock\.yaml/, /\.vite/, /dist/, /tsconfig\.tsbuildinfo/];

function shouldIgnore(path: string) {
  return IGNORE_PATTERNS.some(regex => regex.test(path));
}

async function readFSToVFS(wc: WebContainer, dirPath = ''): Promise<VFSState> {
  let vfs: VFSState = {};
  
  const entries = await wc.fs.readdir(dirPath || '/', { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = dirPath ? `${dirPath}/${entry.name}` : entry.name;
    
    if (shouldIgnore(fullPath)) continue;
    
    if (entry.isDirectory()) {
      vfs[`${fullPath}/.keep`] = { path: `${fullPath}/.keep`, content: "" };
      const subVfs = await readFSToVFS(wc, fullPath);
      vfs = { ...vfs, ...subVfs };
    } else {
      const content = await wc.fs.readFile(fullPath, 'utf-8');
      vfs[fullPath] = { path: fullPath, content };
    }
  }
  
  return vfs;
}

export async function startVFSSync(setFiles: (updater: (prev: VFSState) => VFSState) => void) {
  const wc = await getWebContainerInstance();
  
  let timeout: NodeJS.Timeout;
  
  wc.fs.watch('/', { recursive: true }, (event, filename) => {
    if (isInternalChange) return;
    if (filename && shouldIgnore(String(filename))) return;
    
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try {
        const newVfs = await readFSToVFS(wc);
        setFiles((prev) => {
          // Merge logic to avoid overwriting files we are actively editing in React
          // For a true "Senior" implementation, you'd do deep comparison.
          // For now, we replace the VFS with the WebContainer's state.
          return newVfs;
        });
      } catch (e) {
        console.error("Failed to sync from WebContainer:", e);
      }
    }, 100);
  });
}


