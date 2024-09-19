import { exec } from "child_process";
import { select } from "@inquirer/prompts";

// Define the options
const options = [
  {
    name: "ui-library-starting-with-chat-stateful",
    value: "ui-library-starting-with-chat-stateful",
  },
  {
    name: "ui-library-quickstart-teams-interop-meeting-chat",
    value: "ui-library-quickstart-teams-interop-meeting-chat",
  },
];

// Prompt the user to choose an option
const promptUser = async () => {
  const answer = await select({
    message: "Choose a quickstart to set up:",
    choices: options.map((option) => ({
      name: option.name,
      value: option.value,
    })),
  });

  const selectedOption = answer;

  // Define the commands for each option
  const commands = {
    "ui-library-starting-with-chat-stateful":
      "cd ../ui-library-starting-with-chat-stateful && npm run test:e2e",
    "ui-library-quickstart-teams-interop-meeting-chat":
      "cd ../ui-library-quickstart-teams-interop-meeting-chat && npm run test:e2e",
  };

  // Run the command for the selected option
  const command = commands[selectedOption];
  if (command) {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error output: ${stderr}`);
        return;
      }
      console.log(`Command output: ${stdout}`);
    });
  } else {
    console.error("Invalid option selected.");
  }
};

// Run the prompt
promptUser().catch((error) => {
  console.error(`Error: ${error.message}`);
});
