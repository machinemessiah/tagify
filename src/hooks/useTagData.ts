import { useState, useEffect, useRef, useCallback } from "react";
import { TrackInfoCacheManager } from "../utils/TrackInfoCache";
import { spotifyApiService } from "../services/SpotifyApiService";
import { defaultTagData } from "../constants/defaultTagData";
import { needsMigrations, runMigrations } from "../utils/migration";
import packageJson from "../../package.json";

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

interface SyncOperation {
  id: string;
  type: "single" | "multiple";
  execute: () => Promise<void>;
}

export interface SmartPlaylistCriteria {
  playlistId: string;
  playlistName: string;
  criteria: {
    activeTagFilters: {
      categoryId: string;
      subcategoryId: string;
      tagId: string;
    }[];
    excludedTagFilters: {
      categoryId: string;
      subcategoryId: string;
      tagId: string;
    }[];
    ratingFilters: number[];
    energyMinFilter: number | null;
    energyMaxFilter: number | null;
    bpmMinFilter: number | null;
    bpmMaxFilter: number | null;
    isOrFilterMode: boolean;
  };
  isActive: boolean;
  createdAt: number;
  lastSyncAt: number;
  smartPlaylistTrackUris: string[];
}

const TAG_DATA_KEY = "tagify:tagData";
const SMART_PLAYLIST_KEY = "tagify:smartPlaylists";
const MIGRATIONS_KEY = "tagify:migrations";
const DATA_UPDATED_EVENT = "tagify:dataUpdated";

