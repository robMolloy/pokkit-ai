import { useUsersStore } from "@/modules/users/usersStore";
import { useCurrentUserStore, useUnverifiedIsLoggedInStore } from "@/stores/authDataStore";

export default () => {
  const usersStore = useUsersStore();
  const currentUserStore = useCurrentUserStore();
  const unverifiedIsLoggedInStore = useUnverifiedIsLoggedInStore();

  return (
    <div>
      <pre>
        {JSON.stringify({ usersStore, currentUserStore, unverifiedIsLoggedInStore }, undefined, 2)}
      </pre>
    </div>
  );
};
