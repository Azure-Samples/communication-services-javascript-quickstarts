const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

export class NgrokService {
  ngrokConfig;
  ngrokProc = "ngrok.exe";
  ngrokTunnelUrl = "http://127.0.0.1:4040/api/tunnels";

  constructor() {
    this.ngrokConfig = path.resolve("ngrok.yml");
  }

  /// <summary>
  /// Ensures that NGROK is not running.
  /// </summary>
  async ensureNgrokNotRunning(ngrokPath) {
    if (!fs.existsSync(this.ngrokConfig)) {
      console.log("Can't run ngrok - missing " + this.ngrokConfig);
      return false;
    }

    let url = await this.getNgrokUrl();
    if (url) {
      console.log("ngrok already running.");
      await this.dispose();
      await this.createNgrokProcess(ngrokPath);
    } else {
      await this.createNgrokProcess(ngrokPath);
    }
  }

  /// <summary>
  /// Get Ngrok URL
  /// </summary>
  async getNgrokUrl() {
    const axios = require("axios");
    let ngrokUrl = "";
    var totalAttempts = 3;

    do {
      await this.delay(2000);

      try {
        const response = await axios.get(this.ngrokTunnelUrl);
        ngrokUrl = response.data.tunnels[0].public_url;
        return ngrokUrl;
      } catch (ex) {
        if (ex && ex.response && ex.response.status == "402") {
          console.log("Failed to get Ngrok url " + ex.message);
          return null;
        }
      }
    } while (totalAttempts--);

    return ngrokUrl;
  }

  /// <summary>
  /// Creates the NGROK process.
  /// </summary>
  async createNgrokProcess(ngrokPath) {
    try {
      console.log("Starting ngrok...");
      const fileName = ngrokPath + "ngrok.exe";
      const start = ["start", "-config=" + this.ngrokConfig, "app"];
      const proc = spawn(fileName, start, { cwd: ngrokPath, detached: true });
      proc.unref();
    } catch (ex) {
      console.log("Failed to start Ngrok.exe : " + ex.message);
    }
  }

  /// <summary>
  /// Kill ngrok.exe process
  /// </summary>
  async dispose() {
    const fkill = require("fkill");
    await fkill(this.ngrokProc, { force: true });
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
