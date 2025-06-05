import { CustomIcon } from "@/components/CustomIcon";
import { MainLayout } from "@/components/layout/Layout";
import { OptimisticSwitch } from "@/components/OptimisticSwitch";
import { H1 } from "@/components/ui/defaultComponents";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { pb } from "@/config/pocketbaseConfig";
import { createSetting, updateSetting } from "@/modules/settings/dbSettingsUtils";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useAiStore } from "@/stores/aiStore";
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

const HorizontalSpacer = () => {
  return <div className="my-4 h-px bg-secondary" />;
};

const SettingsScreen = () => {
  const settingsStore = useSettingsStore();

  const versionHistorySetting = settingsStore.data?.find((x) => x.settingName === "versionHistory");
  const clientSideEncryptionSetting = settingsStore.data?.find(
    (x) => x.settingName === "clientSideEncryption",
  );
  const aiChatSetting = settingsStore.data?.find((x) => x.settingName === "aiChat");

  const aiStore = useAiStore();

  const [aiChatSettingValue, setAiChatSettingValue] = useState(aiChatSetting?.value ?? "");

  return (
    <>
      <H1>Settings</H1>

      <br />

      <div>
        <SettingItem
          title="Use AI Chat"
          description="Allow AI chat and index your files with suitable keywords to allow smart search"
        >
          <div className="flex flex-col items-end justify-end gap-2">
            <OptimisticSwitch
              checked={aiChatSetting?.isEnabled ?? false}
              onCheckedChange={(isEnabled) => {
                if (aiChatSetting)
                  return updateSetting({ pb, data: { ...aiChatSetting, isEnabled } });

                return createSetting({ pb, data: { settingName: "aiChat", isEnabled } });
              }}
            />

            <div className="flex items-center gap-2">
              <Input
                disabled={!aiChatSetting?.isEnabled}
                value={aiChatSettingValue}
                onChange={async (e) => {
                  setAiChatSettingValue(e.target.value);
                  if (!aiChatSetting) return; // won't get hit - disabled switch will prevent this
                  aiStore.setData(undefined);

                  await debouncedUpdate({ pb, data: { ...aiChatSetting, value: e.target.value } });
                }}
              />
              {aiStore.data && <CustomIcon iconName="check" className="text-success" size="sm" />}
              {aiStore.data === null && (
                <CustomIcon iconName="x" className="text-destructive" size="sm" />
              )}
              {aiStore.data === undefined && (
                <CustomIcon iconName="loader" size="sm" className="animate-spin" />
              )}
            </div>
          </div>
        </SettingItem>
        <HorizontalSpacer />
        <SettingItem
          title="Store Version History"
          description="Keep track of file changes and maintain version history"
        >
          <OptimisticSwitch
            checked={versionHistorySetting?.isEnabled ?? false}
            onCheckedChange={(isEnabled) => {
              if (versionHistorySetting)
                return updateSetting({ pb, data: { ...versionHistorySetting, isEnabled } });

              return createSetting({ pb, data: { settingName: "versionHistory", isEnabled } });
            }}
          />
        </SettingItem>

        <HorizontalSpacer />

        <SettingItem
          title="Client-Side File Encryption"
          description="Enable client-side encryption when storing files - whether on or off, always use https to ensure files are encrypted when being sent to the server"
          disabledTooltip="File encryption is not yet implemented"
        >
          <OptimisticSwitch
            checked={clientSideEncryptionSetting?.isEnabled ?? false}
            disabled={true}
            onCheckedChange={(isEnabled) => {
              if (clientSideEncryptionSetting)
                return updateSetting({ pb, data: { ...clientSideEncryptionSetting, isEnabled } });

              return createSetting({
                pb,
                data: { settingName: "clientSideEncryption", isEnabled },
              });
            }}
          />
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
