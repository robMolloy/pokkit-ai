import { CustomIcon } from "./CustomIcon";
import { Button } from "./ui/button";
import { TFileRecord, updateFile } from "@/modules/files/dbFilesUtils";
import { useEffect, useState } from "react";
import { pb } from "@/config/pocketbaseConfig";

export function ToggleableStar(p: { file: TFileRecord; size?: "sm" | "md" | "lg" }) {
  const size = p.size ?? "md";
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const [isStarred, setIsStarred] = useState(p.file.isStarred);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsStarred(p.file.isStarred);
  }, [p.file.isStarred]);

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
        const resp = await updateFile({ pb, data: { ...p.file, isStarred: newIsStarred } });
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
