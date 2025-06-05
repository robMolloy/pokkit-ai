import { ToggleableStar } from "@/components/ToggleableStar";
import { FileActionsDropdownMenu } from "@/modules/files/components/FileActionsDropdownMenu";
import { TFileRecord } from "@/modules/files/dbFilesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { useEffect, useRef, useState } from "react";
import { DisplayFileThumbnailOrIcon } from "./DisplayFilesTableView";

const useFlash = (file: TFileRecord) => {
  const [shouldFlash, setShouldFlash] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) return;

    setShouldFlash(true);
    const timer = setTimeout(() => setShouldFlash(false), 1100);
    return () => clearTimeout(timer);
  }, [file]);

  useEffect(() => {
    setTimeout(() => (isFirstRender.current = false), 100); // handles dev mode double render
  }, []);

  return { flashClass: shouldFlash ? "animate-pulse repeat-1 duration-1000" : "" };
};

export const DisplayFileIconView = (p: {
  file: TFileRecord;
  parentDirectory: TDirectoryWithFullPath;
}) => {
  const rightSidebarStore = useRightSidebarStore();

  const { flashClass } = useFlash(p.file);

  return (
    <div
      onClick={() =>
        rightSidebarStore.showFileDetails({
          file: p.file,
          parentDirectory: p.parentDirectory,
          onDelete: () => rightSidebarStore.close(),
        })
      }
      className="group relative flex h-full cursor-pointer flex-col items-center overflow-hidden rounded-lg border p-4 hover:bg-accent"
    >
      <div className={`absolute inset-0 bg-foreground opacity-0 ${flashClass}`} />

      <div className="absolute right-2 top-2">
        <ToggleableStar file={p.file} size="sm" />
      </div>
      <span className="mb-2">
        <DisplayFileThumbnailOrIcon file={p.file} size="3xl" />
      </span>
      <span className="break-all text-center text-sm">{p.file.name}</span>
      <div className="absolute left-2 top-2 opacity-40 group-hover:opacity-100">
        <FileActionsDropdownMenu file={p.file} />
      </div>
    </div>
  );
};
