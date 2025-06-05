import { create } from "zustand";
import { TDirectory } from "../directories/dbDirectoriesUtils";

type TState = TDirectory[] | undefined;

export const useDirectoriesStore = create<{
  data: TState;
  setData: (x: TState) => void;
  clear: () => void;
}>()((set) => ({
  data: [],
  setData: (data) => set(() => ({ data })),
  clear: () => set(() => ({ data: undefined })),
}));

export type TDirectoryTree = TDirectory & { children: TDirectoryTree[]; fullPath: string };
export type TDirectoryWithFullPath = TDirectory & { fullPath: string };

const buildTree = (p: {
  parentNode: TDirectoryTree;
  allDirectories: TDirectory[];
  parentId: string;
}) => {
  const children = p.allDirectories.filter((dir) => dir.directoryRelationId === p.parentId);

  children.forEach((child) => {
    const childNode: TDirectoryTree = {
      ...child,
      fullPath: `${p.parentNode.fullPath}${child.name}/`,
      children: [],
    };

    p.parentNode.children.push(childNode);

    buildTree({ parentNode: childNode, allDirectories: p.allDirectories, parentId: child.id });
  });
};

const convertDirectoriesIntoDirectoryTree = (directories: TDirectory[]): TDirectoryTree => {
  const rootNode: TDirectoryTree = {
    id: "",
    name: "/",
    collectionId: "",
    collectionName: "directories",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    directoryRelationId: "undefined", // "" would match the root node
    isStarred: false,
    fullPath: "/",
    children: [],
  };

  buildTree({
    parentNode: rootNode,
    allDirectories: directories,
    parentId: "",
  });

  return rootNode;
};

function traverseDirectoryTree(
  dirTree: TDirectoryTree,
  onEachDirTree: (x: TDirectoryTree) => void,
): void {
  onEachDirTree(dirTree);

  for (const child of dirTree.children) traverseDirectoryTree(child, onEachDirTree);
}
function buildDirectoriesWithFullPathsFromDirectoryTree(
  tree: TDirectoryTree,
): TDirectoryWithFullPath[] {
  const result: TDirectoryWithFullPath[] = [];

  traverseDirectoryTree(tree, (x) => {
    const { children: _, ...rest } = x;
    result.push(rest);
  });

  return result;
}

export const useDirectoryTreeStore = () => {
  const directoriesStore = useDirectoriesStore();

  if (!directoriesStore.data) return { tree: undefined, data: undefined } as const;

  const tree = convertDirectoriesIntoDirectoryTree(directoriesStore.data);
  const fullPaths = buildDirectoriesWithFullPathsFromDirectoryTree(tree);

  return { tree, fullPaths: fullPaths.sort((a, b) => (a.created > b.created ? -1 : 1)) };
};
