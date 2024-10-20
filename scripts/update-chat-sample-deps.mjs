//
// Script to automate chat UI library sample updates.
// This will run through the arrays of projects and update chat, calling and react
// libraries to the latest beta or stable versions.
//
// Usage: Change to the scripts directory
//        Run `node update-chat-sample-deps.mjs`
//

import { promisify } from "util";
import { exec as syncExec } from "child_process";
import { readFileSync, writeFileSync } from "fs";
const exec = promisify(syncExec);

const STABLE_PROJECTS = [];
const BETA_PROJECTS = [
  "join-chat-to-teams-meeting/Chat Experience",
  "join-chat-to-teams-meeting/Chat Experience with File Sharing",
  "join-chat-to-teams-meeting/Chat Experience with Inline Image",
  "ui-library-filesharing-chat-composite/app",
  "ui-library-filesharing-ui-components/app",
  "ui-library-quickstart-teams-interop-meeting-chat",
  "ui-library-starting-with-chat-stateful",
  "ui-library-quickstart-composites-with-dependency-isolation",
];

const UI_LIBRARY_NPMJS_API = "https://registry.npmjs.org/@azure/communication-react/";
const UI_LIBRARY_LATEST = `${UI_LIBRARY_NPMJS_API}/latest`;
const UI_LIBRARY_NEXT = `${UI_LIBRARY_NPMJS_API}/next`;

async function updateProjects(projectDirectories, versions) {
  // Update each beta-pinned project with newer versions
  for (const projectDirectory of projectDirectories) {
    console.log("\nProcessing: " + projectDirectory + "\n");
    const packageFileLocation = `../${projectDirectory}/package.json`;

    // Load up package.json for that project
    const packageFile = readFileSync(packageFileLocation);
    const packageJson = JSON.parse(packageFile);
    let changed = false;

    // Traverse regular and peer deps
    for (const depType of ["dependencies", "peerDependencies"]) {
      if (!!packageJson[depType] && !!packageJson[depType]["@azure/communication-calling"]) {
        console.log("Updating communication-calling to " + versions.callingDepVersion);
        packageJson[depType]["@azure/communication-calling"] = versions.callingDepVersion;
        changed = true;
      }
      if (!!packageJson[depType] && !!packageJson[depType]["@azure/communication-chat"]) {
        console.log("Updating communication-chat to " + versions.chatDepVersion);
        packageJson[depType]["@azure/communication-chat"] = versions.chatDepVersion;
        changed = true;
      }
      if (!!packageJson[depType] && !!packageJson[depType]["@azure/communication-react"]) {
        console.log("Updating communication-react to " + versions.nextUiLibVersion);
        packageJson[depType]["@azure/communication-react"] = versions.nextUiLibVersion;
        changed = true;
      }
    }
    if (changed) {
      // Write changes back to package.json
      console.log("\nWriting updated package.json");
      writeFileSync(packageFileLocation, JSON.stringify(packageJson, null, 2));
    }

    // Install packages via npm
    try {
      console.log("\nInstalling via NPM\n");
      await exec(`cd "../${projectDirectory}"; npm install`);
    } catch (e) {
      console.error(`${projectDirectory} failed to update!`);
      console.error(e.stdout);
      if (!!e.stderr) {
        console.error(e.stderr);
      }
    }
  }
}

async function main() {
  let npmResponse = await fetch(UI_LIBRARY_NEXT);
  const betaPackageJson = await npmResponse.json();
  npmResponse = await fetch(UI_LIBRARY_LATEST);
  const stablePackageJson = await npmResponse.json();

  // Extract dependencies we need to sync too
  const extractVersions = (json) => {
    return {
      callingDepVersion: json["peerDependencies"]["@azure/communication-calling"],
      chatDepVersion: json["peerDependencies"]["@azure/communication-chat"],
      nextUiLibVersion: json["version"],
    };
  };

  await updateProjects(STABLE_PROJECTS, extractVersions(stablePackageJson));
  await updateProjects(BETA_PROJECTS, extractVersions(betaPackageJson));
}

main();
