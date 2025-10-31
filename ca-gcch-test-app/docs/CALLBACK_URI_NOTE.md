Azure Communication Services rejects callback URLs that are not HTTPS and publicly reachable.

How to fix:
1. Use a publicly reachable HTTPS endpoint for `CALLBACK_URI` (recommended). For production/proper testing, host the app behind TLS (IIS with a cert) and set CALLBACK_URI to e.g. `https://mydomain.example.com`.

After you change the `.env` to use an HTTPS callback URL, restart the app. The new validation added to `src/app.ts` will throw early and log an explanatory message if the value is still invalid.

2. For local testing you can expose your local server over HTTPS with a tunneling tool such as ngrok or devtunnel:
    - Install ngrok (https://ngrok.com) and run `ngrok http 8080` which will give you a public HTTPS forwarding URL like `https://abcd1234.ngrok.io`.
    - Install Azure Dev Tunnel CLI:
       - `npm install -g @dev-tunnels/cli`
       - Sign in: `devtunnel user login`
       - Start a tunnel: `devtunnel create --port 8080 --allow-anonymous`
       - This will give you a public HTTPS forwarding URL like `https://<random>.dev.tunnels.ms`
   - Set `CALLBACK_URI` in your `.env` to that HTTPS URL (no trailing slash). Example:
     CALLBACK_URI="https://abcd1234.ngrok.io"
  - The `scripts/start-ngrok-dev.ps1` PowerShell script will help you quickly create a public HTTPS URL with ngrok and automatically update your `.env` file. See the script for usage details.

3. If you must use a static IP, put it behind a load balancer or gateway that provides TLS (HTTPS). ACS will not accept plain HTTP or self-signed certs.


## Production Deployment

⚠️ **Do not use ngrok/devtunnel for production!** Use a proper HTTPS endpoint:
- Azure App Service with managed TLS certificate
- IIS with a valid SSL certificate
- Azure Application Gateway or Load Balancer with TLS
- Any public HTTPS endpoint that Azure can reach

### Option 3: Production HTTPS Setup

For production or permanent testing, use a real HTTPS endpoint:

- **IIS with SSL Certificate**: Configure IIS with a valid SSL cert and use your domain (e.g., `https://yourapp.example.com`)
- **Azure App Service**: Deploy to Azure App Service which provides managed HTTPS
- **Azure Application Gateway**: Use a load balancer with TLS termination

Update `CALLBACK_URI` in `.env` to your HTTPS endpoint.

## Certificate

To create a universally accepted SSL certificate for IIS on Windows, use [win-acme](https://www.win-acme.com/):

### Steps

1. Download win-acme from https://www.win-acme.com/ and extract it on your server.
2. Open a Command Prompt as Administrator in the win-acme folder.
3. Run `wacs.exe` and follow the interactive prompts:
  - Choose `N` for a new certificate.
  - Select `Single binding of an IIS site` or `Manual input` as appropriate.
  - Enter your domain name (must be publicly accessible and point to this server).
  - Choose to install the certificate in IIS and optionally set up automatic renewal.
4. After completion, IIS will use the new trusted certificate for HTTPS.

**Note:**
- Your domain must point to your public IP and be accessible from the internet for Let's Encrypt validation.

## Verification

After updating to HTTPS, the validation code in `src/app.ts` will log:
```
✓ Server is listening on port 8080
✓ Creating ACS Client with connection string: ✓ Set
✓ Callback URI: https://yoururl.example.com/api/callbacks
```

If the URI is still invalid (HTTP), the app will throw an error on startup with a clear message.

