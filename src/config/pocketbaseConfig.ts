import PocketBase from "pocketbase";

const pbInstanceMap = {
  pbLocal: () => new PocketBase("http://127.0.0.1:8090"),
  pbRemote: () => new PocketBase("https://romolo.pockethost.io"),
};

export const pb = pbInstanceMap.pbLocal();
