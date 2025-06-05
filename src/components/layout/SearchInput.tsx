import { useDirectoryTreeStore } from "@/modules/files/directoriesStore";
import { useFilesStore } from "@/modules/files/filesStore";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { useRouter } from "next/router";
import React, { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import type { TFileRecord } from "@/modules/files/dbFilesUtils";
import { X } from "lucide-react";

const SearchInput = () => {
  const rightSidebarStore = useRightSidebarStore();
  const filesStore = useFilesStore();
  const { fullPaths: directoriesStore } = useDirectoryTreeStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const suggestedFiles =
    filesStore.data?.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ??
    [];

  useEffect(() => setSelectedIndex(0), [searchTerm]);

  useEffect(() => {
    if (!containerRef.current) return;

    const selectedElement = containerRef.current.children[selectedIndex];
    if (selectedElement) selectedElement.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelectFile = (file: TFileRecord, directory: TDirectoryWithFullPath) => {
    router.push(`/browse${directory.fullPath}`);
    rightSidebarStore.showFileDetails({
      file: file,
      parentDirectory: directory,
      onDelete: () => rightSidebarStore.close(),
    });
    setSearchTerm(file.name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestedFiles.length === 0) return;

    if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) e.preventDefault();

    if (e.key === "Escape") setOpen(false);
    if (e.key === "ArrowDown")
      setSelectedIndex((prev) => (prev < suggestedFiles.length - 1 ? prev + 1 : prev));
    if (e.key === "ArrowUp") setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    if (e.key === "Enter") {
      const file = suggestedFiles[selectedIndex];
      if (!file) return; // must be last case

      const directory = directoriesStore?.find((x) => x.id === file.directoryRelationId);
      if (directory) handleSelectFile(file, directory);
    }
  };

  return (
    <div className="relative mx-4 w-96">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              className="w-full pr-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setOpen(true);
              }}
              onFocus={() => inputRef.current?.focus()}
              onKeyDown={handleKeyDown}
            />
            {searchTerm.length > 0 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setSearchTerm("");
                  inputRef.current?.focus();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <div ref={containerRef} className="max-h-96 overflow-y-auto">
            {suggestedFiles.map((file, index) =>
              (() => {
                const directory = directoriesStore?.find((x) => x.id === file.directoryRelationId);
                if (!directory) return <React.Fragment key={file.id}></React.Fragment>;
                return (
                  <div
                    key={file.id}
                    className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2 hover:bg-accent hover:text-accent-foreground ${
                      selectedIndex === index ? "bg-accent text-accent-foreground" : ""
                    }`}
                    onClick={() => handleSelectFile(file, directory)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap text-sm">
                      {file.name}
                    </div>
                    <div className="w-32 shrink-0 overflow-hidden overflow-ellipsis whitespace-nowrap text-right text-xs text-muted-foreground">
                      {directory.fullPath}
                    </div>
                  </div>
                );
              })(),
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SearchInput;
