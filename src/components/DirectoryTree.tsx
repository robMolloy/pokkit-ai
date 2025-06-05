import { TDirectoryTree } from "@/modules/files/directoriesStore";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CustomIcon } from "./CustomIcon";

type DirectoryNode = {
  name: string;
  path: string;
  children?: DirectoryNode[];
};

function DirectoryTreeItem({
  node,
  initIsOpen = false,
  activePath,
}: {
  node: DirectoryNode;
  initIsOpen?: boolean;
  activePath?: string;
}) {
  const isOnActivePath = !!activePath && activePath.startsWith(node.path);
  const [isOpen, setIsOpen] = useState(initIsOpen || isOnActivePath);
  const isActive = activePath === node.path;

  useEffect(() => {
    if (isOnActivePath) setIsOpen(true);
  }, [isOnActivePath]);

  return (
    <div className="w-full">
      <div
        className={`flex items-center rounded-md p-1 ${isActive ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "hover:bg-accent hover:text-accent-foreground"}`}
      >
        <div
          className="flex cursor-pointer items-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen((x) => !x);
          }}
        >
          {(() => {
            return (
              <span className="mr-1 h-4 w-4 flex-shrink-0">
                <CustomIcon iconName={isOpen ? "chevronDown" : "chevronRight"} size="sm" />
              </span>
            );
          })()}
        </div>

        <Link
          href={`/browse${node.path}`}
          className={`flex flex-1 items-center`}
          onClick={() => setIsOpen(true)}
        >
          <span className="mr-2">
            <CustomIcon iconName="folder" size="sm" />
          </span>
          <span className="truncate text-sm">{node.name}</span>
        </Link>
      </div>

      {node.children && node.children.length > 0 && (
        <div className={`pl-4 ${isOpen ? "" : "hidden"}`}>
          {node.children.map((child) => (
            <DirectoryTreeItem key={child.path} node={child} activePath={activePath} />
          ))}
        </div>
      )}
    </div>
  );
}

export const useBrowsePath = () => {
  const router = useRouter();

  const fullPath = router.asPath;
  const initBrowsePath = fullPath.startsWith("/browse")
    ? decodeURIComponent(fullPath.slice(7))
    : undefined;

  if (initBrowsePath === undefined) return { browsePath: undefined };
  if (initBrowsePath === "") return { browsePath: "/" };

  const browsePathPrefix = initBrowsePath.startsWith("/") ? "" : "/";
  const browsePathSuffix = initBrowsePath.endsWith("/") ? "" : "/";

  // browsePath always starts and ends with a slash
  const browsePath = `${browsePathPrefix}${initBrowsePath}${browsePathSuffix}`;
  return { browsePath };
};

const convertDirectoryTreeToDirectoryNode = (tree: TDirectoryTree): DirectoryNode => {
  return {
    name: tree.name,
    path: tree.fullPath,
    children: tree.children.map(convertDirectoryTreeToDirectoryNode),
  };
};

export const DirectoryTree = ({ data }: { data: TDirectoryTree }) => {
  const { browsePath } = useBrowsePath();

  const rootNode = convertDirectoryTreeToDirectoryNode(data);

  return (
    <div className="flex flex-col">
      <DirectoryTreeItem node={rootNode} initIsOpen={true} activePath={browsePath} />
    </div>
  );
};
