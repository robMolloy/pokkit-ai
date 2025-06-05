import { pb } from "@/config/pocketbaseConfig";
import { createDirectory } from "@/modules/directories/dbDirectoriesUtils";
import { useModalStore } from "@/stores/modalStore";
import { useState } from "react";
import { CustomIcon } from "./CustomIcon";
import { ModalContent } from "./Modal";
import { Button } from "./ui/button";

export const CreateDirectoryInModalButton = (p: {
  browsePath: string;
  parentDirectoryId: string;
}) => {
  const modalStore = useModalStore();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        modalStore.setData(
          <ModalContent
            title="New directory"
            description={`Create a new directory at ${p.browsePath}`}
            content={
              <CreateDirectoryForm
                onSuccess={modalStore.close}
                parentDirectoryId={p.parentDirectoryId}
              />
            }
          />,
        )
      }
    >
      <CustomIcon iconName="plus" size="md" /> New Directory
    </Button>
  );
};

export function CreateDirectoryForm(p: { onSuccess: () => void; parentDirectoryId: string }) {
  const [directoryName, setDirectoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form className="w-full">
      <div className="space-y-3">
        {error && <div className="text-center text-sm text-destructive">{error}</div>}

        <div className="space-y-1">
          <label htmlFor="directoryName" className="text-xs text-muted-foreground">
            Directory name
          </label>
          <input
            id="directoryName"
            type="text"
            value={directoryName}
            onChange={(e) => setDirectoryName(e.target.value)}
            placeholder="Enter directory name"
            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            onClick={async (e) => {
              e.preventDefault();

              if (!directoryName.trim()) return setError("Directory name cannot be empty");
              if (directoryName.includes("/"))
                return setError("Directory name cannot contain slashes");

              const createDirResp = await createDirectory({
                pb,
                data: {
                  name: directoryName,
                  directoryRelationId: p.parentDirectoryId,
                  isStarred: false,
                },
              });

              if (!createDirResp.success) return setError("Error creating directory");
              p.onSuccess();
            }}
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Create
          </Button>
        </div>
      </div>
    </form>
  );
}
