import { discoverApplicationMap } from "../../autonomous/discovery/applicationMap";

export async function getApplicationMap() {
  return discoverApplicationMap(process.cwd());
}
