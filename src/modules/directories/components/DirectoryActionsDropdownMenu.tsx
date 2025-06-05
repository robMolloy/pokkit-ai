import { ModalContent } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TDirectoryWithFullPath } from "@/modules/files/directoriesStore";
import { useModalStore } from "@/stores/modalStore";
import { DeleteDirectoryForm, RenameDirectoryForm } from "./RenameDirectoryForm";
import { CustomIcon } from "@/components/CustomIcon";

export const DirectoryActionsDropdownMenu = (p: { directory: TDirectoryWithFullPath }) => {
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
                description={`Rename ${p.directory.name}`}
                content={
                  <RenameDirectoryForm
                    directory={p.directory}
                    onSuccess={() => modalStore.close()}
                  />
                }
              />,
            );
          }}
        >
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();

            modalStore.setData(
              <ModalContent
                title="Confirm Delete"
                description={`Delete the directory ${p.directory.name} and all of its files and directories`}
                content={
                  <DeleteDirectoryForm
                    directory={p.directory}
                    onCancel={() => modalStore.close()}
                    onSuccess={() => modalStore.close()}
                  />
                }
              />,
            );
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
