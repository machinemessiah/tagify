# Tagify 🏷️


Tagify is a powerful [Spicetify](https://github.com/spicetify/cli) custom app that brings advanced music tagging and organization capabilities to Spotify. 

### Motivation
As a DJ and obsessive music organizer, I spent *years* searching for a good music tagging system - with no luck. So I built what I wished existed.
After several months of development and daily use in my own workflow, I'm excited to share Tagify with fellow music lovers who want to take control of their libraries.

---

### **Track Tagging**

_Tag any track with star rating and energy level, as well as your own custom tags._

![Single Track Tagging](src/assets/TAGGING_TRACK.gif)

### **Creating & Managing Tags**

_Customize your tag categories to match your taste._

![Tag Management](src/assets/CREATING_TAGS.gif)

### **Smart Filtering & Playlist Creation**

_Create playlists using your own custom filters._

![Filtering and Playlists](src/assets/FILTERS_PLAYLIST.gif)

### **Mass Tagging Multiple Tracks**

_Select and tag multiple tracks at once for efficient organization._

![Mass Track Tagging](src/assets/MULTI_TRACK_TAGGING.gif)

---

## Quick Start

### Prerequisites

You'll need **Spicetify** installed on your computer.

➡️ **[Complete Spicetify Installation Guide](SPICETIFY_INSTALLATION.md)**


### Install Tagify

1. **Download Tagify**

   - Go to the [Releases page](https://github.com/alexk218/tagify/releases)
   - Download latest .zip file

2. **Find your Spicetify folder**

   - **Windows**: `Windows + R` - `%APPDATA%\spicetify\CustomApps`
   - **Mac**: `Cmd + Shift + G` - `~/.config/spicetify/CustomApps`

3. **Extract Tagify**

   - Extact/unzip .zip file.
   - Drag `tagify` folder into `CustomApps` folder

4. **Activate Tagify**

   - Open PowerShell (Windows) or Terminal (Mac/Linux):
     ```bash
     spicetify config custom_apps tagify
     spicetify apply
     ```

5. **Start using Tagify!**
   - Restart Spotify completely
   - Look for "Tagify" in your Spotify sidebar!

# Future features
**Full Rekordbox integration**: 
- Export your Tagify ratings and tag data directly to Rekordbox.
- Compare your Spotify playlists with your local Rekordbox collection.
   - Highlights playlist differences and sync opportunities.
   - Auto-downloads high-quality versions of your tagged Spotify tracks, keeping platforms synchronized.
   - Maintain folder organization and playlist hierarchy across platforms.

Have ideas? Feel free to DM me.