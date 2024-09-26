---
page_type: sample
languages:
  - javascript
products:
  - azure
  - azure-communication-services
---

# Automation Scripts

This folder contains scripts to automate various tasks for samples, including updating dependencies, setting variable values, and running end-to-end tests using Playwright. [Please see the recommended steps to run the Quickstarts below](#recommended-usage-of-the-scripts-for-testing-web-ui-library-quickstarts).

## Scripts

### 1. Update Chat Sample Dependencies

Script to automate chat UI library sample updates. This will run through the arrays of projects and update chat, calling, and react libraries to the latest beta or stable versions.

**Usage**:

1. Change to the scripts directory.
1. Run `node update-chat-sample-deps.mjs`.

### 2. Set Variables Values for Chat UI library

Script to automate updating variables in various UI library sample files. This script prompts the user for input values and updates specified variables in the listed files. It handles both single-line and multi-line strings, ensuring that multi-line strings are updated correctly by removing the next line if needed.

**Usage**:

1. Change to the scripts directory.
1. Run `node ui-library-set-variables-values.mjs`.
1. Optionally, use `--restore` to restore default values.

### 3. Run Playwright Tests

Script to automate testing for various chat UI library samples. This script prompts the user to select a project and optionally installs dependencies before running end-to-end tests using Playwright. The test will open a browser window and run the initial steps for the samples. The user can continue testing in the same window. The session is set to be closed after **10 minutes**. Please make sure to **CLOSE the browser tab or window after the test is complete**. Otherwise, the process will continue running and you might need to kill it manually.

**Usage**:

1. Change to the scripts directory.
1. Run `npm install` to install dependencies for the script.
1. Run `node ui-library-run-playwright-tests.mjs [--install]`. Optionally, use `--install` to install all needed the dependencies before running the tests.
1. Do any additional testing in the window that was opened by Playwright. Please note that some tests like Teams sample or file sharing need manual testing from the user (allow the user to the Teams meeting, send files).
1. **CLOSE the browser tab or window after the test is complete**. Otherwise, the process will continue running and you might need to kill it manually.

## Recommended usage of the scripts for testing Web UI library Quickstarts

1. Change to the scripts directory.
1. Run `npm install` in Terminal.
1. (if the dependencies needs to be updated) Run `node update-chat-sample-deps.mjs`.
1. Run `node ui-library-set-variables-values.mjs` to update variables for samples.
1. Run `node ui-library-run-playwright-tests.mjs --install` to select a sample, install dependencies and start it.
1. Do any additional testing in the window that was opened by Playwright. Please note that some tests like Teams sample or file sharing need manual testing (allow the user to the Teams meeting, send files) as they need to be done outside of the Web apps or have dependency on file manager of a user.
1. **CLOSE the browser tab or window after the test is complete**. Otherwise, the process will continue running and you might need to kill it manually.
1. Repeat steps 5-7 to test all needed samples.
1. Run `node ui-library-set-variables-values.mjs --restore` to restore default values.
1. Commit and push the changes, and create a PR for them.
