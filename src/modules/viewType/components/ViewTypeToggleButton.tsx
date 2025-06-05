import { Button } from "@/components/ui/button";
import { useViewTypeStore } from "../viewTypeStore";
import { CustomIcon } from "@/components/CustomIcon";

export const ViewTypeToggleButton = () => {
  const viewTypeStore = useViewTypeStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => viewTypeStore.toggle()}
      title={viewTypeStore.data === "icon" ? "Switch to list view" : "Switch to icon view"}
    >
      <CustomIcon iconName={viewTypeStore.data === "table" ? "list" : "grid"} size="md" />
      View
    </Button>
  );
};
