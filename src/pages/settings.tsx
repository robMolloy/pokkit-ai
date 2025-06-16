import { CustomIcon } from "@/components/CustomIcon";
import { MainLayout } from "@/components/layout/Layout";
import { H1 } from "@/components/ui/defaultComponents";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pb } from "@/config/pocketbaseConfig";
import { createSetting, updateSetting } from "@/modules/settings/dbSettingsUtils";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useAnthropicStore } from "@/stores/anthropicStore";
import { debounce } from "lodash";
import { useState } from "react";
import { useSettingsStore } from "../modules/settings/settingsStore";

const debouncedUpdate = debounce(
  (p: Parameters<typeof updateSetting>[0]) => updateSetting(p),
  1000,
);
// const debouncedUpdate = debounce((data: TSettingsRecord) => updateSetting({ pb, data }), 1000);

export const SettingItem = (p: {
  title: string;
  description: string;
  disabledTooltip?: string;
  children?: React.ReactNode;
}) => {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg">{p.title}</h2>
        <p className="text-sm text-gray-500">{p.description}</p>
      </div>
      {p.children}
    </div>
  );

  if (!!p.disabledTooltip) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-not-allowed opacity-50">{content}</div>
          </TooltipTrigger>
          <TooltipContent sideOffset={-30}>
            <p>{p.disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
};

const SettingsScreen = () => {
  const settingsStore = useSettingsStore();

  const anthropicSetting = settingsStore.data?.find((x) => x.provider === "anthropic");

  const anthropicStore = useAnthropicStore();

  const [anthropicApiKey, setAnthropicApiKey] = useState(anthropicSetting?.apiKey ?? "");

  return (
    <>
      <H1>Settings</H1>

      <br />

      <div>
        <SettingItem title="Anthropic API Key" description="API key for Anthropic">
          <div className="flex flex-col items-end justify-end gap-2">
            <div className="flex items-center gap-2">
              <Input
                value={anthropicApiKey}
                onChange={async (e) => {
                  setAnthropicApiKey(e.target.value);

                  anthropicStore.setData(undefined);

                  anthropicSetting
                    ? debouncedUpdate({
                        pb,
                        data: { ...anthropicSetting, apiKey: e.target.value },
                      })
                    : createSetting({
                        pb,
                        data: { provider: "anthropic", apiKey: e.target.value },
                      });
                }}
              />
              {anthropicStore.data && (
                <CustomIcon iconName="check" className="text-success" size="sm" />
              )}
              {anthropicStore.data === null && (
                <CustomIcon iconName="x" className="text-destructive" size="sm" />
              )}
              {anthropicStore.data === undefined && (
                <CustomIcon iconName="loader" size="sm" className="animate-spin" />
              )}
            </div>
          </div>
        </SettingItem>
      </div>
    </>
  );
};

const SettingsPage = () => {
  const settingsStore = useSettingsStore();

  return (
    <MainLayout>
      {settingsStore.data === undefined && <LoadingScreen />}
      {settingsStore.data !== undefined && <SettingsScreen />}
    </MainLayout>
  );
};

export default SettingsPage;
