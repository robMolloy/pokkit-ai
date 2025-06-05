import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useRightSidebarStore } from "@/stores/rightSidebarStore";
import { ReactNode } from "react";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RightSidebarContent = (p: { title: string; children: ReactNode }) => {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{p.title}</SheetTitle>
        <SheetDescription className="hidden">This is the right sidebar.</SheetDescription>
      </SheetHeader>
      <div className="mt-4">{p.children}</div>
    </>
  );
};

export function RightSidebar({ isOpen, onClose }: RightSidebarProps) {
  const rightSidebarStore = useRightSidebarStore();
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" aria-describedby="right-sidebar" className="w-[400px]">
        {rightSidebarStore.data}
      </SheetContent>
    </Sheet>
  );
}
