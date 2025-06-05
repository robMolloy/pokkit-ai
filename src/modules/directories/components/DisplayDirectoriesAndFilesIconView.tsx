import { ToggleableDirectoryStar } from "@/components/ToggleableDirectoryStar";
import { DisplayFileIconView } from "@/modules/files/components/DisplayFileIconView";
import { TFileRecord } from "@/modules/files/dbFilesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { useRouter } from "next/router";
import { DirectoryActionsDropdownMenu } from "./DirectoryActionsDropdownMenu";
import { CustomIcon } from "@/components/CustomIcon";

const DisplayDirectoryIconView = (p: { directory: TDirectoryWithFullPath }) => {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/browse${p.directory.fullPath}`)}
      className="group relative flex h-full w-full cursor-pointer flex-col items-center rounded-lg border p-4 hover:bg-accent"
    >
      <div className="absolute right-2 top-2">
        <ToggleableDirectoryStar directory={p.directory} size="sm" />
      </div>
      <span className="mb-2">
        <CustomIcon iconName="folder" size="3xl" />
      </span>
      <span className="break-all text-center text-sm">{p.directory.name}</span>
      <div className="absolute left-2 top-2 opacity-40 group-hover:opacity-100">
        <DirectoryActionsDropdownMenu directory={p.directory} />
      </div>
    </div>
  );
};

export const DisplayDirectoriesAndFilesIconView = (p: {
  files: TFileRecord[];
  directories: TDirectoryWithFullPath[];
  parentDirectories: TDirectoryWithFullPath[];
}) => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
      {p.directories.map((x) => (
        <div key={x.id}>
          <DisplayDirectoryIconView directory={x} />
        </div>
      ))}

      {p.files.map((file) => {
        const directory = p.parentDirectories.find((x) => x.id === file.directoryRelationId);

        if (!directory) return <></>;

        return (
          <div key={file.id}>
            <DisplayFileIconView file={file} parentDirectory={directory} />
          </div>
        );
      })}
    </div>
  );
};
