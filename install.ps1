param(
    [string]$Version = "latest"
)

function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }

Write-Host @"
Tagify Auto-Installer
Transform your Spotify music organization
"@ -ForegroundColor Magenta

$homeDir = $env:USERPROFILE
$customAppsDir = "$homeDir\AppData\Roaming\spicetify\CustomApps"
$appName = "tagify"
$customAppDir = Join-Path $customAppsDir $appName
$tempDir = "$env:TEMP\tagify-install"
$zipFile = "$tempDir\tagify.zip"

$repoOwner = "alexk218"
$repoName = "tagify"

Write-Info "Starting Tagify installation..."

Write-Info "Checking for Spicetify installation..."
try {
    $spicetifyVersion = spicetify -v 2>$null
    if ($spicetifyVersion) {
        Write-Success "Spicetify found: $spicetifyVersion"
    }
}
catch {
    Write-Error "Spicetify not found! Please install Spicetify first:"
    Write-Host "https://spicetify.app/docs/getting-started" -ForegroundColor Yellow
    exit 1
}

Write-Info "Creating directories..."
if (!(Test-Path -Path $customAppsDir)) {
    New-Item -ItemType Directory -Path $customAppsDir -Force | Out-Null
    Write-Success "Created CustomApps directory"
}
    
if (!(Test-Path -Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

Write-Info "Fetching latest release information..."
$apiUrl = "https://api.github.com/repos/$repoOwner/$repoName/releases/latest"
    
try {
    $releaseInfo = Invoke-RestMethod -Uri $apiUrl -ErrorAction Stop
    $downloadUrl = $releaseInfo.assets[0].browser_download_url
    $releaseVersion = $releaseInfo.tag_name
    Write-Success "Found latest release: $releaseVersion"
}
catch {
    Write-Warning "Could not fetch release info from GitHub API. Using direct download..."
    $downloadUrl = "https://github.com/$repoOwner/$repoName/releases/latest/download/tagify.zip"
    $releaseVersion = "latest"
}

Write-Info "Downloading Tagify $releaseVersion..."
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -ErrorAction Stop
    Write-Success "Download completed"
}
catch {
    Write-Error "Failed to download Tagify. Please check your internet connection."
    Write-Error "Download URL: $downloadUrl"
    exit 1
}

# Remove existing installation
if (Test-Path -Path $customAppDir) {
    Write-Warning "Existing Tagify installation found. Removing for clean install..."
    Remove-Item -Recurse -Force $customAppDir
    Write-Success "Removed existing installation"
}

Write-Info "Extracting files..."
try {
    Expand-Archive -Path $zipFile -DestinationPath $tempDir -Force
        
    # Find the extracted folder (might be nested)
    $extractedFolders = Get-ChildItem $tempDir -Directory
    if ($extractedFolders.Count -eq 1) {
        $sourceDir = $extractedFolders[0].FullName
    }
    else {
        $sourceDir = $tempDir
    }
        
    Move-Item -Path $sourceDir -Destination $customAppDir -Force
    Write-Success "Files extracted successfully"
}
catch {
    Write-Error "Failed to extract files: $($_.Exception.Message)"
    exit 1
}

Write-Info "Configuring Spicetify..."
try {
    & spicetify config custom_apps $appName
    Write-Success "Added Tagify to Spicetify config"
        
    Write-Info "Applying Spicetify changes..."
    & spicetify apply
    Write-Success "Spicetify configuration applied"
}
catch {
    Write-Error "Failed to configure Spicetify: $($_.Exception.Message)"
    Write-Warning "You may need to run these commands manually:"
    Write-Host "  spicetify config custom_apps tagify" -ForegroundColor Yellow
    Write-Host "  spicetify apply" -ForegroundColor Yellow
    exit 1
}

# Clean up
Write-Info "Cleaning up temporary files..."
Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue

# Success!
Write-Host @"

🎉 Tagify installation completed successfully!

Next steps:
1. Restart Spotify completely
2. Look for 'Tagify' in your Spotify sidebar
3. Start organizing your music!

"@ -ForegroundColor Green

