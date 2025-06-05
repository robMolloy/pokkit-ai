import { CustomIcon } from "@/components/CustomIcon";
import { Button } from "@/components/ui/button";
import { pb } from "@/config/pocketbaseConfig";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createFile, TFileRecord, updateFile } from "../dbFilesUtils";

export function FileUploader(p: {
  onUploadComplete?: (x: TFileRecord) => void;
  parentDirectoryId: string;
  siblingFiles: TFileRecord[];
}) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      try {
        for (const file of acceptedFiles) {
          const fileWithSameName = p.siblingFiles.find((x) => x.name === file.name);
          const resp = await (() => {
            const newFile = {
              name: file.name,
              file,
              directoryRelationId: p.parentDirectoryId,
              isStarred: false,
            };
            if (fileWithSameName)
              return updateFile({ pb, data: { id: fileWithSameName.id, ...newFile } });

            return createFile({ pb, data: { ...newFile, keywords: "" } });
          })();

          if (resp.success) p.onUploadComplete?.(resp.data);
        }
      } catch (e) {
        const error = e as { message: string };
        console.error("Error uploading file:", error.message);
      }

      setIsUploading(false);
    },
    [p.onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
        isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25"
      } ${isUploading ? "opacity-50" : ""}`}
      style={{ height: "136px" }}
    >
      <input {...getInputProps()} />
      <span className="mb-2 h-8 w-8 text-muted-foreground">
        <CustomIcon iconName="upload" size="xl" />
      </span>
      {isUploading ? (
        <p className="text-sm text-muted-foreground">Uploading...</p>
      ) : isDragActive ? (
        <p className="text-sm text-muted-foreground">Drop the files here...</p>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Drag and drop files here, or click to select files
          </p>
          <Button variant="outline" size="sm" className="mt-2">
            Select Files
          </Button>
        </div>
      )}
    </div>
  );
}
