# Usage: .\set-tunnel.ps1 https://xxxxx-45-89-90-174.free.pinggy.net
# Saves the tunnel URL as Telegram:MiniAppUrl and restarts the backend, which re-points the bot's menu button on start.
param(
    [Parameter(Mandatory = $true)][string]$Url
)

$ErrorActionPreference = 'Stop'

if ($Url -notmatch '^https://') {
    throw 'Telegram only accepts https URLs.'
}
if (-not $Url.EndsWith('/')) { $Url += '/' }

$root = $PSScriptRoot
$project = Join-Path $root 'Before-The-Winter-Backend'

dotnet user-secrets set 'Telegram:MiniAppUrl' $Url --project $project

# Stop whatever listens on the backend port (the app and its `dotnet run` parent).
$listener = Get-NetTCPConnection -LocalPort 5122 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listener) {
    $app = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
    $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($app.ParentProcessId)"
    if ($parent -and $parent.CommandLine -match 'dotnet.*run') { Stop-Process -Id $parent.ProcessId -Force }
    Stop-Process -Id $app.ProcessId -Force
    Start-Sleep -Seconds 2
}

Write-Host "Starting backend with $Url"
dotnet run --project $project --launch-profile http
