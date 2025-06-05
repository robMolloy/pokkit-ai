import { CustomIcon, iconSizeClass } from "@/components/CustomIcon";
import { FileIcon, getFileExtension, imageExtensions } from "@/components/FileIcon";
import { ToggleableDirectoryStar } from "@/components/ToggleableDirectoryStar";
import { ToggleableStar } from "@/components/ToggleableStar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
} from "@/components/ui/table";
import { pb } from "@/config/pocketbaseConfig";
import { DirectoryActionsDropdownMenu } from "@/modules/directories/components/DirectoryActionsDropdownMenu";
import { FileActionsDropdownMenu } from "@/modules/files/components/FileActionsDropdownMenu";
import { getFileDataRecordFromFileRecord, TFileRecord } from "@/modules/files/dbFilesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { formatDate } from "@/lib/dateUtils";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { formatFileSize } from "../fileUtils";

export const DisplayFileThumbnailOrIcon = (p: {
  file: TFileRecord;
  size: React.ComponentProps<typeof CustomIcon>["size"];
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const extension = getFileExtension(p.file);
    if (!imageExtensions.includes(extension)) return;

    (async () => {
      const resp = await getFileDataRecordFromFileRecord({ pb, isThumb: true, data: p.file });

      if (resp.success) {
        const url = URL.createObjectURL(resp.data.file);
        setThumbnailUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    })();
  }, [p.file.file]);

  return (
    <span className="flex items-center justify-center">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={p.file.name}
          className={`${iconSizeClass[p.size]} object-contain`}
        />
      ) : (
        <FileIcon extension={getFileExtension(p.file)} size={p.size} />
      )}
    </span>
  );
};

const DisplayFileTableView = (p: { file: TFileRecord; directory: TDirectoryWithFullPath }) => {
  const rightSidebarStore = useRightSidebarStore();

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() =>
        rightSidebarStore.showFileDetails({
          file: p.file,
          parentDirectory: p.directory,
          onDelete: () => rightSidebarStore.close(),
        })
      }
    >
      <TableCell>
        <DisplayFileThumbnailOrIcon file={p.file} size="lg" />
      </TableCell>
      <TableCell className="max-w-[200px]">
        <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{p.file.name}</span>
      </TableCell>
      <TableCell>
        <Link
          href={`/browse${p.directory.fullPath}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline"
        >
          {p.directory.fullPath}
        </Link>
      </TableCell>
      <TableCell>{getFileExtension(p.file) || "Unknown"}</TableCell>
      <TableCell className="whitespace-nowrap">{formatFileSize(p.file.size)}</TableCell>
      <TableCell>{formatDate(p.file.created)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ToggleableStar file={p.file} size="sm" />
          <FileActionsDropdownMenu file={p.file} />
        </div>
      </TableCell>
    </TableRow>
  );
};
const DisplayDirectoryTableView = (p: { directory: TDirectoryWithFullPath }) => {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`/browse${p.directory.fullPath}`)}
    >
      <TableCell>
        <span className="flex items-center justify-center">
          <CustomIcon iconName="folder" size="lg" />
        </span>
      </TableCell>
      <TableCell>
        <span>{p.directory.name}</span>
      </TableCell>
      <TableCell>
        <Link
          href={`/browse${p.directory.fullPath}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline"
        >
          {p.directory.fullPath}
        </Link>
      </TableCell>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell>{formatDate(p.directory.created)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <ToggleableDirectoryStar directory={p.directory} size="sm" />
          <DirectoryActionsDropdownMenu directory={p.directory} />
        </div>
      </TableCell>
    </TableRow>
  );
};
export const DisplayDirectoriesAndFilesTableView = (p: {
  files: TFileRecord[];
  directories: TDirectoryWithFullPath[];
  parentDirectories: TDirectoryWithFullPath[];
}) => {
  return (
    <Table className="w-full">
      <TableHeader>
        <TableHeaderRow>
          <TableHead></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Path</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableHeaderRow>
      </TableHeader>
      <TableBody>
        {p.directories.map((directory) => {
          return <DisplayDirectoryTableView key={directory.id} directory={directory} />;
        })}
        {p.files.map((file) => {
          const directory = p.parentDirectories.find((x) => x.id === file.directoryRelationId);
          if (!directory) return <></>;

          return <DisplayFileTableView key={file.id} file={file} directory={directory} />;
        })}
      </TableBody>
    </Table>
  );
};
