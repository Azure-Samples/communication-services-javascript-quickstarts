# generate-self-signed-cert.ps1
# Creates a certs/ folder (sibling to this scripts/ folder) and generates a self-signed certificate for localhost.
# If OpenSSL is installed it will create server.key and server.crt (PEM). Otherwise it will create a PFX and show commands to convert.

Param(
    [string]$DnsName = "localhost",
    [int]$DaysValid = 365,
    [string]$PfxPassword = "changeit"
)

Set-StrictMode -Version Latest

# Determine project root (one level up from scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
$certDir = Join-Path $projectRoot "certs"

Write-Output "Project root: $projectRoot"
Write-Output "Cert directory: $certDir"

# Create certs folder
if (-not (Test-Path $certDir)) {
    New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

# Paths
$keyPath = Join-Path $certDir 'server.key'
$certPath = Join-Path $certDir 'server.crt'
$pfxPath = Join-Path $certDir 'server.pfx'

# If OpenSSL is available, use it to create PEM key/cert directly
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    Write-Output "OpenSSL detected. Generating PEM key and certificate..."
    $subj = "/CN=$DnsName"
    $opensslCmd = "req -x509 -nodes -days $DaysValid -newkey rsa:2048 -keyout `"$keyPath`" -out `"$certPath`" -subj `"$subj`""
    Write-Output "Running: openssl $opensslCmd"
    & openssl $opensslCmd
    if ($LASTEXITCODE -eq 0) {
        Write-Output "Created PEM key and cert: $keyPath, $certPath"
    } else {
        Write-Error "OpenSSL command failed with exit code $LASTEXITCODE"
    }
    return
}

# Fallback: Use New-SelfSignedCertificate to create a cert in cert store and export to PFX
Write-Output "OpenSSL not found. Creating self-signed cert via PowerShell and exporting to PFX ($pfxPath)..."

try {
    $cert = New-SelfSignedCertificate -Subject "CN=$DnsName" -DnsName $DnsName -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddDays($DaysValid)
    $securePwd = ConvertTo-SecureString -String $PfxPassword -Force -AsPlainText
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePwd -Force | Out-Null
    Write-Output "Exported PFX to: $pfxPath"
    Write-Output "To convert the PFX to PEM (server.key and server.crt) install OpenSSL and run the following commands:" 
    Write-Output "openssl pkcs12 -in `"$pfxPath`" -nocerts -nodes -out `"$keyPath`" -passin pass:$PfxPassword"
    Write-Output "openssl pkcs12 -in `"$pfxPath`" -clcerts -nokeys -out `"$certPath`" -passin pass:$PfxPassword"
} catch {
    Write-Error "Failed to create or export certificate: $_"
}
