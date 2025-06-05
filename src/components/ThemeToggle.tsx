import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/themeStore";
import { CustomIcon } from "./CustomIcon";

export function ThemeToggle() {
  const themeStore = useThemeStore();
  const theme = themeStore.data;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={themeStore.cycleTheme}
      title={(() => {
        return theme === "light" ? "Light mode" : theme === "dark" ? "Dark mode" : "System theme";
      })()}
    >
      <CustomIcon
        iconName={theme === "light" ? "sun" : theme === "dark" ? "moon" : "monitor"}
        size="sm"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
