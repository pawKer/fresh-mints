import * as path from "path";
import { load } from "csv-load-sync";

const loadDefaultAddresses = () => {
  console.log("Loading default addresses to follow.");
  const addressMap = new Map();
  load(
    path.resolve(path.resolve(), "assets", "followingAddresses.csv")
  ).forEach((item) => addressMap.set(item.address, item.name));
  return addressMap;
};

export { loadDefaultAddresses };
