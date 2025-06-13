import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { Modal } from "../Modal";

export const MainLayout = (p: {
  children: React.ReactNode;
  padding?: boolean;
  fillPageExactly?: boolean;
}) => {
  const padding = p.padding ?? true;
  return (
    <div className={`${p.fillPageExactly ? "h-full" : "min-h-full"} ${padding ? "p-6" : ""}`}>
      {p.children}
    </div>
  );
};

export function Layout(p: { children: React.ReactNode; showLeftSidebar: boolean }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {p.showLeftSidebar && (
          <aside className="hidden h-[calc(100vh-3.5rem)] w-64 overflow-y-auto border-r bg-background md:block">
            <LeftSidebar />
          </aside>
        )}
        <main className="h-[calc(100vh-3.5rem)] w-full overflow-y-auto">{p.children}</main>
      </div>
      <Modal />
    </div>
  );
}
