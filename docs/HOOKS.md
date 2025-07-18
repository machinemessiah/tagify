# Hooks Directory

Custom React hooks that encapsulate the core business logic and state management for Tagify.

## Hook Overview

| Hook                  | Purpose              | Key State                              | When to Use              |
| --------------------- | -------------------- | -------------------------------------- | ------------------------ |
| `useSpicetifyHistory` | URL → Track Bridge   | URL parameters → Track loading         | Automatic (App.tsx)      |
| `useTrackState`       | Track State Manager  | currentTrack, lockedTrack, activeTrack | Central track management |
| `useTagData`          | Tag Data Manager     | tagData, categories, track tags        | Tag operations           |
| `useFilterState`      | Filter State Manager | activeFilters, excludedFilters         | Track filtering          |
| `usePlaylistState`    | Playlist Operations  | playlistInfo, localTracks              | Playlist creation        |

## State Flow Architecture

```
useSpicetifyHistory (URL params)
        ↓
useTrackState (track management)
        ↓
useTagData (tag operations)
        ↓
UI Components (TrackDetails, etc.)
```

## Hook Dependencies

- **useSpicetifyHistory** depends on: URL parameters, Spicetify Platform API
- **useTrackState** depends on: Spicetify Player API, localStorage
- **useTagData** depends on: localStorage, track URIs
- **useFilterState** depends on: tag data structure
- **usePlaylistState** depends on: Spicetify Cosmos API

## File Descriptions

### useSpicetifyHistory.ts

**Purpose**: URL parameter processor and route-based track loader  
**Key Function**: Bridges external navigation to internal app state  
**Main Use Case**: When user clicks "Tag with Tagify" from context menu

### useTrackState.ts

**Purpose**: Central state manager for all track-related data  
**Key Function**: Manages current/locked/active track state  
**Main Use Case**: Provides track data to all UI components

### useTagData.ts

**Purpose**: Tag data operations and persistence  
**Key Function**: CRUD operations for tags, categories, ratings  
**Main Use Case**: All tagging operations throughout the app

### useFilterState.ts

**Purpose**: Track filtering and search functionality  
**Key Function**: Manages active/excluded tag filters  
**Main Use Case**: TrackList filtering and search

### usePlaylistState.ts

**Purpose**: Playlist creation and local track management  
**Key Function**: Creates Spotify playlists from filtered tracks  
**Main Use Case**: "Create Playlist" feature
