# Azure VM Node.js Deployment Steps
# These should be done on the VM directly

# --- INSTALL PREREQUISITES ---

> **Note:** Download all required installers to the default **Downloads** folder (e.g., `C:\Users\<your-username>\Downloads`).
## Install IIS and necessary components (including IIS Management Console) on Windows Server

  - Open **Server Manager**
  - Click **Add roles and features**
  - Select **Role-based or feature-based installation**
  - Choose your server and click **Next**
  - Under **Server Roles**, check **Web Server (IIS)**
  - In the pop-up, ensure **Management Tools** (including **IIS Management Console**) are selected
  - Click **Next** and complete the wizard to install
- **Via PowerShell (recommended for automation):**
  ```powershell
  Install-WindowsFeature -Name Web-Server, Web-Mgmt-Console
  ```
- After installation, verify IIS is running by opening a browser on the VM and navigating to `http://localhost`. You should see the default IIS welcome page.



## Download and install URL Rewrite Module
- Download from: https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi
## (Optional) Unlock IIS configuration sections
- **Note:** This step is only required if you encounter errors such as "configuration section is locked at a parent level" when deploying or running your app with `web.config`. Most modern IIS installations do not require this unless the server-level configuration is locked.
- If needed, run the following PowerShell script:
     ```powershell
     Import-Module WebAdministration
     try {
         # Unlock handlers section to allow configuration in web.config
         Set-WebConfiguration -Filter "/system.webServer/handlers" -PSPath "IIS:\" -Metadata "overrideMode" -Value "Allow"
         # Unlock modules section if needed
         Set-WebConfiguration -Filter "/system.webServer/modules" -PSPath "IIS:\" -Metadata "overrideMode" -Value "Allow"
         Write-Host "IIS configuration sections unlocked successfully."
     } catch {
         Write-Warning "Could not unlock configuration sections: $($_.Exception.Message)"
     ```



## Download Node.js installer to your default Downloads folder (e.g., `C:\Users\<your-username>\Downloads`)
- Use PowerShell to download the installer (replace `<your-username>` as appropriate):
  ```powershell
  $NodeJsUrl = "<Node.js MSI download URL>"
  $NodeJsMsi = "node-lts.msi"  # or the actual filename
  $Downloads = "$env:USERPROFILE\Downloads"
  try {
    Invoke-WebRequest -Uri $NodeJsUrl -OutFile "$Downloads\$NodeJsMsi" -ErrorAction Stop
    Write-Host "Download complete."
  } catch {
    Write-Error "Failed to download installer: $($_.Exception.Message)"
    exit 1
  }
  ```


