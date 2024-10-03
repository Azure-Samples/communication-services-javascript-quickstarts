// Script to automate testing for various chat UI library samples.
// This script prompts the user to select a project and optionally installs dependencies
// before running end-to-end tests using Playwright. The test will open a browser window and
// run the initial steps for the samples. The user can continue testing in the same window.
// The session is set to be closed after 10 minutes.
// Please make sure to CLOSE the browser tab or window after the test is complete.
// Otherwise, the process will continue running and you might need to kill it manually.
//
// Usage: Change to the scripts directory
//        Run `node ui-library-run-playwright-tests.mjs [--install]`
//        Optionally, use `--install` to install the dependencies before running the tests.

import { exec } from "child_process";
import { select } from "@inquirer/prompts";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "..");

// The options for the user to choose from
const options = [
  {
    value: "ui-library-starting-with-chat-stateful",
  },
  {
    value: "ui-library-quickstart-teams-interop-meeting-chat",
  },
  {
    value: "ui-library-filesharing-chat-composite",
  },
  {
    value: "ui-library-filesharing-ui-components",
  },
  { value: "ui-library-quickstart-composites-with-dependency-isolation" },
];

const quickstartFolderPath = (folder) => {
  return path.join(repoRoot, folder);
};

// Prompt the user to choose an option
const promptUser = async (installDependencies) => {
  const answer = await select({
    message:
      "Choose a quickstart to set up below. You ALWAYS need to close the tab or browser where test is run to finish the test. Otherwise, you will stuck with running process for the app.",
    choices: options.map((option) => ({
      value: option.value,
    })),
  });

  const selectedOption = answer;

  // add dependencies install command based on the user input
  const appDepsInstall = installDependencies ? "&& npm install" : "";
  const appAndAPIDepsInstall = installDependencies
    ? "&& npm install && cd ./app && npm install && cd ../api && npm install && cd .."
    : "";

  // The commands for each option
  const commands = {
    "ui-library-starting-with-chat-stateful": `cd ${quickstartFolderPath(
      "ui-library-starting-with-chat-stateful"
    )} ${appDepsInstall} && npm run test:e2e`,
    "ui-library-quickstart-teams-interop-meeting-chat": `cd ${quickstartFolderPath(
      "ui-library-quickstart-teams-interop-meeting-chat"
    )} ${appDepsInstall} && npm run test:e2e`,
    "ui-library-filesharing-chat-composite": `cd ${quickstartFolderPath(
      "ui-library-filesharing-chat-composite"
    )} ${appAndAPIDepsInstall} && npm run test:e2e`,
    "ui-library-filesharing-ui-components": `cd ${quickstartFolderPath(
      "ui-library-filesharing-ui-components"
    )} ${appAndAPIDepsInstall} && npm run test:e2e`,
    "ui-library-quickstart-composites-with-dependency-isolation": `cd ${quickstartFolderPath(
      "ui-library-quickstart-composites-with-dependency-isolation"
    )} ${appDepsInstall} && npm run test:e2e`,
  };

  // Run the command for the selected option
  const command = commands[selectedOption];
  if (command) {
    console.log(`Executing command: ${command}`);
    const child = exec(command);

    // Capture and log stdout
    child.stdout.on("data", (data) => {
      console.log(`${data}`);
    });

    // Capture and log stderr
    child.stderr.on("data", (data) => {
      console.error(`${data}`);
    });

    // Handle command completion
    child.on("close", (code) => {
      console.log(`Command finished with exit code ${code}`);
    });
  } else {
    console.error("Invalid option selected.");
  }
};

const runPrompt = async (installDependencies) => {
  await promptUser(installDependencies).catch((error) => {
    console.error(`Error: ${error.message}`);
  });
};

// Check if the script should also install dependencies
runPrompt(process.argv.includes("--install"));