export function useTagData() {
  const [tagData, setTagData] = useState<TagDataStructure>(defaultTagData);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylistCriteria[]>(
    []
  );

  // Single queue processor promise to prevent race conditions
  const queueProcessorRef = useRef<Promise<void> | null>(null);
  const smartPlaylistsRef = useRef<SmartPlaylistCriteria[]>([]);
  const syncQueueRef = useRef<SyncOperation[]>([]);
  const migrationRunRef = useRef(false);

  // keep ref in sync with state
  useEffect(() => {
    smartPlaylistsRef.current = smartPlaylists;
  }, [smartPlaylists]);

  // Process sync operations sequentially
  const processSyncQueue = useCallback(async () => {
    // If processor is already running, wait for it to complete
    if (queueProcessorRef.current) {
      await queueProcessorRef.current;
      return;
    }

    // Start processing if queue has items
    if (syncQueueRef.current.length === 0) {
      return;
    }

    // Create the processor promise that processes ONE operation at a time
    queueProcessorRef.current = (async () => {
      try {
        while (syncQueueRef.current.length > 0) {
          const operation = syncQueueRef.current.shift()!;

          const startTime = Date.now();

          try {
            // Fully await each operation before moving to next
            await operation.execute();
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `FAILED operation ${operation.id} after ${duration}ms:`,
              error
            );
          }
        }
      } finally {
        queueProcessorRef.current = null;
      }
    })();

    // Wait for the entire queue to complete
    await queueProcessorRef.current;
  }, []);

  // Thread-safe state updater using functional updates
  const updateSmartPlaylistsImmediate = useCallback(
    (updater: (prev: SmartPlaylistCriteria[]) => SmartPlaylistCriteria[]) => {
      const currentPlaylists = smartPlaylistsRef.current;
      const updated = updater(currentPlaylists);

      if (currentPlaylists.length > 0 && updated.length === 0) {
        return currentPlaylists;
      }

      // Update ref immediately - this is the source of truth
      smartPlaylistsRef.current = updated;

      // Update React state
      setSmartPlaylists(updated);

      // Save to localStorage
      try {
        localStorage.setItem(SMART_PLAYLIST_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Error saving smart playlist data:", error);
      }

      return updated;
    },
    []
  );

  // Load smart playlists on mount
  useEffect(() => {
    try {
      const savedSmartPlaylists = localStorage.getItem(SMART_PLAYLIST_KEY);
      if (savedSmartPlaylists) {
        const parsed = JSON.parse(savedSmartPlaylists);

        if (!Array.isArray(parsed) || parsed.length === 0) {
          return;
        }

        // Filter out corrupted playlists
        const validPlaylists = Array.isArray(parsed)
          ? parsed.filter(
              (playlist) =>
                playlist &&
                typeof playlist.playlistId === "string" &&
                typeof playlist.playlistName === "string" &&
                typeof playlist.isActive === "boolean" &&
                playlist.criteria &&
                Array.isArray(playlist.criteria.activeTagFilters)
            )
          : [];

        setSmartPlaylists(validPlaylists);
        smartPlaylistsRef.current = validPlaylists;
      }
    } catch (error) {
      console.error("Error loading smart playlists:", error);
    }
  }, []);

  const updatePlaylistTrackUris = useCallback(
    (playlistId: string, newTrackUris: string[]) => {
      updateSmartPlaylistsImmediate((playlists) =>
        playlists.map((playlist) =>
          playlist.playlistId === playlistId
            ? {
                ...playlist,
                smartPlaylistTrackUris: newTrackUris,
                lastSyncAt: Date.now(),
              }
            : playlist
        )
      );
    },
    [updateSmartPlaylistsImmediate]
  );

  // RUN MIGRATIONS
  useEffect(() => {
    // Skip if migration already attempted
    if (migrationRunRef.current) {
      return;
    }

    const categoriesLoaded = tagData.categories.length > 0;
    const tracksExist = Object.keys(tagData.tracks).length > 0;
    const needsMigration = needsMigrations();

    // Check if user has tracks with actual meaningful data
    const tracksWithData = Object.values(tagData.tracks).filter(
      (track) =>
        track.rating > 0 ||
        track.energy > 0 ||
        (track.tags && track.tags.length > 0)
    ).length;

    if (
      categoriesLoaded &&
      tracksExist &&
      tracksWithData > 0 &&
      needsMigration
    ) {
      console.log(
        `Running data migrations for ${tracksWithData} meaningful tracks...`
      );
      migrationRunRef.current = true;

      const timeoutId = setTimeout(() => {
        runMigrations(tagData, setTagData);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (categoriesLoaded && tracksExist && tracksWithData === 0) {
      console.log(
        "User has tracks but no meaningful data - marking migration as complete"
      );
      migrationRunRef.current = true;

      // Mark migration as done for new users or users with no real data
      const migrationState = {
        version: packageJson.version,
        migrations: { cleanupEmptyTracks: true },
      };
      localStorage.setItem(MIGRATIONS_KEY, JSON.stringify(migrationState));
    }
  }, [tagData.categories.length, Object.keys(tagData.tracks).length]);

  const createSmartPlaylist = (criteria: SmartPlaylistCriteria) => {
    setSmartPlaylists((prev) => {
      const newPlaylists = [...prev, criteria];

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
      (trackData.rating > 0 &&
        criteria.ratingFilters.includes(trackData.rating));

    // Energy range filter
    const matchesEnergyMin =
      criteria.energyMinFilter === null ||
      trackData.energy >= criteria.energyMinFilter;
    const matchesEnergyMax =
      criteria.energyMaxFilter === null ||
      trackData.energy <= criteria.energyMaxFilter;

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

  const cleanupDeletedSmartPlaylists = async (): Promise<void> => {
    if (smartPlaylists.length === 0) {
      return;
    }

    try {
      const allUserPlaylistIds: string[] =
        await spotifyApiService.getAllUserPlaylists();

      // if API call failed, don't delete all your smart playlists
      if (!allUserPlaylistIds || allUserPlaylistIds.length === 0) {
        return;
      }

      const validPlaylists: SmartPlaylistCriteria[] = smartPlaylists.filter(
        (sp: SmartPlaylistCriteria) =>
          allUserPlaylistIds.includes(sp.playlistId)
      );

      if (validPlaylists.length !== smartPlaylists.length) {
        setSmartPlaylists(validPlaylists);
        localStorage.setItem(
          SMART_PLAYLIST_KEY,
          JSON.stringify(validPlaylists)
        );
        Spicetify.showNotification(
          `Cleaned up ${
            smartPlaylists.length - validPlaylists.length
          } deleted smart playlist(s)`,
          false,
          3000
        );
      }
    } catch (error) {
      console.error(`Problem fetching or processing playlists:`, error);
    }
  };

  const syncMultipleTracksWithSmartPlaylists = useCallback(
    async (trackUpdates: Record<string, TrackData | null>): Promise<void> => {
      const operationId = `multi-${Date.now()}-${Math.random()}`;

      const syncOperation: SyncOperation = {
        id: operationId,
        type: "multiple",
        execute: async () => {
          // Get current state at execution time (from ref - the source of truth)
          const currentPlaylists = smartPlaylistsRef.current;

          if (!currentPlaylists || currentPlaylists.length === 0) {
            return;
          }

          console.log(
            `[${operationId}] Processing ${currentPlaylists.length} smart playlists`
          );

          // Process each playlist sequentially to avoid conflicts
          for (const playlist of currentPlaylists) {
            if (!playlist?.playlistId || !playlist.isActive) {
              continue;
            }

            // Get the most current state for this playlist
            const currentPlaylistData = smartPlaylistsRef.current.find(
              (p) => p.playlistId === playlist.playlistId
            );
            if (!currentPlaylistData) continue;

            let trackUris = [
              ...(currentPlaylistData.smartPlaylistTrackUris || []),
            ];
            let hasChanges = false;

            // Process each track update for this playlist
            for (const [trackUri, trackData] of Object.entries(trackUpdates)) {
              const isCurrentlyTracked = trackUris.includes(trackUri);
              if (!trackData) {
                // Track deleted - remove from playlist
                if (isCurrentlyTracked) {
                  const success =
                    await spotifyApiService.removeTrackFromPlaylist(
                      trackUri,
                      playlist.playlistId
                    );
                  if (success) {
                    trackUris = trackUris.filter((uri) => uri !== trackUri);
                    hasChanges = true;
                    // Update state immediately so next operation sees the change
                    updatePlaylistTrackUris(playlist.playlistId, trackUris);
                    showTrackRemovedNotification(playlist.playlistName);
                  }
                }
              } else {
                const matches = evaluateTrackMatchesCriteria(
                  trackData,
                  playlist.criteria
                );

                if (matches && !isCurrentlyTracked) {
                  // ADD TRACK
                  const result =
                    await spotifyApiService.addTrackToSpotifyPlaylist(
                      trackUri,
                      playlist.playlistId
                    );
                  if (result.success && !trackUris.includes(trackUri)) {
                    trackUris.push(trackUri);
                    hasChanges = true;
                    // Update state immediately
                    updatePlaylistTrackUris(playlist.playlistId, trackUris);
                    showTrackAddedNotification(
                      trackUri,
                      playlist.playlistName,
                      result.wasAdded
                    );
                  }
                } else if (!matches && isCurrentlyTracked) {
                  // REMOVE TRACK
                  const success =
                    await spotifyApiService.removeTrackFromPlaylist(
                      trackUri,
                      playlist.playlistId
                    );
                  if (success) {
                    trackUris = trackUris.filter((uri) => uri !== trackUri);
                    hasChanges = true;
                    // Update state immediately
                    updatePlaylistTrackUris(playlist.playlistId, trackUris);
                    showTrackRemovedNotification(playlist.playlistName);
                  }
                }
              }
            }

            if (hasChanges) {
              // Final validation to ensure consistency
              try {
                const actualTrackUris =
                  await spotifyApiService.getAllTrackUrisInPlaylist(
                    playlist.playlistId
                  );
                if (actualTrackUris && actualTrackUris.length >= 0) {
                  updatePlaylistTrackUris(playlist.playlistId, actualTrackUris);
                }
              } catch (error) {
                console.error(
                  `[${operationId}] Validation failed for ${playlist.playlistName}:`,
                  error
                );
              }
            }
          }
        },
      };

      syncQueueRef.current.push(syncOperation);
      processSyncQueue();
    },
    [updatePlaylistTrackUris, processSyncQueue]
  );

  const syncTrackWithSmartPlaylists = useCallback(
    async (trackUri: string, trackData: TrackData | null): Promise<void> => {
      const operationId = `single-${Date.now()}-${Math.random()}`;

      const syncOperation: SyncOperation = {
        id: operationId,
        type: "single",
        execute: async () => {
          const currentPlaylists = smartPlaylistsRef.current;
          if (!currentPlaylists || currentPlaylists.length === 0) {
            return;
          }

          // Process each playlist sequentially
          for (const playlist of currentPlaylists) {
            if (!playlist?.playlistId || !playlist.isActive) {
              continue;
            }

            // Get current state for this playlist
            const currentPlaylistData = smartPlaylistsRef.current.find(
              (p) => p.playlistId === playlist.playlistId
            );
            if (!currentPlaylistData) continue;

            const isCurrentlyTracked = (
              currentPlaylistData.smartPlaylistTrackUris || []
            ).includes(trackUri);
            let trackUris = [
              ...(currentPlaylistData.smartPlaylistTrackUris || []),
            ];

            if (!trackData) {
              // Track deleted - remove from playlist
              if (isCurrentlyTracked) {
                const success = await spotifyApiService.removeTrackFromPlaylist(
                  trackUri,
                  playlist.playlistId
                );
                if (success) {
                  trackUris = trackUris.filter((uri) => uri !== trackUri);
                  updatePlaylistTrackUris(playlist.playlistId, trackUris);
                  showTrackRemovedNotification(playlist.playlistName);
                }
              }
            } else {
              const matches = evaluateTrackMatchesCriteria(
                trackData,
                playlist.criteria
              );

              if (matches && !isCurrentlyTracked) {
                // ADD TRACK
                const result =
                  await spotifyApiService.addTrackToSpotifyPlaylist(
                    trackUri,
                    playlist.playlistId
                  );
                if (result.success && !trackUris.includes(trackUri)) {
                  trackUris.push(trackUri);
                  updatePlaylistTrackUris(playlist.playlistId, trackUris);
                  showTrackAddedNotification(
                    trackUri,
                    playlist.playlistName,
                    result.wasAdded
                  );
                }
              } else if (!matches && isCurrentlyTracked) {
                // REMOVE TRACK
                const success = await spotifyApiService.removeTrackFromPlaylist(
                  trackUri,
                  playlist.playlistId
                );
                if (success) {
                  trackUris = trackUris.filter((uri) => uri !== trackUri);
                  updatePlaylistTrackUris(playlist.playlistId, trackUris);
                  showTrackRemovedNotification(playlist.playlistName);
                }
              }
            }
          }
        },
      };

      syncQueueRef.current.push(syncOperation);
      processSyncQueue();
    },
    [updatePlaylistTrackUris, processSyncQueue]
  );

  const showTrackAddedNotification = (
    trackUri: string,
    playlistName: string,
    wasAdded: boolean
  ) => {
    if (trackUri.startsWith("spotify:local:")) {
      Spicetify.showNotification(
        `🎵 Local file matches "${playlistName}" criteria but must be added manually`,
        true,
        5000
      );
    } else if (wasAdded) {
      Spicetify.showNotification(
        `✅ Added track to smart playlist "${playlistName}"`,
        false,
        3000
      );
    }
  };

  const showTrackRemovedNotification = (playlistName: string) => {
    Spicetify.showNotification(
      `❌ Track removed from smart playlist "${playlistName}"`,
      false,
      3000
    );
  };

  const syncSmartPlaylistFull = async (
    playlist: SmartPlaylistCriteria
  ): Promise<void> => {
    try {
      if (!playlist.isActive) {
        return;
      }

      const allTrackUrisInPlaylist =
        await spotifyApiService.getAllTrackUrisInPlaylist(playlist.playlistId);

      if (!allTrackUrisInPlaylist || allTrackUrisInPlaylist.length === 0) {
        return;
      }

      const trackOccurrences = new Map<string, number>();
      const duplicateUris = new Set<string>();

      allTrackUrisInPlaylist.forEach((trackUri) => {
        const count = trackOccurrences.get(trackUri) || 0;
        trackOccurrences.set(trackUri, count + 1);

        if (count > 0) {
          duplicateUris.add(trackUri);
        }
      });

      // DEDUPLICATION PROCESS
      let duplicatesRemovedCount = 0;
      for (const trackUri of duplicateUris) {
        const originalCount = trackOccurrences.get(trackUri) || 0;

        try {
          // Remove ALL instances
          const removeSuccess = await spotifyApiService.removeTrackFromPlaylist(
            trackUri,
            playlist.playlistId
          );

          if (removeSuccess) {
            try {
              // Re-add exactly ONE instance
              const addResult =
                await spotifyApiService.addTrackToSpotifyPlaylist(
                  trackUri,
                  playlist.playlistId
                );

              if (addResult.success && addResult.wasAdded) {
                // We removed (originalCount) and added back 1, so net removal is (originalCount - 1)
                duplicatesRemovedCount += originalCount - 1;
              } else {
                console.error(
                  `Failed to re-add deduplicated track: ${trackUri}`
                );
                Spicetify.showNotification(
                  `⚠️ Track lost during deduplication: ${trackUri}`,
                  true,
                  5000
                );
              }
            } catch (addError) {
              console.error(`API error re-adding track ${trackUri}:`, addError);
              Spicetify.showNotification(
                `⚠️ Failed to restore track after deduplication`,
                true,
                5000
              );
            }
          }
        } catch (removeError) {
          console.error(
            `API error removing duplicates for ${trackUri}:`,
            removeError
          );
          // Continue with other tracks
        }
      }

      // GET FRESH PLAYLIST STATE after deduplication
      let currentTrackUrisInPlaylist: string[] = [];
      try {
        currentTrackUrisInPlaylist =
          await spotifyApiService.getAllTrackUrisInPlaylist(
            playlist.playlistId
          );
      } catch (error) {
        console.error(
          `Failed to fetch playlist state after deduplication:`,
          error
        );
        Spicetify.showNotification(
          `⚠️ Error syncing "${playlist.playlistName}"`,
          true,
          5000
        );
        return;
      }

      // SMART PLAYLIST SYNC LOGIC
      const matchingTrackUris: string[] = [];
      Object.entries(tagData.tracks).forEach(([trackUri, trackData]) => {
        const matches: boolean = evaluateTrackMatchesCriteria(
          trackData,
          playlist.criteria
        );
        if (matches) {
          matchingTrackUris.push(trackUri);
        }
      });

      // Use FRESH state for sync calculations
      const tracksToAdd = matchingTrackUris.filter(
        (uri) => !currentTrackUrisInPlaylist.includes(uri)
      );
      const tracksToRemove = currentTrackUrisInPlaylist.filter(
        (uri) => !matchingTrackUris.includes(uri)
      );

      let addedCount = 0;
      let removedCount = 0;

      // Remove tracks that no longer match criteria
      for (const trackUri of tracksToRemove) {
        try {
          const success = await spotifyApiService.removeTrackFromPlaylist(
            trackUri,
            playlist.playlistId
          );
          if (success) {
            removedCount++;
          }
        } catch (error) {
          console.error(`Failed to remove track ${trackUri}:`, error);
        }
      }

      // Add tracks that now match criteria
      for (const trackUri of tracksToAdd) {
        try {
          const result = await spotifyApiService.addTrackToSpotifyPlaylist(
            trackUri,
            playlist.playlistId
          );
          if (result.success && result.wasAdded) {
            addedCount++;
          }
        } catch (error) {
          console.error(`Failed to add track ${trackUri}:`, error);
        }
      }

      // Update local state
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

      // User notification
      if (duplicatesRemovedCount > 0 || addedCount > 0 || removedCount > 0) {
        const messageParts: string[] = [];

        if (addedCount > 0) messageParts.push(`+${addedCount} tracks`);
        if (removedCount > 0) messageParts.push(`-${removedCount} tracks`);
        if (duplicatesRemovedCount > 0)
          messageParts.push(`-${duplicatesRemovedCount} duplicates`);

        const message = `✅ Synced "${
          playlist.playlistName
        }": ${messageParts.join(", ")}`;
        Spicetify.showNotification(message, false, 10000);
      } else {
        Spicetify.showNotification(
          `✅ "${playlist.playlistName}" is already in sync`,
          false,
          5000
        );
      }

      console.log(`Full sync completed for playlist: ${playlist.playlistName}`);
    } catch (error) {
      console.error(
        `Critical error in syncSmartPlaylistFull for ${playlist.playlistName}:`,
        error
      );
      Spicetify.showNotification(
        `❌ Failed to sync "${playlist.playlistName}"`,
        true,
        5000
      );
    }
  };

  const saveToLocalStorage = (data: TagDataStructure): boolean => {
    try {
      localStorage.setItem(TAG_DATA_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Tagify: Error saving to localStorage", error);
      return false;
    }
  };

  const loadFromLocalStorage = (): TagDataStructure | null => {
    try {
      const savedData = localStorage.getItem(TAG_DATA_KEY);
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
    if (
      localData &&
      localData.categories &&
      Array.isArray(localData.categories)
    ) {
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
      const event = new CustomEvent(DATA_UPDATED_EVENT, {
        detail: { type: "save" },
      });
      window.dispatchEvent(event);
    }
    return saved;
  };

  const exportSmartPlaylists = () => {
    const jsonData = JSON.stringify(smartPlaylists, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tagify-smart-playlists-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();

    URL.revokeObjectURL(url);

    Spicetify.showNotification("Backup saved in 'Downloads' folder");
  };

  const exportTagData = () => {
    const jsonData = JSON.stringify(tagData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `tagify-tags-${new Date().toISOString().split("T")[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);

    Spicetify.showNotification("Backup saved in 'Downloads' folder");
  };

  const importSmartPlaylists = (backupData: SmartPlaylistCriteria[]) => {
    setSmartPlaylists(backupData);
  };

  const importTagData = (backupData: TagDataStructure) => {
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

        const subcategory = category.subcategories.find(
          (s) => s.id === tag.subcategoryId
        );
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
      syncMultipleTracksWithSmartPlaylists(finalTrackDataMap);
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

  const updateBpm = async (trackUri: string): Promise<number | null> => {
    try {
      const bpm = await spotifyApiService.fetchBpm(trackUri);
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
    setTimeout(
      () => syncTrackWithSmartPlaylists(trackUri, finalTrackData),
      100
    );
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
      (t) =>
        t.categoryId === categoryId &&
        t.subcategoryId === subcategoryId &&
        t.tagId === tagId
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

      if (
        updatedTags.length === 1 &&
        trackData.rating === 0 &&
        trackData.energy === 0
      ) {
        spotifyApiService
          .fetchBpm(trackUri)
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
    }
    setTimeout(
      () => syncTrackWithSmartPlaylists(trackUri, finalTrackData),
      100
    );
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
        (t) =>
          t.categoryId === categoryId &&
          t.subcategoryId === subcategoryId &&
          t.tagId === tagId
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
        (t) =>
          t.categoryId === categoryId &&
          t.subcategoryId === subcategoryId &&
          t.tagId === tagId
      );

      if (allHaveTag) {
        // Remove tag if all have it
        if (hasTag) {
          const existingTagIndex = trackData.tags.findIndex(
            (t) =>
              t.categoryId === categoryId &&
              t.subcategoryId === subcategoryId &&
              t.tagId === tagId
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
      if (
        trackData.rating === 0 &&
        trackData.energy === 0 &&
        trackData.tags.length === 0
      ) {
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
      spotifyApiService
        .fetchBpm(trackUri)
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
    setTimeout(
      () => syncTrackWithSmartPlaylists(trackUri, finalTrackData),
      100
    );
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
      spotifyApiService
        .fetchBpm(trackUri)
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
    setTimeout(
      () => syncTrackWithSmartPlaylists(trackUri, finalTrackData),
      100
    );
  };

  const findTagName = (
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ): string => {
    const category = tagData.categories.find((c) => c.id === categoryId);
    if (!category) return "";

    const subcategory = category.subcategories.find(
      (s) => s.id === subcategoryId
    );
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
              (exportResult.tag_analytics.used_tags /
                exportResult.tag_analytics.total_tags) *
                100
            )
          : 0,
    };

    // Export track data (existing logic)
    Object.entries(tagData.tracks).forEach(([uri, data]) => {
      // Skip tracks that have no meaningful data
      if (
        data.rating === 0 &&
        data.energy === 0 &&
        (!data.tags || data.tags.length === 0)
      ) {
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
    setTagData, // todo: keep this for tests?
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
    createSmartPlaylist,
    syncSmartPlaylistFull,
    cleanupDeletedSmartPlaylists,
    evaluateTrackMatchesCriteria,
    syncTrackWithSmartPlaylists,
    syncMultipleTracksWithSmartPlaylists,

    // Import/Export
    exportData,
    exportSmartPlaylists,
    exportTagData,
    importTagData,
    importSmartPlaylists,
  };
}
