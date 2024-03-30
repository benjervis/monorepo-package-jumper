import { getPackageDirectories } from "./packages";

import * as vscode from "vscode";
import { Workspace } from "ultra-runner";
import path from "node:path";

interface PickOption {
  label: string;
  detail: string;
  absPath: string;
}

const getBaseCwd = () => {
  const cwd = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  if (!cwd) {
    throw new Error("No VSCode workspace detected");
  }

  return cwd;
};

const getWorkspaceRoot = async () => {
  const cwd = getBaseCwd();

  const activeDocument = vscode.window.activeTextEditor?.document.fileName;

  // If the cwd has no workspace provider, then get nearest package directory

  const [cwdProvider] = await Workspace.detectWorkspaceProviders(cwd);

  // If the user doesn't have anything open, we'll just have to work from the very top level
  if (cwdProvider || !activeDocument) {
    return cwd;
  }

  const packageDirectories = await getPackageDirectories(cwd);

  const currentPackageDirectory = packageDirectories.find(
    ({ directory }) => activeDocument.indexOf(directory) === 0
  );

  return currentPackageDirectory?.directory ?? cwd;
};

const getPickOptions = async (
  context: vscode.ExtensionContext,
  workspaceRoot: string
): Promise<PickOption[]> => {
  const cachedOptions = context.workspaceState.get<PickOption[]>(workspaceRoot);

  if (cachedOptions) {
    return cachedOptions;
  }

  const workspace = await Workspace.getWorkspace({ cwd: workspaceRoot });

  if (!workspace) {
    throw new Error("Everything is ruined");
  }

  const freshOptions = workspace.getPackages().map((pkg) => ({
    label: `📦 ${pkg.name}`,
    detail: path.relative(workspaceRoot, pkg.root),
    absPath: pkg.root,
  }));

  context.workspaceState.update(workspaceRoot, freshOptions);

  return freshOptions;
};

export function activate(context: vscode.ExtensionContext) {
  const refreshCache = vscode.commands.registerCommand(
    "monorepo-package-jumper.refreshCache",
    async () => {
      const workspaceRoot = await getWorkspaceRoot();
      context.workspaceState.update(workspaceRoot, null);
    }
  );

  let jumpToPackage = vscode.commands.registerCommand(
    "monorepo-package-jumper.jumpToPackage",
    async () => {
      const workspaceRoot = await getWorkspaceRoot();

      const pickOptions = await getPickOptions(context, workspaceRoot);

      const result = await vscode.window.showQuickPick(pickOptions);

      if (!result) {
        return;
      }

      const openFilePicker = vscode.workspace.getConfiguration(
        "monorepo-package-jumper.openFilePicker"
      );

      if (!openFilePicker) {
        vscode.window.showTextDocument(
          vscode.Uri.file(`${result.absPath}/package.json`)
        );
      } else {
        const filterString = path.relative(getBaseCwd(), result.absPath);
        vscode.commands.executeCommand(
          "workbench.action.quickOpen",
          `${filterString} `
        );
      }

      // Update cache in background
    }
  );

  context.subscriptions.push(jumpToPackage);
  context.subscriptions.push(refreshCache);
}

// This method is called when your extension is deactivated
export function deactivate() {}
