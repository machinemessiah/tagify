import { useState, useEffect } from "react";
import { TrackInfoCacheManager } from "../utils/TrackInfoCache";

export interface Tag {
  name: string;
  id: string;
}

export interface TagSubcategory {
  name: string;
  id: string;
  tags: Tag[];
}

export interface TagCategory {
  name: string;
  id: string;
  subcategories: TagSubcategory[];
}

export interface TrackTag {
  tagId: string;
  subcategoryId: string;
  categoryId: string;
}

export interface TrackData {
  rating: number;
  energy: number;
  bpm: number | null;
  tags: TrackTag[];
  dateCreated?: number;
  dateModified?: number;
}

export interface TagDataStructure {
  categories: TagCategory[];
  tracks: {
    [trackUri: string]: TrackData;
  };
}

export interface BatchTagChanges {
  additions: Array<{
    trackUri: string;
    categoryId: string;
    subcategoryId: string;
    tagId: string;
  }>;
  removals: Array<{
    trackUri: string;
    categoryId: string;
    subcategoryId: string;
    tagId: string;
  }>;
}

interface BatchTagUpdate {
  trackUri: string;
  toAdd: TrackTag[];
  toRemove: TrackTag[];
}

interface TagAnalytics {
  id: string;
  name: string;
  order: number;
  usage_count: number;
  is_used: boolean;
  full_path: string;
}

interface SubcategoryAnalytics {
  id: string;
  name: string;
  order: number;
  total_tags: number;
  used_tags: number;
  unused_tags: number;
  tags: TagAnalytics[];
}

interface CategoryAnalytics {
  id: string;
  name: string;
  order: number;
  total_subcategories: number;
  total_tags: number;
  used_tags: number;
  unused_tags: number;
  subcategories: SubcategoryAnalytics[];
}

interface TagUsageSummary {
  most_used_tags: Array<{
    name: string;
    usage_count: number;
  }>;
  unused_tag_names: string[];
  usage_percentage: number;
}

interface ExportedTrackTag {
  categoryId: string;
  subcategoryId: string;
  tagId: string;
  name: string;
}

interface ExportedTrackData {
  rating: number;
  energy: number;
  bpm: number | null;
  tags: ExportedTrackTag[];
  rekordbox_comment: string;
}

interface TagAnalyticsData {
  total_categories: number;
  total_subcategories: number;
  total_tags: number;
  used_tags: number;
  unused_tags: number;
  categories: CategoryAnalytics[];
  tag_usage_summary: TagUsageSummary;
}

interface ExportDataResult {
  version: string;
  exported_at: string;
  tracks: {
    [trackUri: string]: ExportedTrackData;
  };
  tag_analytics: TagAnalyticsData;
}

export interface SmartPlaylistCriteria {
  playlistId: string;
  playlistName: string;
  criteria: {
    activeTagFilters: { categoryId: string; subcategoryId: string; tagId: string }[];
    excludedTagFilters: { categoryId: string; subcategoryId: string; tagId: string }[];
    ratingFilters: number[];
    energyMinFilter: number | null;
    energyMaxFilter: number | null;
    bpmMinFilter: number | null;
    bpmMaxFilter: number | null;
    isOrFilterMode: boolean;
  };
  isActive: boolean; // to disable sync for this playlist
  createdAt: number;
  lastSyncAt: number;
  smartPlaylistTrackUris: string[];
}

// Default tag structure with 4 main categories
const defaultTagData: TagDataStructure = {
  categories: [
    {
      name: "Genre & Style",
      id: "genre-style",
      subcategories: [
        {
          name: "Primary Genres",
          id: "primary-genres",
          tags: [
            { name: "Rock", id: "rock" },
            { name: "Pop", id: "pop" },
            { name: "Hip-Hop", id: "hip-hop" },
            { name: "Electronic", id: "electronic" },
            { name: "Jazz", id: "jazz" },
            { name: "Classical", id: "classical" },
            { name: "Country", id: "country" },
            { name: "R&B", id: "rnb" },
          ],
        },
        {
          name: "Sub-genres",
          id: "sub-genres",
          tags: [
            { name: "Alternative", id: "alternative" },
            { name: "Indie", id: "indie" },
            { name: "Folk", id: "folk" },
            { name: "Funk", id: "funk" },
            { name: "Blues", id: "blues" },
            { name: "Reggae", id: "reggae" },
          ],
        },
        {
          name: "Era & Decade",
          id: "era-decade",
          tags: [
            { name: "Vintage", id: "vintage" },
            { name: "80s", id: "80s" },
            { name: "90s", id: "90s" },
            { name: "2000s", id: "2000s" },
            { name: "Modern", id: "modern" },
          ],
        },
      ],
    },
    {
      name: "Mood & Energy",
      id: "mood-energy",
      subcategories: [
        {
          name: "Energy Level",
          id: "energy-level",
          tags: [
            { name: "High Energy", id: "high-energy" },
            { name: "Upbeat", id: "upbeat" },
            { name: "Moderate", id: "moderate" },
            { name: "Chill", id: "chill" },
            { name: "Mellow", id: "mellow" },
            { name: "Slow", id: "slow" },
          ],
        },
        {
          name: "Emotional Tone",
          id: "emotional-tone",
          tags: [
            { name: "Happy", id: "happy" },
            { name: "Sad", id: "sad" },
            { name: "Angry", id: "angry" },
            { name: "Romantic", id: "romantic" },
            { name: "Nostalgic", id: "nostalgic" },
            { name: "Peaceful", id: "peaceful" },
            { name: "Dramatic", id: "dramatic" },
          ],
        },
        {
          name: "Atmosphere",
          id: "atmosphere",
          tags: [
            { name: "Dark", id: "dark" },
            { name: "Bright", id: "bright" },
            { name: "Dreamy", id: "dreamy" },
            { name: "Intense", id: "intense" },
            { name: "Mysterious", id: "mysterious" },
            { name: "Playful", id: "playful" },
          ],
        },
      ],
    },
    {
      name: "Musical Elements",
      id: "musical-elements",
      subcategories: [
        {
          name: "Vocals",
          id: "vocals",
          tags: [
            { name: "Male Vocals", id: "male-vocals" },
            { name: "Female Vocals", id: "female-vocals" },
            { name: "Duet", id: "duet" },
            { name: "Choir", id: "choir" },
            { name: "Instrumental", id: "instrumental" },
            { name: "Rap", id: "rap" },
          ],
        },
        {
          name: "Instruments",
          id: "instruments",
          tags: [
            { name: "Guitar", id: "guitar" },
            { name: "Piano", id: "piano" },
            { name: "Strings", id: "strings" },
            { name: "Brass", id: "brass" },
            { name: "Drums", id: "drums" },
            { name: "Synth", id: "synth" },
            { name: "Bass", id: "bass" },
          ],
        },
        {
          name: "Production Style",
          id: "production-style",
          tags: [
            { name: "Acoustic", id: "acoustic" },
            { name: "Electric", id: "electric" },
            { name: "Live Recording", id: "live-recording" },
            { name: "Studio", id: "studio" },
            { name: "Lo-fi", id: "lo-fi" },
            { name: "Polished", id: "polished" },
          ],
        },
      ],
    },
    {
      name: "Usage & Context",
      id: "usage-context",
      subcategories: [
        {
          name: "Activity",
          id: "activity",
          tags: [
            { name: "Workout", id: "workout" },
            { name: "Study", id: "study" },
            { name: "Party", id: "party" },
            { name: "Relaxation", id: "relaxation" },
            { name: "Driving", id: "driving" },
            { name: "Sleep", id: "sleep" },
          ],
        },
        {
          name: "Time & Season",
          id: "time-season",
          tags: [
            { name: "Morning", id: "morning" },
            { name: "Evening", id: "evening" },
            { name: "Summer", id: "summer" },
            { name: "Winter", id: "winter" },
            { name: "Holiday", id: "holiday" },
          ],
        },
        {
          name: "Social Context",
          id: "social-context",
          tags: [
            { name: "Solo Listening", id: "solo-listening" },
            { name: "Background Music", id: "background-music" },
            { name: "Dancing", id: "dancing" },
            { name: "Singing Along", id: "singing-along" },
            { name: "Focus Music", id: "focus-music" },
          ],
        },
      ],
    },
  ],
  tracks: {},
};

