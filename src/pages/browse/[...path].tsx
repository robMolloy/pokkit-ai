import { useBrowsePath } from "@/components/DirectoryTree";
import { useDirectoryTreeStore } from "@/modules/files/directoriesStore";
import { BrowseScreen } from "@/screens/BrowseScreen";

export default function BrowsePage() {
  const directoryTreeStore = useDirectoryTreeStore();
  const browsePath = useBrowsePath().browsePath as string;

  const currentDirectory = directoryTreeStore.fullPaths?.find((x) => x.fullPath === browsePath);

  if (!currentDirectory) return <div>Directory not found</div>;

  return <BrowseScreen browsePath={browsePath} directory={currentDirectory} />;
}
