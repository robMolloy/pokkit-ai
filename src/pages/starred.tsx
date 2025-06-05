import { DisplayDirectoriesAndFilesIconView } from "@/modules/directories/components/DisplayDirectoriesAndFilesIconView";
import { useDirectoryTreeStore } from "@/modules/files/directoriesStore";
import { DisplayDirectoriesAndFilesTableView } from "@/modules/files/components/DisplayFilesTableView";
import { useFilesStore } from "@/modules/files/filesStore";
import { ViewTypeToggleButton } from "@/modules/viewType/components/ViewTypeToggleButton";
import { useViewTypeStore } from "@/modules/viewType/viewTypeStore";
import { MainLayout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/defaultComponents";

const StarredPage = () => {
  const filesStore = useFilesStore();
  const starredFiles = filesStore.data?.filter((file) => file.isStarred) ?? [];
  const directoriesStore = useDirectoryTreeStore();
  const starredDirectories = directoriesStore.fullPaths?.filter((dir) => dir.isStarred) ?? [];
  const viewTypeStore = useViewTypeStore();

  return (
    <MainLayout>
      <div className="flex items-end justify-between">
        <H1>Starred Files</H1>
        <ViewTypeToggleButton />
      </div>

      <br />
      {viewTypeStore.data === "table" && (
        <DisplayDirectoriesAndFilesTableView
          directories={starredDirectories}
          files={starredFiles}
          parentDirectories={directoriesStore.fullPaths ?? []}
        />
      )}

      {viewTypeStore.data === "icon" && (
        <DisplayDirectoriesAndFilesIconView
          directories={starredDirectories}
          files={starredFiles}
          parentDirectories={directoriesStore.fullPaths ?? []}
        />
      )}
    </MainLayout>
  );
};

export default StarredPage;
