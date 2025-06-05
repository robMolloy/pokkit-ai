import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pb } from "@/config/pocketbaseConfig";
import { TFileRecord, updateFile } from "@/modules/files/dbFilesUtils";
import * as React from "react";

export const RenameFileForm = (p: { file: TFileRecord; onSuccess: () => void }) => {
  const [newName, setNewName] = React.useState(p.file.name);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form className="w-full">
      <div className="space-y-3">
        {error && <div className="text-center text-sm text-destructive">{error}</div>}

        <div className="space-y-1">
          <label htmlFor="fileName" className="text-xs text-muted-foreground">
            File name
          </label>
          <Input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter file name"
            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            onClick={async (e) => {
              e.preventDefault();
              if (isLoading) return;

              if (!newName.trim()) return setError("File name cannot be empty");
              if (newName.includes("/")) return setError("File name cannot contain slashes");

              setIsLoading(true);
              const resp = await updateFile({ pb, data: { ...p.file, name: newName } });
              setIsLoading(false);

              if (!resp.success) return setError("Error renaming file");
              p.onSuccess();
            }}
            className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {isLoading ? "Renaming..." : "Rename"}
          </Button>
        </div>
      </div>
    </form>
  );
};
