import { Layout } from "@/components/layout/Layout";
import { pb } from "@/config/pocketbaseConfig";
import { AuthForm } from "@/modules/auth/AuthForm";
import { smartSubscribeToDirectories } from "@/modules/directories/dbDirectoriesUtils";
import { smartSubscribeToFiles } from "@/modules/files/dbFilesUtils";
import { useDirectoriesStore } from "@/modules/files/directoriesStore";
import { useFilesStore } from "@/modules/files/filesStore";
import { smartSubscribeToSettings } from "@/modules/settings/dbSettingsUtils";
import { useSettingsStore } from "@/modules/settings/settingsStore";
import { smartSubscribeToUsers, subscribeToUser } from "@/modules/users/dbUsersUtils";
import { useUsersStore } from "@/modules/users/usersStore";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useAiStoreSync } from "@/stores/aiStore";
import {
  useCurrentUserStore,
  useUnverifiedIsLoggedInStore,
  useUnverifiedIsLoggedInSync,
} from "@/stores/authDataStore";
import { useThemeStore } from "@/stores/themeStore";
import "@/styles/globals.css";
import "@/styles/markdown.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const themeStore = useThemeStore();
  const unverifiedIsLoggedInStore = useUnverifiedIsLoggedInStore();
  const filesStore = useFilesStore();
  const directoriesStore = useDirectoriesStore();
  const usersStore = useUsersStore();
  const settingsStore = useSettingsStore();
  const currentUserStore = useCurrentUserStore();

  themeStore.useThemeStoreSideEffect();
  useUnverifiedIsLoggedInSync({ pb });
  useAiStoreSync();

  useEffect(() => {
    // use anfn as return value is not cleanup
    (() => {
      if (unverifiedIsLoggedInStore.data.status === "loggedOut")
        return currentUserStore.setData({ status: "loggedOut" });

      if (unverifiedIsLoggedInStore.data.status === "loading")
        return currentUserStore.setData({ status: "loading" });

      if (unverifiedIsLoggedInStore.data.status !== "loggedIn")
        return console.error("should never be hit");

      return subscribeToUser({
        pb,

        id: unverifiedIsLoggedInStore.data.auth.record.id,
        onChange: (user) => {
          if (user) currentUserStore.setData({ status: "loggedIn", user });
          else currentUserStore.setData({ status: "loggedOut" });
        },
      });
    })();
  }, [unverifiedIsLoggedInStore.data]);

  useEffect(() => {
    if (currentUserStore.data.status === "loggedIn") {
      smartSubscribeToDirectories({ pb, onChange: (x) => directoriesStore.setData(x) });
      smartSubscribeToFiles({ pb, onChange: (x) => filesStore.setData(x) });
      smartSubscribeToUsers({ pb, onChange: (x) => usersStore.setData(x) });
      smartSubscribeToSettings({ pb, onChange: (x) => settingsStore.setData(x) });
    } else {
      directoriesStore.clear();
      filesStore.clear();
      usersStore.clear();
      settingsStore.clear();
    }
  }, [currentUserStore.data]);

  return (
    <>
      <Layout
        showLeftSidebar={
          currentUserStore.data.status === "loggedIn" &&
          ["approved", "admin"].includes(currentUserStore.data.user.status)
        }
      >
        {(() => {
          if (currentUserStore.data.status === "loading") return <LoadingScreen />;

          if (currentUserStore.data.status === "loggedOut")
            return (
              <div className="mt-16 flex justify-center">
                <AuthForm />
              </div>
            );

          // should not be required
          if (currentUserStore.data.status !== "loggedIn") {
            console.error(`this line should never be hit`);
            return;
          }

          if (currentUserStore.data.user.status === "pending") return <div>awaiting approval</div>;

          if (currentUserStore.data.user.status === "denied") return <div>blocked</div>;

          return <Component {...pageProps} />;
        })()}
      </Layout>
    </>
  );
}
