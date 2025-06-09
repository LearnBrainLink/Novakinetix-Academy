# PowerShell script to install Supabase CLI on Windows

Write-Host "Installing Supabase CLI..." -ForegroundColor Green

# Create temp directory
$tempDir = Join-Path $env:TEMP "supabase-install"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Download the latest release
$downloadUrl = "https://github.com/supabase/cli/releases/download/v1.142.2/supabase_windows_amd64.exe"
$outputPath = Join-Path $tempDir "supabase.exe"

Write-Host "Downloading Supabase CLI..." -ForegroundColor Yellow
try {
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $outputPath)
} catch {
    Write-Host "Failed to download Supabase CLI. Error: $_" -ForegroundColor Red
    exit 1
}

# Create Supabase directory in Program Files
$supabaseDir = "C:\Program Files\Supabase"
New-Item -ItemType Directory -Force -Path $supabaseDir | Out-Null

# Move the executable
try {
    Move-Item -Path $outputPath -Destination "$supabaseDir\supabase.exe" -Force
} catch {
    Write-Host "Failed to move Supabase CLI. Error: $_" -ForegroundColor Red
    exit 1
}

# Add to PATH if not already present
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if (-not $currentPath.Contains($supabaseDir)) {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$supabaseDir", "User")
}

Write-Host "Supabase CLI installed successfully!" -ForegroundColor Green
Write-Host "Please restart your terminal to use the 'supabase' command." -ForegroundColor Yellow 