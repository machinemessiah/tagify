# Tagify 🏷️

Tagify is a powerful [Spicetify](https://github.com/spicetify/cli) custom app that brings advanced music tagging and organization capabilities to Spotify.

[![GitHub release](https://img.shields.io/github/release/alexk218/tagify.svg)](https://github.com/alexk218/tagify/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/alexk218/tagify.svg)](https://github.com/alexk218/tagify/stargazers)

## Motivation

As a DJ and obsessive music organizer, I spent _years_ searching for a good music tagging system - with no luck. So I built what I wished existed.
After several months of development and daily use in my own workflow, I'm excited to share Tagify with fellow music lovers who want to take control of their libraries.

---

### **Track Tagging**

Rate tracks, set energy levels, and apply custom tags that actually mean something to you

![Single Track Tagging](src/assets/TAGGING_TRACK.gif)

### **Creating & Managing Tags**

Build your own tag system - from simple genres to complex mood categories.

![Tag Management](src/assets/CREATING_TAGS.gif)

### **Smart Filtering & Playlist Creation**

Create playlists using your own custom filters.

![Filtering and Playlists](src/assets/FILTERS_PLAYLIST.gif)

### **Mass Tagging Multiple Tracks**

Select and tag multiple tracks at once for efficient organization.

![Mass Track Tagging](src/assets/MULTI_TRACK_TAGGING.gif)

---

## Quick Start

### Prerequisites

You'll need **Spicetify** installed on your computer.

➡️ **[Complete Spicetify Installation Guide](SPICETIFY_INSTALLATION.md)**

## Install Tagify

### Windows - One-Click Install (Recommended)

Open **Powershell** and run this command:

```powershell
iwr -useb "https://raw.githubusercontent.com/alexk218/tagify/main/install.ps1" | iex
```

### Manual install

#### **1. Download Tagify**

- Go to the [Releases page](https://github.com/alexk218/tagify/releases)
- Download latest .zip file

#### **2. Find your Spicetify folder**

- **Option 1:** Use the Spicetify CLI

  1. Run `spicetify config-dir` to open the Spicetify folder
  2. Open the `CustomApps` folder.

- **Option 2:** Manually navigate to the folder
  - **Windows**: `Windows + R` - `%APPDATA%\spicetify\CustomApps`
  - **Mac**: `Cmd + Shift + G` - `~/.config/spicetify/CustomApps`

#### **3. Extract Tagify**

- Extact/unzip the downloaded .zip file.
- Drag `tagify` folder into `CustomApps` folder

#### **4. Activate Tagify**

- Open PowerShell (Windows) or Terminal (Mac/Linux):

  ```bash
  spicetify config custom_apps tagify
  spicetify apply
  ```

**5. Start using Tagify!**

- Restart Spotify completely
- Look for "Tagify" in your Spotify **top navigation bar** (next to the Spicetify Marketplace button)
- Click it to open Tagify!

## Roadmap

**Full Rekordbox integration**:

- Export your Tagify ratings and tag data directly to Rekordbox.
- Compare your Spotify playlists with your local Rekordbox collection.
  - Highlights playlist differences and sync opportunities.
  - Auto-downloads high-quality versions of your tagged Spotify tracks, keeping platforms synchronized.
  - Maintain folder organization and playlist hierarchy across platforms.

Have ideas? Feel free to DM me.