## Install Node.js (Silent)
```powershell
$Downloads = "$env:USERPROFILE\Downloads"
$NodeJsMsi = "node-lts.msi"  # or the actual filename
try {
  Start-Process msiexec -Wait -ArgumentList "/i `"$Downloads\$NodeJsMsi`" /qn ALLUSERS=1 ADDLOCAL=ALL" -ErrorAction Stop
  Write-Host "Node.js installed successfully."
} catch {
  Write-Error "Failed to install Node.js."
  exit 1
}
```

# --- DOWNLOAD FILES ---

## Clone the application files from GitHub
- Open a terminal or PowerShell window and run:
  ```powershell
  cd C:\inetpub\wwwroot
  git clone https://github.com/Azure-Samples/communication-services-javascript-quickstarts.git gcch-test-app
  ```
- This will create the `gcch-test-app` directory with all necessary source files in the IIS web root.


## Install application dependencies
- Open a terminal (command) window from the app root directory.
- Run: 
  ```shell
  npm install
  ```


# --- CONFIGURATION ---

## Configure external access for the application:
- Configure Windows Firewall rules:
  - PowerShell:
    ```powershell
    try {
        # Allow HTTP traffic (port 80)
        New-NetFirewallRule -DisplayName "Allow HTTP Inbound" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
        Write-Host "HTTP (port 80) firewall rule added"
        # Allow HTTPS traffic (port 443)
        New-NetFirewallRule -DisplayName "Allow HTTPS Inbound" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
        Write-Host "HTTPS (port 443) firewall rule added"
        # Allow port 8080 specifically
        New-NetFirewallRule -DisplayName "Allow Port 8080 Inbound" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -ErrorAction SilentlyContinue
        Write-Host "Port 8080 firewall rule added"
        Write-Host "Windows Firewall configured successfully"
    } catch {
        Write-Warning "Failed to configure Windows Firewall: $($_.Exception.Message)"
    }
    ```
- Configure IIS to listen on additional ports:
  - PowerShell:
    ```powershell
    try {
        Import-Module WebAdministration
        # Add binding for port 8080
        if (-not (Get-WebBinding -Name "Default Web Site" -Port 8080 -ErrorAction SilentlyContinue)) {
            New-WebBinding -Name "Default Web Site" -Protocol http -Port 8080
            Write-Host "Added IIS binding for port 8080"
        }
    } catch {
        Write-Warning "Failed to configure IIS bindings: $($_.Exception.Message)"
    }
    ```
- Generate Azure CLI commands for NSG configuration:
  - PowerShell:
    ```powershell
    $AzureCommands = @"
    # Azure CLI commands to configure Network Security Group
    # Run these commands in Azure Cloud Shell or local Azure CLI
    # Replace 'your-resource-group' and 'your-nsg-name' with actual values
    # Find these values in Azure Portal -> VM -> Networking
    # Allow HTTP (port 80)
    az network nsg rule create \
      --resource-group your-resource-group \
      --nsg-name your-nsg-name \
      --name Allow-HTTP-80 \
      --priority 1000 \
      --protocol Tcp \
      --destination-port-ranges 80 \
      --access Allow \
      --description "Allow HTTP traffic on port 80"
    # Allow port 8080
    az network nsg rule create \
      --resource-group your-resource-group \
      --nsg-name your-nsg-name \
      --name Allow-HTTP-8080 \
      --priority 1100 \
      --protocol Tcp \
      --destination-port-ranges 8080 \
      --access Allow \
      --description "Allow HTTP traffic on port 8080"
    # Allow HTTPS (port 443) - Optional
    az network nsg rule create \
      --resource-group your-resource-group \
      --nsg-name your-nsg-name \
      --name Allow-HTTPS-443 \
      --priority 1200 \
      --protocol Tcp \
      --destination-port-ranges 443 \
      --access Allow \
      --description "Allow HTTPS traffic on port 443"
    # List current NSG rules to verify
    az network nsg rule list \
      --resource-group your-resource-group \
      --nsg-name your-nsg-name \
      --output table
    "@
    $AzureCommands | Out-File "$AppDir\azure-nsg-config.sh" -Encoding UTF8
    Write-Host "Azure CLI commands saved to: $AppDir\azure-nsg-config.sh"
    ```

## Create URL Redirect configuration in IIS
- In IIS Manager, create a new website for your Node.js app:
  - Open IIS Manager and right-click **Sites** in the left panel, then select **Add Website...**
  - Enter a **Site name** (e.g., `NodeAppSite`).
  - Set the **Physical path** to the folder where your Node.js app is located (e.g., `C:\inetpub\wwwroot\gcch-test-app`).
  - Set the **Binding** type to `http` and choose an available port (e.g., 80 or 8080 for initial setup).
  - (You will add an HTTPS binding in the next step.)
  - (Optional) Set the **Host name** if you are using a custom domain.
  - Click **OK** to create the website.
  - Your new IIS site should now point to your Node.js app folder and be ready for further configuration.
- In IIS Manager, add a new binding for HTTPS (port 443) to your website:
  - Select your website in the left panel and click **Bindings...** in the right Actions pane.
  - Click **Add...** and set **Type** to `https` and **Port** to `443`.
  - For **SSL certificate**, select the certificate issued by win-acme (Let's Encrypt) from the dropdown list.
  - (Optional) Set the **Hostname** to your domain if you are using a custom domain.
  - Click **OK** to save the binding.
  - This enables secure HTTPS access to your site using the trusted certificate.
- Create a URL Rewrite inbound rule in IIS to forward all HTTPS requests to your Node.js app at `http://localhost:8080`:
  - Open IIS Manager and select your new website.
  - Double-click **URL Rewrite** in the site features view.
  - Click **Add Rule(s)...** and choose **Inbound Rule > Blank rule**.
  - Set the rule name, e.g., `ReverseProxyToNode`.
  - In the **Match URL** section:
    - Set **Requested URL** to `Matches the Pattern`.
    - Set **Using** to `Regular Expressions`.
    - Set **Pattern** to `(.*)` (this matches all URLs).
  - In the **Action** section:
    - Set **Action type** to `Rewrite`.
    - Set **Rewrite URL** to `http://localhost:8080/{R:1}`.
    - (Optional) Check **Append query string** if you want to forward query parameters.
  - Click **Apply** to save the rule.
  - This will forward all HTTPS traffic received by IIS to your Node.js app running on port 8080.

## Create environment configuration
- Update your `.env` file with the following:
  ```env
  # Required: Azure Communication Services connection string
  CONNECTION_STRING=your_acs_connection_string_here
  # Required: Your ACS phone number (include country code, e.g., +1234567890)
  ACS_RESOURCE_PHONE_NUMBER=your_acs_phone_number_here
  # Required: Your callback URI (should match your VM's public endpoint)
  CALLBACK_URI=https://your_vm_public_ip_or_domain
  # Optional: Port (default is 8080, but will use IIS port when deployed)
  PORT=8080
  # Optional: Cognitive Services endpoint for call intelligence
  COGNITIVE_SERVICES_ENDPOINT=your_cognitive_services_endpoint_here
  ```


# --- TEST ---

## Start application & test locally
- Start app by running:
  ```shell
  npm run dev
  ```
- Open a browser and test the app by typing `http://localhost:8080` in the address bar.


## Deployment complete!


# --- CLEANUP ---

## Cleanup
- Remove any unnecessary folders and files.
- Remove downloaded files.


# --- RUN ---

## Post-deployment verification & troubleshooting
- Check if IIS is running
- Check if the application pool is running
- Check if Node.js is properly installed
- Check IIS mappings
- In Node.js app root folder type:
  ```shell
  npm run build
  ```
- Execute:
  ```shell
  node dist/app.js
  ```
  This should start the app in production mode.
- Open a browser window in the VM and browse:
  http://localhost:8080/
- Open a browser window in a client machine and browse:
  https://<VM-DOMAIN-NAME>/
  Both should show the web app main page.

