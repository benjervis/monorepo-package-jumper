import { Workspace } from "ultra-runner";

import path from "node:path";
import fs from "node:fs/promises";

export const getPackageDirectories = async (cwd: string) => {
  const dir = await fs.readdir(cwd, { withFileTypes: true });
  const directories = await Promise.all(
    dir
      .filter((dir) => dir.isDirectory() && dir.name[0] !== ".")
      .map((dir) => path.join(cwd, dir.name))
      .map(async (directory) => ({
        directory,
        workspaceProviders: await Workspace.detectWorkspaceProviders(directory),
      }))
  );

  return directories.filter(
    ({ workspaceProviders }) => workspaceProviders.length > 0
  );
};
