import { ModalContent } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TFileRecord } from "@/modules/files/dbFilesUtils";
import { useModalStore } from "@/stores/modalStore";
import { CustomIcon } from "@/components/CustomIcon";
import { RenameFileForm } from "./RenameFileForm";

export const FileActionsDropdownMenu = (p: { file: TFileRecord }) => {
  const modalStore = useModalStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground"
          onClick={async (e) => e.stopPropagation()}
        >
          <CustomIcon iconName="moreVertical" size="md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            modalStore.setData(
              <ModalContent
                title="Rename"
                description={`Rename ${p.file.name}`}
                content={<RenameFileForm file={p.file} onSuccess={() => modalStore.close()} />}
              />,
            );
          }}
        >
          Rename
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
