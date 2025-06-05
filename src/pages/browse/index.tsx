import { useBrowsePath } from "@/components/DirectoryTree";
import { useDirectoryTreeStore } from "@/modules/files/directoriesStore";
import { BrowseScreen } from "@/screens/BrowseScreen";

const Index = () => {
  const directoryTreeStore = useDirectoryTreeStore();
  const browsePath = useBrowsePath().browsePath as string;

  const currentDirectory = directoryTreeStore.fullPaths?.find((x) => x.fullPath === browsePath);

  if (!currentDirectory) return <div>Directory not found</div>;

  return <BrowseScreen browsePath="/" directory={currentDirectory} />;
};

export default Index;
