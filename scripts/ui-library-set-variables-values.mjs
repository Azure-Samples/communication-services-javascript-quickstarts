// Script to automate updating variables in various UI library sample files.
// This script prompts the user for input values and updates specified variables
// in the listed files. It handles both single-line and multi-line strings, ensuring
// that multi-line strings are updated correctly by removing the next line if needed.
//
// Usage: Change to the scripts directory
//        Run `node ui-library-set-variables-values.mjs`
//        Optionally, use `--restore` to restore default values

import fs from "fs";
import readline from "readline";

// List of files to be updated
const filesToUpdate = [
  // ui-library-filesharing-chat-composite
  "../ui-library-filesharing-chat-composite/api/local.settings.json",
  "../ui-library-filesharing-chat-composite/app/src/App.tsx",

  // ui-library-starting-with-chat-stateful
  "../ui-library-starting-with-chat-stateful/src/App.tsx",

  // ui-library-filesharing-ui-components
  "../ui-library-filesharing-ui-components/api/local.settings.json",
  "../ui-library-filesharing-ui-components/app/src/App.tsx",

  // ui-library-quickstart-teams-interop-meeting-chat
  "../ui-library-quickstart-teams-interop-meeting-chat/src/App.tsx",

  // ui-library-quickstart-composites-with-dependency-isolation
  "../ui-library-quickstart-composites-with-dependency-isolation/src/App.tsx",

  // Add more file paths as needed
];

// Make changes in the line
const updateLine = (line, value, isMultiline) => {
  const lastChar = line[line.length - 1];
  // check if last char is a comma or semicolon to add it back if needed
  const shouldAddLastChar = /[,;]/.test(lastChar);
  // check if the line uses equal sign or colon
  const usesEqualSign = line.includes(" =");
  // get the key from the line
  const [key] = usesEqualSign ? line.split("=") : line.split(":");
  // return the updated line
  // {usesEqualSign ? "=" : ":"} - use "=" vs ":" depending which one was already used in the line
  // shouldAddLastChar ? lastChar : isMultiline && usesEqualSign ? ";" : "" -
  // if there was a comma or semicolon at the end of the line, add it back.
  // For multiline strings that use equal sign, always add a semicolon at the end
  return `${key}${usesEqualSign ? "=" : ":"} \"${value}\"${
    shouldAddLastChar ? lastChar : isMultiline && usesEqualSign ? ";" : ""
  }`;
};

// Function to prompt the user for input
function promptUser(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

// Main function to run the script
async function main() {
  const endpointUrl = await promptUser(
    "Enter Azure Communication Services Resource Endpoint: "
  );
  const azureStorageConnectionString = await promptUser(
    "Enter Azure Communication Services Storage Connection String: "
  );
  const token = await promptUser(
    "Enter Azure Communication Services Resource Access Token: "
  );
  const userId = await promptUser("Enter User Id associated to the token: ");
  const threadId = await promptUser(
    "Enter Azure Communication Services thread id: "
  );
  const teamsMeetingLink = await promptUser("Enter Teams Meeting link: ");
  const displayName = await promptUser("Enter Display Name: ");

  const replacements = {
    "const ENDPOINT_URL =": endpointUrl,
    "const TOKEN =": token,
    "const USER_ID =": userId,
    "const DISPLAY_NAME =": displayName,
    '"azureStorageConnectionString":': azureStorageConnectionString,
    "const TEAMS_MEETING_LINK =": teamsMeetingLink,
    "const THREAD_ID =": threadId,
  };
  updateFiles(filesToUpdate, replacements);
}

// Default values to restore the files
const defaultValues = {
  "const ENDPOINT_URL =": "<Azure Communication Services Resource Endpoint>",
  "const TOKEN =": "<Azure Communication Services Resource Access Token>",
  "const USER_ID =": "<User Id associated to the token>",
  "const DISPLAY_NAME =": "<Display Name>",
  '"azureStorageConnectionString":': "<CONNECTION_STRING>",
  "const TEAMS_MEETING_LINK =": "<Teams Meeting Link>",
  "const THREAD_ID =": "<Get thread id from chat service>",
};

function updateFiles(files, replacements) {
  files.forEach((filePath) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Error reading file ${filePath}:`, err);
        return;
      }
      // delete the next line after the update if it's multiLine string
      let shouldDeleteNextLine = false;

      let updatedContent = data
        .split("\n")
        .map((line) => {
          for (const [pattern, value] of Object.entries(replacements)) {
            if (shouldDeleteNextLine) {
              // we don't need this line anymore
              shouldDeleteNextLine = false;
              return "[TO BE REMOVED]";
            }
            if (line.includes(pattern)) {
              // check for multiLine string
              if (
                line[line.length - 1] === ":" ||
                line[line.length - 1] === "="
              ) {
                shouldDeleteNextLine = true;
              }
              return updateLine(line, value, shouldDeleteNextLine);
            }
          }
          return line;
        })
        .filter((line) => line !== "[TO BE REMOVED]")
        .join("\n");

      fs.writeFile(filePath, updatedContent, "utf8", (err) => {
        if (err) {
          console.error(`Error writing file ${filePath}:`, err);
        } else {
          console.log(`File ${filePath} updated successfully.`);
        }
      });
    });
  });
}

// Check if the script should restore backups
if (process.argv.includes("--restore")) {
  // restoreBackups();
  updateFiles(filesToUpdate, defaultValues);
} else {
  main();
}
