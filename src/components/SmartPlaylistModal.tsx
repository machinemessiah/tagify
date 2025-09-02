import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SmartPlaylistModal.module.css";
import Portal from "../utils/Portal";
import { SmartPlaylistCriteria, TagCategory } from "../hooks/useTagData";
import { formatCondensedDate, formatTimestamp } from "../utils/formatters";
import { spotifyApiService } from "../services/SpotifyApiService";

const PLAYLIST_SORT_OPTIONS = {
  ALPHABETICAL: "alphabetical",
  DATE_CREATED: "dateCreated",
  NEEDS_SYNC: "needsSync",
} as const;

const SORT_ORDERS = {
  ASC: "asc",
  DESC: "desc",
} as const;

type PlaylistSortOption =
  (typeof PLAYLIST_SORT_OPTIONS)[keyof typeof PLAYLIST_SORT_OPTIONS];
type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

interface SmartPlaylistModalProps {
  smartPlaylists: SmartPlaylistCriteria[];
  tagCategories: TagCategory[];
  onUpdateSmartPlaylists: (updatedPlaylists: SmartPlaylistCriteria[]) => void;
  onSyncPlaylist: (playlist: SmartPlaylistCriteria) => Promise<void>;
  onExportSmartPlaylists: () => void;
  onImportSmartPlaylists: (data: SmartPlaylistCriteria[]) => void;
  onCleanupDeletedSmartPlaylists: () => Promise<void>;
  onClose: () => void;
}

