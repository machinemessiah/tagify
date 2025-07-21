#!/bin/bash

set -e  # Exit on any error

# Color output functions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo -e "${MAGENTA}Tagify Auto-Installer
Transform your Spotify music organization${NC}"

HOME_DIR="$HOME"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CUSTOM_APPS_DIR="$HOME_DIR/.config/spicetify/CustomApps"
    OS_NAME="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CUSTOM_APPS_DIR="$HOME_DIR/.config/spicetify/CustomApps"
    OS_NAME="Linux"
else
    print_error "Unsupported operating system: $OSTYPE"
    echo "This script supports macOS and Linux only."
    echo "For Windows, use: iwr -useb \"https://raw.githubusercontent.com/alexk218/tagify/main/install.ps1\" | iex"
    exit 1
fi

APP_NAME="tagify"
CUSTOM_APP_DIR="$CUSTOM_APPS_DIR/$APP_NAME"
TEMP_DIR="/tmp/tagify-install"
ZIP_FILE="$TEMP_DIR/tagify.zip"

REPO_OWNER="alexk218"
REPO_NAME="tagify"

cleanup() {
    print_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR" 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

main() {
    print_info "Starting Tagify installation on $OS_NAME..."

    # Check if required commands exist
    check_dependencies

    # Check if Spicetify is installed
    check_spicetify

    # Create directories
    setup_directories

    # Get latest release info
    get_latest_release

    # Download the release
    download_release

    # Extract and install
    extract_and_install

    # Configure Spicetify
    configure_spicetify

    # Success message
    print_success_message
}

check_dependencies() {
    print_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check for required commands
    command -v curl >/dev/null 2>&1 || missing_deps+=("curl")
    command -v unzip >/dev/null 2>&1 || missing_deps+=("unzip")
    
    # Check for either jq or python for JSON parsing
    if ! command -v jq >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
        missing_deps+=("jq or python")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo ""
        echo "Please install the missing dependencies:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew install curl unzip jq"
        else
            echo "  # Ubuntu/Debian:"
            echo "  sudo apt update && sudo apt install curl unzip jq"
            echo "  # CentOS/RHEL/Fedora:"
            echo "  sudo yum install curl unzip jq"
        fi
        exit 1
    fi
    
    print_success "All dependencies found"
}

check_spicetify() {
    print_info "Checking for Spicetify installation..."
    
    if command -v spicetify >/dev/null 2>&1; then
        local spicetify_version
        spicetify_version=$(spicetify -v 2>/dev/null || echo "unknown")
        print_success "Spicetify found: $spicetify_version"
    else
        print_error "Spicetify not found! Please install Spicetify first:"
        echo "https://spicetify.app/docs/getting-started"
        exit 1
    fi
}

setup_directories() {
    print_info "Setting up directories..."
    
    # Create CustomApps directory if it doesn't exist
    if [ ! -d "$CUSTOM_APPS_DIR" ]; then
        mkdir -p "$CUSTOM_APPS_DIR"
        print_success "Created CustomApps directory"
    fi
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
}

parse_json() {
    # Try jq first, fallback to python
    if command -v jq >/dev/null 2>&1; then
        jq -r "$1"
    elif command -v python3 >/dev/null 2>&1; then
        python3 -c "import sys, json; print(json.load(sys.stdin)$1)"
    elif command -v python >/dev/null 2>&1; then
        python -c "import sys, json; print(json.load(sys.stdin)$1)"
    else
        print_error "No JSON parser available"
        exit 1
    fi
}

get_latest_release() {
    print_info "Fetching latest release information..."
    
    local api_url="https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases/latest"
    local temp_json="$TEMP_DIR/release.json"
    
    if curl -fsSL "$api_url" -o "$temp_json" 2>/dev/null; then
        # Parse release info
        RELEASE_VERSION=$(cat "$temp_json" | parse_json '.tag_name')
        
        # Find the main zip file (exclude source code)
        local download_url
        if command -v jq >/dev/null 2>&1; then
            download_url=$(cat "$temp_json" | jq -r '.assets[] | select(.name | test("tagify.*\\.zip") and (test("source") | not)) | .browser_download_url' | head -n1)
        else
            # Fallback: try to extract download URL with basic tools
            download_url=$(cat "$temp_json" | grep -o '"browser_download_url"[^,]*' | grep 'tagify.*\.zip' | grep -v source | head -n1 | cut -d'"' -f4)
        fi
        
        if [ -n "$download_url" ] && [ "$download_url" != "null" ]; then
            DOWNLOAD_URL="$download_url"
            local asset_name=$(basename "$download_url")
            print_success "Found latest release: $RELEASE_VERSION ($asset_name)"
        else
            print_warning "Could not find suitable zip file in release. Using fallback..."
            DOWNLOAD_URL="https://github.com/$REPO_OWNER/$REPO_NAME/releases/latest/download/tagify.zip"
            RELEASE_VERSION="latest"
        fi
    else
        print_warning "Could not fetch release info from GitHub API. Using fallback..."
        DOWNLOAD_URL="https://github.com/$REPO_OWNER/$REPO_NAME/releases/latest/download/tagify.zip"
        RELEASE_VERSION="latest"
    fi
}

download_release() {
    print_info "Downloading Tagify $RELEASE_VERSION..."
    
    if curl -fsSL "$DOWNLOAD_URL" -o "$ZIP_FILE"; then
        print_success "Download completed"
    else
        print_error "Failed to download Tagify. Please check your internet connection."
        print_error "Download URL: $DOWNLOAD_URL"
        exit 1
    fi
}

extract_and_install() {
    print_info "Extracting files..."
    
    # Remove existing installation
    if [ -d "$CUSTOM_APP_DIR" ]; then
        print_warning "Existing Tagify installation found. Removing for clean install..."
        rm -rf "$CUSTOM_APP_DIR"
        print_success "Removed existing installation"
    fi
    
    # Extract zip file
    local extract_dir="$TEMP_DIR/extracted"
    mkdir -p "$extract_dir"
    
    if unzip -q "$ZIP_FILE" -d "$extract_dir"; then
        # Find the extracted folder
        local source_dir
        local extracted_items=($(ls -1 "$extract_dir"))
        
        if [ ${#extracted_items[@]} -eq 1 ] && [ -d "$extract_dir/${extracted_items[0]}" ]; then
            # Single directory extracted
            source_dir="$extract_dir/${extracted_items[0]}"
        else
            # Multiple files or files directly in extract_dir
            source_dir="$extract_dir"
        fi
        
        # Move to final location
        mv "$source_dir" "$CUSTOM_APP_DIR"
        print_success "Files extracted successfully"
    else
        print_error "Failed to extract files"
        exit 1
    fi
}

configure_spicetify() {
    print_info "Configuring Spicetify..."
    
    if spicetify config custom_apps "$APP_NAME"; then
        print_success "Added Tagify to Spicetify config"
        
        print_info "Applying Spicetify changes..."
        if spicetify apply; then
            print_success "Spicetify configuration applied"
        else
            print_error "Failed to apply Spicetify configuration"
            print_warning "You may need to run this command manually:"
            echo "  spicetify apply"
            exit 1
        fi
    else
        print_error "Failed to configure Spicetify"
        print_warning "You may need to run these commands manually:"
        echo "  spicetify config custom_apps tagify"
        echo "  spicetify apply"
        exit 1
    fi
}

print_success_message() {
    echo ""
    print_success "Tagify installation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart Spotify completely"
    echo "2. Look for 'Tagify' in your Spotify sidebar"
    echo "3. Start organizing your music!"
    echo ""
    echo "Need help? Visit: https://github.com/$REPO_OWNER/$REPO_NAME"
    echo ""
}

# Run main function
main "$@"