Azure Communication Services rejects callback URLs that are not HTTPS and publicly reachable.

How to fix:
1. Use a publicly reachable HTTPS endpoint for `CALLBACK_URI` (recommended). For production/proper testing, host the app behind TLS (IIS with a cert) and set CALLBACK_URI to e.g. `https://mydomain.example.com`.

2. For local testing you can expose your local server over HTTPS with a tunneling tool such as ngrok:
   - Install ngrok (https://ngrok.com) and run `ngrok http 8080` which will give you a public HTTPS forwarding URL like `https://abcd1234.ngrok.io`.
   - Set `CALLBACK_URI` in your `.env` to that HTTPS URL (no trailing slash). Example:
     CALLBACK_URI="https://abcd1234.ngrok.io"

3. If you must use a static IP, put it behind a load balancer or gateway that provides TLS (HTTPS). ACS will not accept plain HTTP or self-signed certs.

After you change the `.env` to use an HTTPS callback URL, restart the app. The new validation added to `src/app.ts` will throw early and log an explanatory message if the value is still invalid.

# Quick Ngrok Setup for Local Development

This script automates starting an ngrok HTTPS tunnel and updating your `.env` file with the public callback URL required by Azure Communication Services.

## Prerequisites

1. **Install ngrok**: Download from [https://ngrok.com/download](https://ngrok.com/download)
2. **Add ngrok to PATH**: Ensure you can run `ngrok` from any terminal
3. **Optional**: Sign up for a free ngrok account to avoid session limits

## Usage

### Option 1: Run the PowerShell script directly

```powershell
.\scripts\start-ngrok-dev.ps1
```

This will:
- Start ngrok tunnel on port 8080 (default)
- Automatically update `CALLBACK_URI` in `.env` with the ngrok HTTPS URL
- Keep the tunnel running until you press Ctrl+C
- Restore your original `.env` when stopped

### Option 2: Use the npm script

```powershell
npm run ngrok
```

### Custom Port

If your app runs on a different port:

```powershell
.\scripts\start-ngrok-dev.ps1 -Port 3000
```

## What Happens

1. **Backup**: Your `.env` file is backed up (e.g., `.env.backup-20251020-143022`)
2. **Tunnel**: Ngrok creates a public HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. **Update**: The script replaces `CALLBACK_URI` in `.env` with the ngrok URL
4. **Monitor**: Ngrok runs in the background; you can inspect traffic at `http://127.0.0.1:4040`
5. **Restore**: When you press Ctrl+C, the original `.env` is restored automatically

## Workflow

1. Run the ngrok script: `.\scripts\start-ngrok-dev.ps1`
2. In a **separate terminal**, start your app: `npm run dev`
3. Test your ACS calls - callbacks will now work via HTTPS
4. When done, press Ctrl+C in the ngrok terminal to clean up

## Troubleshooting

**"Ngrok not found"**
- Install ngrok and add it to your system PATH
- Or run the script from the directory where `ngrok.exe` is located

**"Failed to retrieve ngrok public URL"**
- Check if port 8080 is already in use
- Ensure ngrok is properly installed
- Try running `ngrok http 8080` manually to test

**Tunnel session expires**
- Free ngrok tunnels expire after 2 hours
- Sign up for a free account at ngrok.com for longer sessions
- When it expires, just restart the script

## Production Deployment

⚠️ **Do not use ngrok for production!** Use a proper HTTPS endpoint:
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

## Verification

After updating to HTTPS, the validation code in `src/app.ts` will log:
```
✓ Server is listening on port 8080
✓ Creating ACS Client with connection string: ✓ Set
✓ Callback URI: https://yoururl.example.com/api/callbacks
```

If the URI is still invalid (HTTP), the app will throw an error on startup with a clear message.

## Additional Resources

- [Full ngrok setup guide](./docs/NGROK_SETUP.md)
- [Callback URI requirements](./docs/CALLBACK_URI_NOTE.md)
- [Azure DevTunnels alternative](https://learn.microsoft.com/azure/developer/dev-tunnels/get-started)