const SmartPlaylistModal: React.FC<SmartPlaylistModalProps> = ({
  smartPlaylists,
  tagCategories,
  onUpdateSmartPlaylists,
  onSyncPlaylist,
  onExportSmartPlaylists,
  onImportSmartPlaylists,
  onCleanupDeletedSmartPlaylists,
  onClose,
}) => {
  const [syncingPlaylists, setSyncingPlaylists] = useState<Set<string>>(
    new Set()
  );
  const [playlistTrackCounts, setPlaylistTrackCounts] = useState<
    Record<string, number>
  >({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<PlaylistSortOption>(
    PLAYLIST_SORT_OPTIONS.ALPHABETICAL
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(SORT_ORDERS.ASC);

  const getSyncStatus = (
    playlist: SmartPlaylistCriteria
  ): "synced" | "needsSync" | "unknown" => {
    const actualCount = playlistTrackCounts[playlist.playlistId];
    const expectedCount = playlist.smartPlaylistTrackUris.length;

    if (actualCount === undefined) return "unknown";
    if (actualCount === expectedCount) return "synced";
    return "needsSync";
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportClick = () => {
    onClose();
    onExportSmartPlaylists();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate smart playlist data structure
        if (
          Array.isArray(data) &&
          data.every(
            (playlist) =>
              playlist &&
              typeof playlist === "object" &&
              typeof playlist.playlistId === "string" &&
              typeof playlist.playlistName === "string" &&
              playlist.criteria &&
              typeof playlist.criteria === "object"
          )
        ) {
          onImportSmartPlaylists(data);
          Spicetify.showNotification("Smart playlists imported successfully!");
        } else {
          console.error("Invalid smart playlist backup structure:", data);
          Spicetify.showNotification(
            "Invalid smart playlist backup file format",
            true
          );
        }
      } catch (error) {
        console.error("Error parsing backup file:", error);
        Spicetify.showNotification("Error importing backup", true);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    reader.onerror = () => {
      Spicetify.showNotification("Error reading backup file", true);
    };

    reader.readAsText(file);
  };

  const filteredAndSortedPlaylists = useMemo(() => {
    // First, filter by search query
    const filtered = smartPlaylists.filter((playlist) =>
      playlist.playlistName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Then sort based on selected criteria
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case PLAYLIST_SORT_OPTIONS.ALPHABETICAL: {
          comparison = a.playlistName.localeCompare(b.playlistName);
          break;
        }

        case PLAYLIST_SORT_OPTIONS.DATE_CREATED: {
          const dateA = a.createdAt || 0;
          const dateB = b.createdAt || 0;
          comparison = dateA - dateB;
          break;
        }

        case PLAYLIST_SORT_OPTIONS.NEEDS_SYNC: {
          const syncStatusA = getSyncStatus(a);
          const syncStatusB = getSyncStatus(b);

          // Prioritize playlists that need sync
          if (syncStatusA === "needsSync" && syncStatusB !== "needsSync") {
            comparison = -1; // A comes first
          } else if (
            syncStatusA !== "needsSync" &&
            syncStatusB === "needsSync"
          ) {
            comparison = 1; // B comes first
          } else {
            // If both have same sync status, sort alphabetically
            comparison = a.playlistName.localeCompare(b.playlistName);
          }
          break;
        }

        default:
          return 0;
      }

      // Apply sort order (except for needsSync which has custom logic)
      if (sortBy !== PLAYLIST_SORT_OPTIONS.NEEDS_SYNC) {
        return sortOrder === SORT_ORDERS.DESC ? -comparison : comparison;
      }

      return comparison;
    });
  }, [smartPlaylists, searchQuery, sortBy, sortOrder, playlistTrackCounts]);

  // Clear search when modal closes
  useEffect(() => {
    return () => {
      setSearchQuery("");
    };
  }, []);

  useEffect(() => {
    onCleanupDeletedSmartPlaylists();
  }, []);

  useEffect(() => {
    const syncPlaylistNames = async () => {
      let hasUpdates = false;
      const updatedPlaylists = await Promise.all(
        smartPlaylists.map(async (playlist) => {
          try {
            const response = await Spicetify.CosmosAsync.get(
              `https://api.spotify.com/v1/playlists/${playlist.playlistId}?fields=name,description`
            );

            if (response.name !== playlist.playlistName) {
              hasUpdates = true;
              return {
                ...playlist,
                playlistName: response.name,
              };
            }

            return playlist;
          } catch (error) {
            console.error(
              `Failed to fetch metadata for playlist ${playlist.playlistId}:`,
              error
            );
            return playlist;
          }
        })
      );

      if (hasUpdates) {
        onUpdateSmartPlaylists(updatedPlaylists);
      }
    };

    if (smartPlaylists.length > 0) {
      syncPlaylistNames();
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      if (smartPlaylists.length === 0) return;

      setIsLoadingCounts(true);
      const playlistIds = smartPlaylists.map((p) => p.playlistId);
      const counts = await spotifyApiService.getPlaylistTrackCounts(
        playlistIds
      );
      setPlaylistTrackCounts(counts);
      setIsLoadingCounts(false);
    };

    fetchCounts();
  }, [smartPlaylists]);

  const toggleSmartPlaylistActive = async (playlistId: string) => {
    const playlist = smartPlaylists.find((p) => p.playlistId === playlistId);
    if (!playlist) return;

    const willBeActive = !playlist.isActive;

    // Update the state first
    const updatedPlaylists = smartPlaylists.map((p) => {
      if (p.playlistId === playlistId) {
        return {
          ...p,
          isActive: willBeActive,
        };
      }
      return p;
    });

    onUpdateSmartPlaylists(updatedPlaylists);

    // If enabling the playlist, do a full sync
    if (willBeActive) {
      setSyncingPlaylists((prev) => new Set(prev).add(playlistId));

      try {
        const updatedPlaylist = updatedPlaylists.find(
          (p) => p.playlistId === playlistId
        )!;
        await onSyncPlaylist(updatedPlaylist);
      } catch (error) {
        console.error("Failed to sync playlist after activation:", error);
        Spicetify.showNotification("Failed to sync playlist", true);
        // Revert the isActive state on error
        const revertedPlaylists = smartPlaylists.map((p) =>
          p.playlistId === playlistId ? { ...p, isActive: false } : p
        );
        onUpdateSmartPlaylists(revertedPlaylists);
      } finally {
        setSyncingPlaylists((prev) => {
          const newSet = new Set(prev);
          newSet.delete(playlistId);
          return newSet;
        });
      }
    }
  };

  const handleManualSync = async (playlist: SmartPlaylistCriteria) => {
    if (!playlist.isActive) return;

    setSyncingPlaylists((prev) => new Set(prev).add(playlist.playlistId));

    try {
      await onSyncPlaylist(playlist);
    } catch (error) {
      console.error("Manual sync failed:", error);
      Spicetify.showNotification("Sync failed", true);
    } finally {
      setSyncingPlaylists((prev) => {
        const newSet = new Set(prev);
        newSet.delete(playlist.playlistId);
        return newSet;
      });
    }
  };

  const findTagName = (
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ): string => {
    const category = tagCategories.find((c) => c.id === categoryId);
    if (!category) return "Unknown Tag";

    const subcategory = category.subcategories.find(
      (s) => s.id === subcategoryId
    );
    if (!subcategory) return "Unknown Tag";

    const tag = subcategory.tags.find((t) => t.id === tagId);
    return tag ? tag.name : "Unknown Tag";
  };

  const formatActiveTagFilters = (playlist: SmartPlaylistCriteria): string => {
    if (playlist.criteria.activeTagFilters.length === 0) return "";

    const tagNames = playlist.criteria.activeTagFilters.map((filter) =>
      findTagName(filter.categoryId, filter.subcategoryId, filter.tagId)
    );

    const logicMode = playlist.criteria.isOrFilterMode ? "ANY" : "ALL";
    return `${logicMode} of: ${tagNames.join(", ")}`;
  };

  const formatExcludedTagFilters = (
    playlist: SmartPlaylistCriteria
  ): string => {
    if (playlist.criteria.excludedTagFilters.length === 0) return "";

    const tagNames = playlist.criteria.excludedTagFilters.map((filter) =>
      findTagName(filter.categoryId, filter.subcategoryId, filter.tagId)
    );

    return `${tagNames.join(", ")}`;
  };

  const formatRatingFilters = (ratingFilters: number[]): string => {
    if (ratingFilters.length === 0) return "";
    return `${ratingFilters.sort((a, b) => a - b).join(", ")} ★`;
  };

  const formatEnergyRange = (
    min: number | null,
    max: number | null
  ): string => {
    if (min === null && max === null) return "";
    if (min !== null && max !== null) {
      return min === max ? `Energy: ${min}` : `Energy: ${min} - ${max}`;
    }
    if (min !== null) return `Energy: ≥${min}`;
    return `Energy: ≤${max}`;
  };

  const formatBpmRange = (min: number | null, max: number | null): string => {
    if (min === null && max === null) return "";
    if (min !== null && max !== null) {
      return min === max ? `${min} BPM` : `${min} - ${max} BPM`;
    }
    if (min !== null) return `≥${min} BPM`;
    return `≤${max} BPM`;
  };

  const navigateToPlaylist = (playlistId: string) => {
    Spicetify.Platform.History.push(`/playlist/${playlistId}`);
    onClose();
  };

  return (
    <>
      <Portal>
        <div className={styles.modalOverlay} onClick={onClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                Smart Playlists ({smartPlaylists.length})
              </h2>

              <div className={styles.headerActions}>
                <button
                  className={`${styles.headerButton} ${styles.exportButton}`}
                  onClick={handleExportClick}
                  title="Backup your smart playlists"
                >
                  ↗ Backup
                </button>

                <button
                  className={`${styles.headerButton} ${styles.importButton}`}
                  onClick={handleImportClick}
                  title="Import smart playlists"
                >
                  ↙ Import
                </button>

                <button className="modal-close-button" onClick={onClose}>
                  ×
                </button>
              </div>
            </div>

            {/* Search and Sort Controls */}
            <div className={styles.controlsSection}>
              <div className={styles.searchSection}>
                <input
                  type="text"
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                {searchQuery && (
                  <button
                    className={styles.clearSearchButton}
                    onClick={() => setSearchQuery("")}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.sortSection}>
                <label className={styles.sortLabel}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as PlaylistSortOption)
                  }
                  className={styles.sortSelect}
                >
                  <option value={PLAYLIST_SORT_OPTIONS.ALPHABETICAL}>
                    Name
                  </option>
                  <option value={PLAYLIST_SORT_OPTIONS.DATE_CREATED}>
                    Date Created
                  </option>
                  <option value={PLAYLIST_SORT_OPTIONS.NEEDS_SYNC}>
                    Needs Sync
                  </option>
                </select>

                {sortBy !== PLAYLIST_SORT_OPTIONS.NEEDS_SYNC && (
                  <button
                    className={styles.sortOrderButton}
                    onClick={() =>
                      setSortOrder(
                        sortOrder === SORT_ORDERS.ASC
                          ? SORT_ORDERS.DESC
                          : SORT_ORDERS.ASC
                      )
                    }
                    title={`Sort ${
                      sortOrder === SORT_ORDERS.ASC ? "descending" : "ascending"
                    }`}
                  >
                    {sortOrder === SORT_ORDERS.ASC ? "↑" : "↓"}
                  </button>
                )}
              </div>
            </div>

            <div className={styles.modalBody}>
              {filteredAndSortedPlaylists.length === 0 ? (
                <div className={styles.emptyState}>
                  {searchQuery ? (
                    <>
                      <div className={styles.emptyIcon}>🔍</div>
                      <h3>No playlists found</h3>
                      <p>No playlists match "{searchQuery}"</p>
                    </>
                  ) : (
                    <>
                      <div className={styles.emptyIcon}>🎵</div>
                      <h3>No Smart Playlists Yet</h3>
                      <p>
                        Create a playlist with filters and enable "Smart
                        Playlist" to get started!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className={styles.playlistList}>
                  {filteredAndSortedPlaylists.map((playlist) => {
                    const activeTagsText = formatActiveTagFilters(playlist);
                    const excludedTagsText = formatExcludedTagFilters(playlist);
                    const ratingText = formatRatingFilters(
                      playlist.criteria.ratingFilters
                    );
                    const energyText = formatEnergyRange(
                      playlist.criteria.energyMinFilter,
                      playlist.criteria.energyMaxFilter
                    );
                    const bpmText = formatBpmRange(
                      playlist.criteria.bpmMinFilter,
                      playlist.criteria.bpmMaxFilter
                    );
                    const hasCriteria =
                      activeTagsText ||
                      excludedTagsText ||
                      ratingText ||
                      energyText ||
                      bpmText;
                    return (
                      <div
                        key={playlist.playlistId}
                        className={`${styles.playlistItem} ${
                          !playlist.isActive ? styles.inactive : ""
                        }`}
                      >
                        {/* TOP SECTION: Title and Status */}
                        <div className={styles.playlistHeader}>
                          <div className={styles.playlistTitleSection}>
                            <h3
                              className={styles.playlistName}
                              onClick={() =>
                                navigateToPlaylist(playlist.playlistId)
                              }
                            >
                              {playlist.playlistName}
                            </h3>
                            <div className={styles.playlistStatus}>
                              {!playlist.isActive && (
                                <span className={styles.inactiveLabel}>
                                  Inactive
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Creation Date */}
                          <div className={styles.playlistMetadata}>
                            <span
                              className={styles.timeStamp}
                              title={`Created: ${formatTimestamp(
                                playlist.createdAt
                              )}`}
                            >
                              {formatCondensedDate(playlist.createdAt, "short")}
                            </span>
                          </div>
                        </div>
                        {/* STATS ROW: Track counts and sync status */}
                        <div className={styles.playlistStatsRow}>
                          <div className={styles.trackRowItem}>
                            <div className={styles.trackCountNumber}>
                              {isLoadingCounts
                                ? "..."
                                : playlistTrackCounts[playlist.playlistId] || 0}
                            </div>
                            <div className={styles.trackCountLabel}>
                              In Playlist
                            </div>
                          </div>
                          <div className={styles.trackRowItem}>
                            <div className={styles.trackCountNumber}>
                              {playlist.smartPlaylistTrackUris.length}
                            </div>
                            <div className={styles.trackCountLabel}>
                              Expected
                            </div>
                          </div>
                          {/* Sync Status Indicator */}
                          {!isLoadingCounts && (
                            <div className={styles.trackRowItem}>
                              {getSyncStatus(playlist) === "synced" && (
                                <span
                                  className={`${styles.syncIndicator} ${styles.synced}`}
                                >
                                  ✓ In Sync
                                </span>
                              )}
                              {getSyncStatus(playlist) === "needsSync" && (
                                <span
                                  className={`${styles.syncIndicator} ${styles.needsSync}`}
                                >
                                  ⚠ Needs Sync
                                </span>
                              )}
                              {getSyncStatus(playlist) === "unknown" && (
                                <span
                                  className={`${styles.syncIndicator} ${styles.unknown}`}
                                >
                                  ? Unknown
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {/* CRITERIA SECTION */}
                        {hasCriteria ? (
                          <div className={styles.criteriaSection}>
                            <div className={styles.criteriaHeader}>
                              <h4 className={styles.criteriaTitle}>
                                Filter Criteria
                              </h4>
                            </div>
                            <div className={styles.criteriaList}>
                              {activeTagsText && (
                                <div className={styles.criteriaItem}>
                                  <span className={styles.criteriaLabel}>
                                    🏷️ Tags:
                                  </span>
                                  <span className={styles.criteriaValue}>
                                    {activeTagsText}
                                  </span>
                                </div>
                              )}
                              {excludedTagsText && (
                                <div className={styles.criteriaItem}>
                                  <span className={styles.criteriaLabel}>
                                    🚫 Excluded:
                                  </span>
                                  <span className={styles.criteriaValue}>
                                    {excludedTagsText}
                                  </span>
                                </div>
                              )}
                              {ratingText && (
                                <div className={styles.criteriaItem}>
                                  <span className={styles.criteriaLabel}>
                                    🏆 Rating:
                                  </span>
                                  <span className={styles.criteriaValue}>
                                    {ratingText}
                                  </span>
                                </div>
                              )}
                              {energyText && (
                                <div className={styles.criteriaItem}>
                                  <span className={styles.criteriaLabel}>
                                    ⚡ Energy:
                                  </span>
                                  <span className={styles.criteriaValue}>
                                    {energyText}
                                  </span>
                                </div>
                              )}
                              {bpmText && (
                                <div className={styles.criteriaItem}>
                                  <span className={styles.criteriaLabel}>
                                    🎵 BPM:
                                  </span>
                                  <span className={styles.criteriaValue}>
                                    {bpmText}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.noCriteria}>
                            <span>No filter criteria set</span>
                          </div>
                        )}
                        {/* ACTIONS: Stay at bottom */}
                        <div className={styles.playlistActions}>
                          <button
                            className={`${styles.actionButton} ${
                              styles.syncToggleButton
                            } ${!playlist.isActive ? styles.inactive : ""}`}
                            onClick={() =>
                              toggleSmartPlaylistActive(playlist.playlistId)
                            }
                            disabled={syncingPlaylists.has(playlist.playlistId)}
                          >
                            {playlist.isActive ? "Disable Sync" : "Enable Sync"}
                          </button>
                          {playlist.isActive && (
                            <button
                              className={`${styles.actionButton} ${
                                styles.syncButton
                              } ${
                                getSyncStatus(playlist) === "needsSync"
                                  ? styles.syncButtonUrgent
                                  : ""
                              } ${
                                syncingPlaylists.has(playlist.playlistId)
                                  ? styles.syncing
                                  : ""
                              }`}
                              onClick={() => handleManualSync(playlist)}
                              disabled={syncingPlaylists.has(
                                playlist.playlistId
                              )}
                            >
                              {syncingPlaylists.has(playlist.playlistId)
                                ? "Syncing..."
                                : "Sync Now"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Portal>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
};

export default SmartPlaylistModal;
