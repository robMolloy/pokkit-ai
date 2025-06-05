import { FileDetails } from "@/components/FileDetails";
import { RightSidebarContent } from "@/components/layout/RightSidebar";
import { TFileRecord } from "@/modules/files/dbFilesUtils";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { ReactNode } from "react";
import { create } from "zustand";

type TState = ReactNode | null;
type TStore = {
  data: TState;
  setData: (data: TState) => void;
};

const useInitSidebarStore = create<TStore>()((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

export const useRightSidebarStore = () => {
  const { data, setData } = useInitSidebarStore();

  const showFileDetails = (p: {
    file: TFileRecord;
    parentDirectory: TDirectoryWithFullPath;
    onDelete: () => void;
  }) => {
    setData(
      <RightSidebarContent title="File Details">
        <FileDetails file={p.file} parentDirectory={p.parentDirectory} onDelete={p.onDelete} />
      </RightSidebarContent>,
    );
  };

  return { data, setData, close: () => setData(null), showFileDetails };
};
