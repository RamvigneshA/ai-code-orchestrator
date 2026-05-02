import { VFSState } from "@/lib/types/vfs";

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
}

export function buildFileTree(files: VFSState): TreeNode[] {
  const root: TreeNode[] = [];

  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join("/");
      
      let existingNode = currentLevel.find((v) => v.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          ...(isFile ? {} : { children: [] }),
        };
        currentLevel.push(existingNode);
      }

      // Sort: Folders first, then Files
      currentLevel.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      });

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  return root;
}
