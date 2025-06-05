import { useFilesStore } from "@/modules/files/filesStore";
import { useUsersStore } from "@/modules/users/usersStore";
import { useCurrentUserStore, useUnverifiedIsLoggedInStore } from "@/stores/authDataStore";

export default () => {
  const filesStore = useFilesStore();
  const usersStore = useUsersStore();
  const currentUserStore = useCurrentUserStore();
  const unverifiedIsLoggedInStore = useUnverifiedIsLoggedInStore();

  return (
    <div>
      <pre>
        {JSON.stringify(
          { filesStore, usersStore, currentUserStore, unverifiedIsLoggedInStore },
          undefined,
          2,
        )}
      </pre>
    </div>
  );
};
