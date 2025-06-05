import { pb } from "@/config/pocketbaseConfig";
import { updateDirectory } from "@/modules/directories/dbDirectoriesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { useEffect, useState } from "react";
import { CustomIcon } from "./CustomIcon";
import { Button } from "./ui/button";

export function ToggleableDirectoryStar(p: {
  directory: TDirectoryWithFullPath;
  size?: "sm" | "md" | "lg";
}) {
  const size = p.size ?? "md";
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const [isStarred, setIsStarred] = useState(p.directory.isStarred);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsStarred(p.directory.isStarred);
  }, [p.directory.isStarred]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={sizeClasses[size]}
      onClick={async (e) => {
        e.stopPropagation();

        if (isLoading) return;
        setIsLoading(true);

        const newIsStarred = !isStarred;
        setIsStarred(newIsStarred);
        const resp = await updateDirectory({
          pb,
          data: { ...p.directory, isStarred: newIsStarred },
        });
        setIsLoading(false);
        if (!resp.success) setIsStarred(!newIsStarred);
      }}
      disabled={isLoading}
      title={isStarred ? "Unstar" : "Star"}
    >
      <CustomIcon
        iconName="star"
        size="md"
        className={isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
      />
    </Button>
  );
}
