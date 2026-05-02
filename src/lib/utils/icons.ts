import { getIconForFile, getIconForFolder, getIconForOpenFolder } from 'vscode-icons-js';

const ICON_BASE_URL = 'https://raw.githubusercontent.com/vscode-icons/vscode-icons/master/icons';

export function getFileIconUrl(filename: string): string {
  const iconName = getIconForFile(filename);
  return `${ICON_BASE_URL}/${iconName}`;
}

export function getFolderIconUrl(folderName: string, isOpen: boolean): string {
  const iconName = isOpen ? getIconForOpenFolder(folderName) : getIconForFolder(folderName);
  return `${ICON_BASE_URL}/${iconName}`;
}
