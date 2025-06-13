import { Button } from "@/components/ui/button";
import { pb } from "@/config/pocketbaseConfig";
import { logout } from "@/modules/auth/dbAuthUtils";
import { useUsersStore } from "@/modules/users/usersStore";
import { useAiStore } from "@/stores/aiStore";
import { useCurrentUserStore } from "@/stores/authDataStore";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { CustomIcon } from "../CustomIcon";

const SidebarButtonWrapper = (p: { children: ReactNode; href?: string; disabled?: boolean }) => {
  return p.href ? (
    <Link href={p.disabled ? "#" : p.href} className={p.disabled ? "pointer-events-none" : ""}>
      {p.children}
    </Link>
  ) : (
    p.children
  );
};

const SidebarButton = (p: {
  href?: string;
  iconName: React.ComponentProps<typeof CustomIcon>["iconName"];
  children: ReactNode;
  isHighlighted: boolean;
  onClick?: () => void;
  badgeCount?: number;
  disabled?: boolean;
}) => {
  return (
    <SidebarButtonWrapper href={p.href} disabled={p.disabled}>
      <Button
        variant={p.isHighlighted ? "secondary" : "ghost"}
        className={`relative w-full justify-start pl-6 ${p.disabled ? "pointer-events-none" : ""}`}
        onClick={p.onClick}
        disabled={p.disabled}
      >
        <span className="mr-2">
          <CustomIcon
            iconName={p.iconName}
            size="sm"
            className={p.disabled ? "text-muted-foreground" : ""}
          />
        </span>
        <div className={p.disabled ? "text-muted-foreground" : ""}>{p.children}</div>
        {p.badgeCount !== undefined && p.badgeCount > 0 && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
            {p.badgeCount}
          </span>
        )}
      </Button>
    </SidebarButtonWrapper>
  );
};

export function LeftSidebar() {
  const router = useRouter();
  const currentUserStore = useCurrentUserStore();
  const usersStore = useUsersStore();
  const pendingUsersCount = usersStore.data.filter((user) => user.status === "pending").length;

  const aiStore = useAiStore();
  return (
    <div className={"flex h-full flex-col"}>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          <SidebarButton href="/" iconName={"home"} isHighlighted={router.pathname === "/"}>
            Home
          </SidebarButton>
          <SidebarButton
            disabled={!aiStore.data}
            href="/ai-chat"
            iconName="brain"
            isHighlighted={router.pathname === "/ai-chat"}
          >
            AI Chat
          </SidebarButton>
        </div>
      </div>

      <div className="border-t p-2">
        <div className="flex flex-col gap-1">
          {currentUserStore.data.status === "loggedIn" &&
            currentUserStore.data.user.status === "admin" && (
              <SidebarButton
                href="/users"
                iconName="users"
                isHighlighted={router.pathname === "/users"}
                badgeCount={pendingUsersCount}
              >
                Users
              </SidebarButton>
            )}
          {currentUserStore.data.status === "loggedIn" &&
            currentUserStore.data.user.status === "admin" && (
              <SidebarButton
                href="/settings"
                iconName="settings"
                isHighlighted={router.pathname === "/settings"}
              >
                Settings
              </SidebarButton>
            )}
          <SidebarButton iconName="logOut" isHighlighted={false} onClick={() => logout({ pb })}>
            Log Out
          </SidebarButton>
        </div>
      </div>
    </div>
  );
}
