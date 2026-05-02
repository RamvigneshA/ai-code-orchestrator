export interface VFSFile {
  path: string;     // e.g., "src/components/Button.tsx"
  content: string;  // The actual code
  isOpen?: boolean; // Is it open in a tab?
}

// The VFS is just a collection of these files
export type VFSState = Record<string, VFSFile>;