const STORAGE_KEY = "tagify:tagData";
const SMART_PLAYLIST_KEY = "tagify:smartPlaylists";

export function useTagData() {
  const [tagData, setTagData] = useState<TagDataStructure>(defaultTagData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylistCriteria[]>([]);

  // Load smart playlists on mount
  useEffect(() => {
    try {
      const savedSmartPlaylists = localStorage.getItem(SMART_PLAYLIST_KEY);
      if (savedSmartPlaylists) {
        const parsed = JSON.parse(savedSmartPlaylists);
        setSmartPlaylists(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error("Error loading smart playlists:", error);
    }
  }, []);

  // Save smart playlists whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SMART_PLAYLIST_KEY, JSON.stringify(smartPlaylists));
    } catch (error) {
      console.error("Error saving smart playlist data:", error);
    }
  }, [smartPlaylists]);

  const storeSmartPlaylist = (criteria: SmartPlaylistCriteria) => {
    setSmartPlaylists((prev) => {
      const newPlaylists = [...prev, criteria];

      // immediate localStorage save as backup
      try {
        localStorage.setItem(SMART_PLAYLIST_KEY, JSON.stringify(newPlaylists));
      } catch (error) {
        console.error("Error saving smart playlist data:", error);
      }

      return newPlaylists;
    });
  };

  const evaluateTrackMatchesCriteria = (
    trackData: TrackData,
    criteria: SmartPlaylistCriteria["criteria"]
  ): boolean => {
    // Tag filters - include logic
    const matchesIncludeTags =
      criteria.activeTagFilters.length === 0 ||
      (criteria.isOrFilterMode
        ? // OR logic - track must have ANY of the selected tags
          criteria.activeTagFilters.some((filterTag) =>
            trackData.tags.some(
              (trackTag) =>
                trackTag.categoryId === filterTag.categoryId &&
                trackTag.subcategoryId === filterTag.subcategoryId &&
                trackTag.tagId === filterTag.tagId
            )
          )
        : // AND logic - track must have ALL of the selected tags
          criteria.activeTagFilters.every((filterTag) =>
            trackData.tags.some(
              (trackTag) =>
                trackTag.categoryId === filterTag.categoryId &&
                trackTag.subcategoryId === filterTag.subcategoryId &&
                trackTag.tagId === filterTag.tagId
            )
          ));

    // Exclude tags - track must NOT have ANY of these tags
    const matchesExcludeTags =
      criteria.excludedTagFilters.length === 0 ||
      !criteria.excludedTagFilters.some((filterTag) =>
        trackData.tags.some(
          (trackTag) =>
            trackTag.categoryId === filterTag.categoryId &&
            trackTag.subcategoryId === filterTag.subcategoryId &&
            trackTag.tagId === filterTag.tagId
        )
      );

    // Rating filter
    const matchesRating =
      criteria.ratingFilters.length === 0 ||
      (trackData.rating > 0 && criteria.ratingFilters.includes(trackData.rating));

    // Energy range filter
    const matchesEnergyMin =
      criteria.energyMinFilter === null || trackData.energy >= criteria.energyMinFilter;
    const matchesEnergyMax =
      criteria.energyMaxFilter === null || trackData.energy <= criteria.energyMaxFilter;

    // BPM range filter
    const matchesBpmMin =
      criteria.bpmMinFilter === null ||
      (trackData.bpm !== null && trackData.bpm >= criteria.bpmMinFilter);
    const matchesBpmMax =
      criteria.bpmMaxFilter === null ||
      (trackData.bpm !== null && trackData.bpm <= criteria.bpmMaxFilter);

    return (
      matchesIncludeTags &&
      matchesExcludeTags &&
      matchesRating &&
      matchesEnergyMin &&
      matchesEnergyMax &&
      matchesBpmMin &&
      matchesBpmMax
    );
  };

  const isTrackInPlaylist = async (trackUri: string, playlistId: string): Promise<boolean> => {
    try {
      let offset = 0;
      const limit = 100;

      while (true) {
        const response = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(uri)),total`
        );

        if (!response || !response.items) {
          break;
        }

        // Check if our track is in this batch
        const found = response.items.some((item: any) => item.track?.uri === trackUri);
        if (found) {
          return true;
        }

        if (response.items.length < limit || offset + limit >= response.total) {
          break;
        }

        offset += limit;
      }

      return false;
    } catch (error) {
      console.error("❌ Error checking if track is in playlist:", error);
      // On error, assume track is not in playlist to allow the add attempt
      return false;
    }
  };

  const addTrackToSpotifyPlaylist = async (
    trackUri: string,
    playlistId: string
  ): Promise<{ success: boolean; wasAdded: boolean }> => {
    try {
      if (trackUri.startsWith("spotify:local:")) {
        return { success: true, wasAdded: false };
      }

      const isAlreadyInPlaylist = await isTrackInPlaylist(trackUri, playlistId);

      if (isAlreadyInPlaylist) {
        return { success: true, wasAdded: false };
      }

      await Spicetify.CosmosAsync.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          uris: [trackUri],
        }
      );

      return { success: true, wasAdded: true };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return { success: false, wasAdded: false };
    }
  };

  const removeTrackFromSpotifyPlaylist = async (
    trackUri: string,
    playlistId: string
  ): Promise<boolean> => {
    try {
      await Spicetify.CosmosAsync.del(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        tracks: [{ uri: trackUri }],
      });

      // Delay to let Spotify's cache sync
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error("❌ Error removing track:", error);
      return false;
    }
  };

  const cleanupDeletedSmartPlaylists = async (): Promise<void> => {
    try {
      const allApiPlaylistIds: string[] = [];
      let offset = 0;
      const limit = 50;
      while (true) {
        const response = await Spicetify.CosmosAsync.get(
          `https://api.spotify.com/v1/me/playlists?offset=${offset}&limit=${limit}&fields=items(id),total`
        );

        if (!response?.items?.length) break;

        const batchIds = response.items.map((p: { id: string }) => p.id);
        allApiPlaylistIds.push(...batchIds);

        if (response.items.length < limit || offset + limit >= response.total) {
          break;
        }

        offset += limit;
      }

      const validPlaylists: SmartPlaylistCriteria[] = smartPlaylists.filter(
        (sp: SmartPlaylistCriteria) => allApiPlaylistIds.includes(sp.playlistId)
      );

      if (validPlaylists.length !== smartPlaylists.length) {
        setSmartPlaylists(validPlaylists);
        Spicetify.showNotification(
          `Cleaned up ${smartPlaylists.length - validPlaylists.length} deleted smart playlist(s)`,
          false,
          3000
        );
      }
    } catch (error) {
      console.error(`Problem fetching or processing playlists:`, error);
    }
  };

  const syncTrackWithSmartPlaylists = async (
    trackUri: string,
    trackData: TrackData | null
  ): Promise<void> => {
    if (!trackData) {
      // Handle case where track was deleted - remove from all smart playlists
      const updatedPlaylists = [...smartPlaylists];
      let hasChanges = false;

      for (let i = 0; i < updatedPlaylists.length; i++) {
        const smartPlaylist = updatedPlaylists[i];
        if (smartPlaylist.smartPlaylistTrackUris.includes(trackUri)) {
          const success = await removeTrackFromSpotifyPlaylist(trackUri, smartPlaylist.playlistId);
          if (success) {
            updatedPlaylists[i] = {
              ...smartPlaylist,
              smartPlaylistTrackUris: smartPlaylist.smartPlaylistTrackUris.filter(
                (uri) => uri !== trackUri
              ),
              lastSyncAt: Date.now(),
            };
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setSmartPlaylists(updatedPlaylists);
      }
      return;
    }

    const updatedPlaylists = [...smartPlaylists];
    let hasChanges = false;

    for (let i = 0; i < updatedPlaylists.length; i++) {
      const smartPlaylist = updatedPlaylists[i];

      if (!smartPlaylist.isActive) {
        console.log("⏸️ Skipping inactive playlist:", smartPlaylist.playlistName);
        continue;
      }

      const matches = evaluateTrackMatchesCriteria(trackData, smartPlaylist.criteria);
      const isCurrentlyTracked = smartPlaylist.smartPlaylistTrackUris.includes(trackUri);

      console.log(
        `🎯 Track ${matches ? "matches" : "doesn't match"} playlist "${
          smartPlaylist.playlistName
        }" | Currently tracked: ${isCurrentlyTracked}`
      );

      if (matches && !isCurrentlyTracked) {
        // ADD TRACK
        const result = await addTrackToSpotifyPlaylist(trackUri, smartPlaylist.playlistId);
        if (result.success) {
          console.log(`✅ Successfully added ${trackUri} to ${smartPlaylist.playlistName}`);
          updatedPlaylists[i] = {
            ...smartPlaylist,
            smartPlaylistTrackUris: [...smartPlaylist.smartPlaylistTrackUris, trackUri],
            lastSyncAt: Date.now(),
          };
          hasChanges = true;

          if (trackUri.startsWith("spotify:local:")) {
            Spicetify.showNotification(
              `🎵 Local file matches "${smartPlaylist.playlistName}" criteria but must be added manually`,
              true,
              5000
            );
          } else if (result.wasAdded) {
            Spicetify.showNotification(
              `✅ Added track to smart playlist "${smartPlaylist.playlistName}"`,
              false,
              5000
            );
          }
        } else {
          console.error(`❌ Failed to add ${trackUri} to ${smartPlaylist.playlistName}`);
        }
      } else if (!matches && isCurrentlyTracked) {
        // REMOVE TRACK
        const success = await removeTrackFromSpotifyPlaylist(trackUri, smartPlaylist.playlistId);

        if (success) {
          console.log(`✅ Successfully removed ${trackUri} from ${smartPlaylist.playlistName}`);
          updatedPlaylists[i] = {
            ...smartPlaylist,
            smartPlaylistTrackUris: smartPlaylist.smartPlaylistTrackUris.filter(
              (uri) => uri !== trackUri
            ),
            lastSyncAt: Date.now(),
          };
          hasChanges = true;

          Spicetify.showNotification(
            `❌ Track removed from smart playlist "${smartPlaylist.playlistName}"`,
            false,
            5000
          );
        } else {
          console.error(
            `Failed to remove ${trackUri} from ${smartPlaylist.playlistName} - keeping in local tracking`
          );
          // DON'T update local tracking if API call failed
        }
      }
    }

    if (hasChanges) {
      setSmartPlaylists(updatedPlaylists);
    }
  };

  const syncSmartPlaylistFull = async (playlist: SmartPlaylistCriteria): Promise<void> => {
    await cleanupDeletedSmartPlaylists();
    if (!playlist.isActive) {
      console.log("⏸️ Skipping sync for inactive playlist:", playlist.playlistName);
      return;
    }

    const matchingTrackUris: string[] = [];

    Object.entries(tagData.tracks).forEach(([trackUri, trackData]) => {
      const matches: boolean = evaluateTrackMatchesCriteria(trackData, playlist.criteria);
      if (matches) {
        matchingTrackUris.push(trackUri);
      }
    });
    console.log(`MATCHING TRACK URIS: ${matchingTrackUris}`);

    const tracksToAdd = matchingTrackUris.filter(
      (uri) => !playlist.smartPlaylistTrackUris.includes(uri)
    );
    console.log(`TRACKSTOADD: ${tracksToAdd}`);


    const tracksToRemove = playlist.smartPlaylistTrackUris.filter(
      (uri) => !matchingTrackUris.includes(uri)
    );
    console.log(`TRACKSTOREMOVE: ${tracksToRemove}`);


    let hasChanges = false;
    let addedCount = 0;
    let removedCount = 0;

    for (const trackUri of tracksToRemove) {
      const success = await removeTrackFromSpotifyPlaylist(trackUri, playlist.playlistId);
      if (success) {
        removedCount++;
        hasChanges = true;
      }
    }

    for (const trackUri of tracksToAdd) {
      const result = await addTrackToSpotifyPlaylist(trackUri, playlist.playlistId);
      if (result.success && result.wasAdded) {
        addedCount++;
        hasChanges = true;
      }
    }

    // Update the smart playlist tracking
    if (hasChanges) {
      const updatedPlaylists = smartPlaylists.map((p) => {
        if (p.playlistId === playlist.playlistId) {
          return {
            ...playlist,
            smartPlaylistTrackUris: matchingTrackUris,
            lastSyncAt: Date.now(),
          };
        }
        return p;
      });

      setSmartPlaylists(updatedPlaylists);

      if (addedCount > 0 || removedCount > 0) {
        Spicetify.showNotification(
          `✅ Synced "${playlist.playlistName}": +${addedCount} tracks, -${removedCount} tracks`,
          false,
          10000
        );
      } else {
        Spicetify.showNotification(`✅ "${playlist.playlistName}" is already in sync`, false, 5000);
      }
    }

    console.log(`🏁 Full sync completed for playlist: ${playlist.playlistName}`);
  };

  const saveToLocalStorage = (data: TagDataStructure) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Dispatch a custom event to notify extensions
      const event = new CustomEvent("tagify:dataUpdated", {
        detail: { type: "save" },
      });
      window.dispatchEvent(event);
      return true;
    } catch (error) {
      console.error("Tagify: Error saving to localStorage", error);
      return false;
    }
  };

  const loadFromLocalStorage = (): TagDataStructure | null => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Tagify: Error loading from localStorage", error);
    }
    return null;
  };

  const loadTagData = () => {
    setIsLoading(true);

    // Try loading from localStorage
    const localData = loadFromLocalStorage();
    if (localData && localData.categories && Array.isArray(localData.categories)) {
      setTagData(localData);
      setLastSaved(new Date());
    } else {
      // If no data in localStorage or data is invalid, use default
      setTagData(defaultTagData);
      // Save the default data to localStorage to prevent future issues
      saveToLocalStorage(defaultTagData);
    }

    setIsLoading(false);
  };

  const saveTagData = (data: TagDataStructure) => {
    const saved = saveToLocalStorage(data);
    if (saved) {
      setLastSaved(new Date());
    }
    return saved;
  };

  const exportBackup = () => {
    const jsonData = JSON.stringify(tagData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tagify-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    Spicetify.showNotification("Backup saved in 'Downloads' folder");
  };

  const importBackup = (backupData: TagDataStructure) => {
    setTagData(backupData);
    saveTagData(backupData);
  };

  // Load tag data on component mount
  useEffect(() => {
    loadTagData();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (!isLoading) {
      saveTagData(tagData);
    }
  }, [tagData]);

  // ! CATEGORY MANAGEMENT

  const replaceCategories = (newCategories: TagCategory[]) => {
    // Clean up orphaned tags in tracks
    const updatedTracks = { ...tagData.tracks };

    Object.keys(updatedTracks).forEach((uri) => {
      const trackTags = updatedTracks[uri].tags;
      const validTags = trackTags.filter((tag) => {
        const category = newCategories.find((c) => c.id === tag.categoryId);
        if (!category) return false;

        const subcategory = category.subcategories.find((s) => s.id === tag.subcategoryId);
        if (!subcategory) return false;

        const tagExists = subcategory.tags.find((t) => t.id === tag.tagId);
        return !!tagExists;
      });

      updatedTracks[uri] = {
        ...updatedTracks[uri],
        tags: validTags,
      };

      // Remove track if it becomes empty after tag cleanup
      if (isTrackEmpty(updatedTracks[uri])) {
        TrackInfoCacheManager.removeTrackInfo(uri);
      }
    });

    setTagData({
      categories: newCategories,
      tracks: updatedTracks,
    });
  };

  // ! TRACK TAG MANAGEMENT

  const applyBatchTagUpdates = (updates: BatchTagUpdate[]) => {
    const now = Date.now();
    const finalTrackDataMap: Record<string, TrackData | null> = {};

    setTagData((currentData) => {
      // Create a deep copy of the current state
      const newData = {
        ...currentData,
        tracks: { ...currentData.tracks },
      };

      // Apply all updates
      updates.forEach(({ trackUri, toAdd, toRemove }) => {
        // Ensure track exists
        if (!newData.tracks[trackUri]) {
          newData.tracks[trackUri] = {
            rating: 0,
            energy: 0,
            bpm: null,
            tags: [],
            dateCreated: now,
            dateModified: now,
          };
        }

        // Get current tags
        let trackTags = [...(newData.tracks[trackUri].tags || [])];

        // Remove tags
        toRemove.forEach((tagToRemove) => {
          trackTags = trackTags.filter(
            (tag) =>
              !(
                tag.categoryId === tagToRemove.categoryId &&
                tag.subcategoryId === tagToRemove.subcategoryId &&
                tag.tagId === tagToRemove.tagId
              )
          );
        });

        // Add tags
        toAdd.forEach((tagToAdd) => {
          // Check if tag already exists (shouldn't happen, but be safe)
          const exists = trackTags.some(
            (tag) =>
              tag.categoryId === tagToAdd.categoryId &&
              tag.subcategoryId === tagToAdd.subcategoryId &&
              tag.tagId === tagToAdd.tagId
          );

          if (!exists) {
            trackTags.push(tagToAdd);
          }
        });

        // Update the track
        const updatedTrackData = {
          ...newData.tracks[trackUri],
          tags: trackTags,
          dateModified: now,
          dateCreated: newData.tracks[trackUri].dateCreated || now,
        };

        newData.tracks[trackUri] = updatedTrackData;

        // Check if track should be removed (empty)
        if (isTrackEmpty(updatedTrackData)) {
          TrackInfoCacheManager.removeTrackInfo(trackUri);
          delete newData.tracks[trackUri];
          finalTrackDataMap[trackUri] = null;
        } else {
          finalTrackDataMap[trackUri] = updatedTrackData;
        }
      });

      return newData;
    });

    // Trigger the data updated event once for all changes
    const event = new CustomEvent("tagify:dataUpdated", {
      detail: { type: "batchUpdate" },
    });
    window.dispatchEvent(event);

    // Sync all affected tracks after batch update is complete
    setTimeout(() => {
      console.log("🔄 Syncing batch updated tracks:", Object.keys(finalTrackDataMap));

      Object.entries(finalTrackDataMap).forEach(([trackUri, trackData]) => {
        syncTrackWithSmartPlaylists(trackUri, trackData);
      });
    }, 100);
  };

  // Ensure track data exists for a given URI
  const getOrCreateTrackData = (trackUri: string) => {
    if (!tagData.tracks[trackUri]) {
      const now = Date.now();
      const newTagData = {
        ...tagData,
        tracks: {
          ...tagData.tracks,
          [trackUri]: {
            rating: 0,
            energy: 0,
            bpm: null,
            tags: [],
            dateCreated: now,
            dateModified: now,
          },
        },
      };
      setTagData(newTagData);
      return newTagData;
    }
    return tagData;
  };

  const updateTrackWithTimestamp = (trackUri: string, updates: Partial<TrackData>) => {
    const currentData = getOrCreateTrackData(trackUri);
    const existingTrack = currentData.tracks[trackUri];

    const updatedTrack = {
      ...existingTrack,
      ...updates,
      dateModified: Date.now(),
      dateCreated: existingTrack.dateCreated || Date.now(),
    };

    setTagData({
      ...currentData,
      tracks: {
        ...currentData.tracks,
        [trackUri]: updatedTrack,
      },
    });
  };

  const fetchBpm = async (trackUri: string): Promise<number | null> => {
    try {
      // Skip local files
      if (trackUri.startsWith("spotify:local:")) {
        return null;
      }

      // Extract track ID
      const trackId = trackUri.split(":").pop();
      if (!trackId) return null;

      // Fetch audio features from Spotify API
      const audioFeatures = await Spicetify.CosmosAsync.get(
        `https://api.spotify.com/v1/audio-features/${trackId}`
      );

      // Return rounded BPM value
      if (audioFeatures && audioFeatures.tempo) {
        return Math.round(audioFeatures.tempo);
      }
      return null;
    } catch (error) {
      console.error("Error fetching BPM:", error);
      return null;
    }
  };

  const updateBpm = async (trackUri: string): Promise<number | null> => {
    try {
      const bpm = await fetchBpm(trackUri);
      if (bpm !== null) {
        setBpm(trackUri, bpm);
      }
      return bpm;
    } catch (error) {
      console.error("Error updating BPM:", error);
      return null;
    }
  };

  const setBpm = (trackUri: string, bpm: number | null) => {
    // If this is an empty track, don't do anything
    // we don't want to save BPMs for tracks that aren't in our tagged list
    if (!tagData.tracks[trackUri]) {
      Spicetify.showNotification("Try tagging the track first!", true);
      return;
    }
    // Ensure track data exists
    const currentData = getOrCreateTrackData(trackUri);
    const trackData = currentData.tracks[trackUri];

    let finalTrackData: TrackData | null = null;

    // Check if this would make the track empty
    if (
      bpm === null &&
      trackData.rating === 0 &&
      trackData.energy === 0 &&
      trackData.tags.length === 0
    ) {
      TrackInfoCacheManager.removeTrackInfo(trackUri);

      // Create new state by removing this track
      const { [trackUri]: _, ...remainingTracks } = currentData.tracks;

      setTagData({
        ...currentData,
        tracks: remainingTracks,
      });
      finalTrackData = null;
    } else {
      // Update state with modified track and timestamps
      const now = Date.now();
      const updatedTrackData = {
        ...trackData,
        bpm,
        dateCreated: trackData.dateCreated || now,
        dateModified: now,
      };
      setTagData({
        ...currentData,
        tracks: {
          ...currentData.tracks,
          [trackUri]: updatedTrackData,
        },
      });
      finalTrackData = updatedTrackData;
    }
    setTimeout(() => syncTrackWithSmartPlaylists(trackUri, finalTrackData), 100);
  };

  const findCommonTags = (trackUris: string[]): TrackTag[] => {
    if (trackUris.length === 0) return [];

    // Get tags from the first track
    const firstTrackTags = tagData.tracks[trackUris[0]]?.tags || [];

    if (trackUris.length === 1) return firstTrackTags;

    // Check which tags exist in all tracks
    return firstTrackTags.filter((tag) => {
      return trackUris.every((uri) => {
        const trackTags = tagData.tracks[uri]?.tags || [];
        return trackTags.some(
          (t) =>
            t.categoryId === tag.categoryId &&
            t.subcategoryId === tag.subcategoryId &&
            t.tagId === tag.tagId
        );
      });
    });
  };

  const isTrackEmpty = (trackData: TrackData): boolean => {
    return (
      trackData.rating === 0 &&
      trackData.energy === 0 &&
      trackData.bpm === null &&
      trackData.tags.length === 0
    );
  };

  const toggleTagForTrack = (
    trackUri: string,
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => {
    // Ensure track data exists
    const currentData = getOrCreateTrackData(trackUri);
    const trackData = currentData.tracks[trackUri];

    // Find if tag already exists
    const existingTagIndex = trackData.tags.findIndex(
      (t) => t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
    );

    let updatedTags;
    if (existingTagIndex >= 0) {
      // Remove tag if it exists
      updatedTags = [
        ...trackData.tags.slice(0, existingTagIndex),
        ...trackData.tags.slice(existingTagIndex + 1),
      ];
    } else {
      // Add tag if it doesn't exist
      updatedTags = [...trackData.tags, { categoryId, subcategoryId, tagId }];

      // Schedule adding to TAGGED playlist if this makes the track non-empty
      if (updatedTags.length === 1 && trackData.rating === 0 && trackData.energy === 0) {
        fetchBpm(trackUri)
          .then((bpm) => {
            if (bpm !== null) {
              setTagData((prevState) => {
                const currentTrackData = prevState.tracks[trackUri];
                if (!currentTrackData) return prevState;

                const now = Date.now();
                return {
                  ...prevState,
                  tracks: {
                    ...prevState.tracks,
                    [trackUri]: {
                      ...currentTrackData,
                      bpm: bpm,
                      dateCreated: currentTrackData.dateCreated || now,
                      dateModified: now,
                    },
                  },
                };
              });
            }
          })
          .catch((error) => {
            console.error("Error fetching BPM:", error);
          });
      }
    }

    // Prepare updated track data
    const now = Date.now();
    const updatedTrackData = {
      ...trackData,
      tags: updatedTags,
      dateCreated: trackData.dateCreated || now,
      dateModified: now,
    };

    let finalTrackData: TrackData | null = null;

    // Check if the track is now empty
    if (isTrackEmpty(updatedTrackData)) {
      TrackInfoCacheManager.removeTrackInfo(trackUri);

      // Create new state by removing this track
      const { [trackUri]: _, ...remainingTracks } = currentData.tracks;

      setTagData({
        ...currentData,
        tracks: remainingTracks,
      });
      finalTrackData = null;
      console.log("TRACK EMPTY");
    } else {
      // Update state with modified track
      setTagData({
        ...currentData,
        tracks: {
          ...currentData.tracks,
          [trackUri]: updatedTrackData,
        },
      });
      finalTrackData = updatedTrackData;
      console.log(`FINAL TRACK DATA: ${finalTrackData}`);
    }
    setTimeout(() => syncTrackWithSmartPlaylists(trackUri, finalTrackData), 100);
  };

  const toggleTagForMultipleTracks = (
    trackUris: string[],
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => {
    // Create a copy of the current tagData
    const updatedTagData = { ...tagData };
    const now = Date.now();

    // Check if all tracks have this tag
    const allHaveTag = trackUris.every((uri) => {
      const trackTags = updatedTagData.tracks[uri]?.tags || [];
      return trackTags.some(
        (t) => t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
      );
    });

    // Process each track
    trackUris.forEach((uri) => {
      // Ensure track data exists
      if (!updatedTagData.tracks[uri]) {
        updatedTagData.tracks[uri] = {
          rating: 0,
          energy: 0,
          bpm: null,
          tags: [],
          dateCreated: now,
          dateModified: now,
        };
      }

      const trackData = updatedTagData.tracks[uri];
      const hasTag = trackData.tags.some(
        (t) => t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
      );

      if (allHaveTag) {
        // Remove tag if all have it
        if (hasTag) {
          const existingTagIndex = trackData.tags.findIndex(
            (t) =>
              t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
          );

          updatedTagData.tracks[uri] = {
            ...trackData,
            tags: [
              ...trackData.tags.slice(0, existingTagIndex),
              ...trackData.tags.slice(existingTagIndex + 1),
            ],
            dateCreated: trackData.dateCreated || now,
            dateModified: now,
          };

          if (
            updatedTagData.tracks[uri].tags.length === 0 &&
            updatedTagData.tracks[uri].rating === 0 &&
            updatedTagData.tracks[uri].energy === 0
          ) {
            TrackInfoCacheManager.removeTrackInfo(uri);
          }
        }
      } else {
        // Add tag if not all have it
        if (!hasTag) {
          updatedTagData.tracks[uri] = {
            ...trackData,
            tags: [...trackData.tags, { categoryId, subcategoryId, tagId }],
            dateCreated: trackData.dateCreated || now,
            dateModified: now,
          };
        }
      }
    });

    // Clean up empty tracks
    Object.keys(updatedTagData.tracks).forEach((uri) => {
      const trackData = updatedTagData.tracks[uri];
      if (trackData.rating === 0 && trackData.energy === 0 && trackData.tags.length === 0) {
        // Remove empty track
        const { [uri]: _, ...remainingTracks } = updatedTagData.tracks;
        updatedTagData.tracks = remainingTracks;
      }
    });

    // Update the state once with all changes
    setTagData(updatedTagData);
  };

  const setRating = (trackUri: string, rating: number) => {
    // Ensure track data exists
    const currentData = getOrCreateTrackData(trackUri);
    const trackData = currentData.tracks[trackUri];

    // If this is the first rating for an otherwise empty track, fetch BPM
    if (
      rating > 0 &&
      trackData.rating === 0 &&
      trackData.energy === 0 &&
      trackData.tags.length === 0
    ) {
      fetchBpm(trackUri)
        .then((bpm) => {
          if (bpm !== null) {
            setTagData((prevState) => {
              const currentTrackData = prevState.tracks[trackUri];
              if (!currentTrackData) return prevState;

              const now = Date.now();
              return {
                ...prevState,
                tracks: {
                  ...prevState.tracks,
                  [trackUri]: {
                    ...currentTrackData,
                    bpm: bpm,
                    dateCreated: currentTrackData.dateCreated || now,
                    dateModified: now,
                  },
                },
              };
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching BPM:", error);
        });
    }

    let finalTrackData: TrackData | null = null;

    // Check if this would make the track empty
    if (rating === 0 && trackData.energy === 0 && trackData.tags.length === 0) {
      TrackInfoCacheManager.removeTrackInfo(trackUri);

      // Create new state by removing this track
      const { [trackUri]: _, ...remainingTracks } = currentData.tracks;

      setTagData({
        ...currentData,
        tracks: remainingTracks,
      });
      finalTrackData = null;
    } else {
      const now = Date.now();
      const updatedTrackData = {
        ...trackData,
        rating,
        dateCreated: trackData.dateCreated || now,
        dateModified: now,
      };

      setTagData({
        ...currentData,
        tracks: {
          ...currentData.tracks,
          [trackUri]: updatedTrackData,
        },
      });
      finalTrackData = updatedTrackData;
    }
    setTimeout(() => syncTrackWithSmartPlaylists(trackUri, finalTrackData), 100);
  };

  // Set energy level for a track (0 means no energy rating)
  const setEnergy = (trackUri: string, energy: number) => {
    // Ensure track data exists
    const currentData = getOrCreateTrackData(trackUri);
    const trackData = currentData.tracks[trackUri];

    // If this is the first energy setting for an otherwise empty track, fetch BPM
    if (
      energy > 0 &&
      trackData.rating === 0 &&
      trackData.energy === 0 &&
      trackData.tags.length === 0
    ) {
      fetchBpm(trackUri)
        .then((bpm) => {
          if (bpm !== null) {
            setTagData((prevState) => {
              const currentTrackData = prevState.tracks[trackUri];
              if (!currentTrackData) return prevState;

              const now = Date.now();
              return {
                ...prevState,
                tracks: {
                  ...prevState.tracks,
                  [trackUri]: {
                    ...currentTrackData,
                    bpm: bpm,
                    dateCreated: currentTrackData.dateCreated || now,
                    dateModified: now,
                  },
                },
              };
            });
          }
        })
        .catch((error) => {
          console.error("Error fetching BPM:", error);
        });
    }

    let finalTrackData: TrackData | null = null;

    // Check if this would make the track empty
    if (energy === 0 && trackData.rating === 0 && trackData.tags.length === 0) {
      TrackInfoCacheManager.removeTrackInfo(trackUri);

      // Create new state by removing this track
      const { [trackUri]: _, ...remainingTracks } = currentData.tracks;

      setTagData({
        ...currentData,
        tracks: remainingTracks,
      });
      finalTrackData = null;
    } else {
      // Update state with modified track and timestamps
      const now = Date.now();
      const updatedTrackData = {
        ...trackData,
        energy,
        dateCreated: trackData.dateCreated || now,
        dateModified: now,
      };
      setTagData({
        ...currentData,
        tracks: {
          ...currentData.tracks,
          [trackUri]: updatedTrackData,
        },
      });
      finalTrackData = updatedTrackData;
    }
    setTimeout(() => syncTrackWithSmartPlaylists(trackUri, finalTrackData), 100);
  };

  const findTagName = (categoryId: string, subcategoryId: string, tagId: string): string => {
    const category = tagData.categories.find((c) => c.id === categoryId);
    if (!category) return "";

    const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
    if (!subcategory) return "";

    const tag = subcategory.tags.find((t) => t.id === tagId);
    return tag ? tag.name : "";
  };

  // Export data for rekordbox integration
  const exportData = () => {
    const exportResult: ExportDataResult = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      tracks: {},
      tag_analytics: {
        total_categories: tagData.categories.length,
        total_subcategories: 0,
        total_tags: 0,
        used_tags: 0,
        unused_tags: 0,
        categories: [],
        tag_usage_summary: {
          most_used_tags: [],
          unused_tag_names: [],
          usage_percentage: 0,
        },
      },
    };

    // Build comprehensive tag usage map
    const tagUsageMap = new Map<string, number>();

    // Initialize all tags with zero usage
    tagData.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        subcategory.tags.forEach((tag) => {
          const tagKey = `${category.id}:${subcategory.id}:${tag.id}`;
          tagUsageMap.set(tagKey, 0);
        });
      });
    });

    // Count actual tag usage from tracks
    Object.values(tagData.tracks).forEach((trackData) => {
      trackData.tags.forEach((tag) => {
        const tagKey = `${tag.categoryId}:${tag.subcategoryId}:${tag.tagId}`;
        const currentCount = tagUsageMap.get(tagKey) || 0;
        tagUsageMap.set(tagKey, currentCount + 1);
      });
    });

    // Build detailed category analytics
    tagData.categories.forEach((category, categoryIndex) => {
      const categoryAnalytics: CategoryAnalytics = {
        id: category.id,
        name: category.name,
        order: categoryIndex,
        total_subcategories: category.subcategories.length,
        total_tags: 0,
        used_tags: 0,
        unused_tags: 0,
        subcategories: [],
      };

      category.subcategories.forEach((subcategory, subcategoryIndex) => {
        const subcategoryAnalytics: SubcategoryAnalytics = {
          id: subcategory.id,
          name: subcategory.name,
          order: subcategoryIndex,
          total_tags: subcategory.tags.length,
          used_tags: 0,
          unused_tags: 0,
          tags: [],
        };

        subcategory.tags.forEach((tag, tagIndex) => {
          const tagKey = `${category.id}:${subcategory.id}:${tag.id}`;
          const usageCount = tagUsageMap.get(tagKey) || 0;
          const isUsed = usageCount > 0;

          const tagAnalytics: TagAnalytics = {
            id: tag.id,
            name: tag.name,
            order: tagIndex,
            usage_count: usageCount,
            is_used: isUsed,
            full_path: `${category.name} > ${subcategory.name} > ${tag.name}`,
          };

          subcategoryAnalytics.tags.push(tagAnalytics);

          if (isUsed) {
            subcategoryAnalytics.used_tags++;
            categoryAnalytics.used_tags++;
            exportResult.tag_analytics.used_tags++;
          } else {
            subcategoryAnalytics.unused_tags++;
            categoryAnalytics.unused_tags++;
            exportResult.tag_analytics.unused_tags++;
          }

          categoryAnalytics.total_tags++;
          exportResult.tag_analytics.total_tags++;
        });

        categoryAnalytics.subcategories.push(subcategoryAnalytics);
        exportResult.tag_analytics.total_subcategories++;
      });

      exportResult.tag_analytics.categories.push(categoryAnalytics);
    });

    // Create usage summary for quick reference
    const usedTags: { name: string; count: number; full_key: string }[] = [];
    const unusedTags: { name: string; full_key: string }[] = [];
    const mostUsedTags: { name: string; usage_count: number }[] = [];

    tagUsageMap.forEach((count, tagKey) => {
      const [categoryId, subcategoryId, tagId] = tagKey.split(":");
      const tagName = findTagName(categoryId, subcategoryId, tagId);

      if (count > 0) {
        usedTags.push({ name: tagName, count, full_key: tagKey });
      } else {
        unusedTags.push({ name: tagName, full_key: tagKey });
      }
    });

    // Sort by usage and get top 10 most used tags
    mostUsedTags.push(
      ...usedTags
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((tag) => ({ name: tag.name, usage_count: tag.count }))
    );

    exportResult.tag_analytics.tag_usage_summary = {
      most_used_tags: mostUsedTags,
      unused_tag_names: unusedTags.map((tag) => tag.name).sort(),
      usage_percentage:
        exportResult.tag_analytics.total_tags > 0
          ? Math.round(
              (exportResult.tag_analytics.used_tags / exportResult.tag_analytics.total_tags) * 100
            )
          : 0,
    };

    // Export track data (existing logic)
    Object.entries(tagData.tracks).forEach(([uri, data]) => {
      // Skip tracks that have no meaningful data
      if (data.rating === 0 && data.energy === 0 && (!data.tags || data.tags.length === 0)) {
        return;
      }

      const tagNames = data.tags
        .map((tag) => findTagName(tag.categoryId, tag.subcategoryId, tag.tagId))
        .filter((name) => name !== "");

      const energyComment = data.energy > 0 ? `Energy ${data.energy} - ` : "";
      const bpmComment = data.bpm !== null ? `BPM ${data.bpm} - ` : "";

      // Format for rekordbox
      exportResult.tracks[uri] = {
        rating: data.rating,
        energy: data.energy,
        bpm: data.bpm,
        tags: data.tags.map((tag) => ({
          categoryId: tag.categoryId,
          subcategoryId: tag.subcategoryId,
          tagId: tag.tagId,
          name: findTagName(tag.categoryId, tag.subcategoryId, tag.tagId),
        })),
        rekordbox_comment:
          tagNames.length > 0
            ? `${bpmComment}${energyComment}${tagNames.join(", ")}`
            : (bpmComment + energyComment).length > 0
            ? (bpmComment + energyComment).slice(0, -3)
            : "", // Remove trailing " - " if no tags
      };
    });

    return exportResult;
  };

  return {
    tagData,
    isLoading,
    lastSaved,

    // Track tag management
    toggleTagForTrack,
    setRating,
    setEnergy,
    setBpm,
    updateBpm,
    toggleTagForMultipleTracks,
    findCommonTags,
    applyBatchTagUpdates,

    // Category management
    replaceCategories,

    // Smart playlists
    smartPlaylists,
    setSmartPlaylists,
    storeSmartPlaylist,
    syncSmartPlaylistFull,
    cleanupDeletedSmartPlaylists,

    // Import/Export
    exportData,
    exportBackup,
    importBackup,
  };
}
