import React, { useEffect, useState } from "react";
import styles from "./SmartPlaylistModal.module.css";
import Portal from "../utils/Portal";
import { SmartPlaylistCriteria, TagCategory } from "../hooks/useTagData";

interface SmartPlaylistModalProps {
  smartPlaylists: SmartPlaylistCriteria[];
  tagCategories: TagCategory[];
  onUpdateSmartPlaylists: (updatedPlaylists: SmartPlaylistCriteria[]) => void;
  onSyncPlaylist: (playlist: SmartPlaylistCriteria) => Promise<void>;
  onClose: () => void;
}

const SmartPlaylistModal: React.FC<SmartPlaylistModalProps> = ({
  smartPlaylists,
  tagCategories,
  onUpdateSmartPlaylists,
  onSyncPlaylist,
  onClose,
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [playlistMetadata, setPlaylistMetadata] = useState<{
    [id: string]: { name: string; description: string };
  }>({});
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [syncingPlaylists, setSyncingPlaylists] = useState<Set<string>>(new Set());

  useEffect(() => {
    const syncPlaylistNames = async () => {
      setIsLoadingMetadata(true);

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
            console.error(`Failed to fetch metadata for playlist ${playlist.playlistId}:`, error);
            return playlist;
          }
        })
      );

      if (hasUpdates) {
        onUpdateSmartPlaylists(updatedPlaylists);
      }

      setIsLoadingMetadata(false);
    };

    if (smartPlaylists.length > 0) {
      syncPlaylistNames();
    } else {
      setIsLoadingMetadata(false);
    }
  }, []);

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
        const updatedPlaylist = { ...playlist, isActive: true };
        await onSyncPlaylist(updatedPlaylist);
      } catch (error) {
        console.error("Failed to sync playlist after activation:", error);
        Spicetify.showNotification("Failed to sync playlist", true);
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

  const findTagName = (categoryId: string, subcategoryId: string, tagId: string): string => {
    const category = tagCategories.find((c) => c.id === categoryId);
    if (!category) return "Unknown Tag";

    const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
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

  const formatExcludedTagFilters = (playlist: SmartPlaylistCriteria): string => {
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

  const formatEnergyRange = (min: number | null, max: number | null): string => {
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
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Smart Playlists ({smartPlaylists.length})</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            {smartPlaylists.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🎵</div>
                <h3>No Smart Playlists Yet</h3>
                <p>Create a playlist with filters and enable "Smart Playlist" to get started!</p>
              </div>
            ) : (
              <div className={styles.playlistList}>
                {smartPlaylists.map((playlist) => {
                  const activeTagsText = formatActiveTagFilters(playlist);
                  const excludedTagsText = formatExcludedTagFilters(playlist);
                  const ratingText = formatRatingFilters(playlist.criteria.ratingFilters);
                  const energyText = formatEnergyRange(
                    playlist.criteria.energyMinFilter,
                    playlist.criteria.energyMaxFilter
                  );
                  const bpmText = formatBpmRange(
                    playlist.criteria.bpmMinFilter,
                    playlist.criteria.bpmMaxFilter
                  );

                  const hasCriteria =
                    activeTagsText || excludedTagsText || ratingText || energyText || bpmText;

                  return (
                    <div
                      key={playlist.playlistId}
                      className={`${styles.playlistItem} ${
                        !playlist.isActive ? styles.inactive : ""
                      }`}
                    >
                      <div className={styles.playlistHeader}>
                        <div className={styles.playlistTitleSection}>
                          <h3
                            className={styles.playlistName}
                            onClick={() => navigateToPlaylist(playlist.playlistId)}
                          >
                            {playlist.playlistName}
                          </h3>
                          <div className={styles.playlistStatus}>
                            {!playlist.isActive && (
                              <span className={styles.inactiveLabel}>Inactive</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.playlistMeta}>
                          <span className={styles.trackCount}>
                            {playlist.smartPlaylistTrackUris.length} tracks
                          </span>
                          <span className={styles.lastSync}>
                            Synced: {new Date(playlist.lastSyncAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {hasCriteria ? (
                        <div className={styles.criteriaSection}>
                          <h4 className={styles.criteriaTitle}>Filter Criteria:</h4>
                          <div className={styles.criteriaList}>
                            {activeTagsText && (
                              <div className={styles.criteriaItem}>
                                <span className={styles.criteriaLabel}>🏷️ Tags:</span>
                                <span className={styles.criteriaValue}>{activeTagsText}</span>
                              </div>
                            )}

                            {excludedTagsText && (
                              <div className={styles.criteriaItem}>
                                <span className={styles.criteriaLabel}>🚫 Excluded:</span>
                                <span className={styles.criteriaValue}>{excludedTagsText}</span>
                              </div>
                            )}

                            {ratingText && (
                              <div className={styles.criteriaItem}>
                                <span className={styles.criteriaLabel}>🏆 Rating:</span>
                                <span className={styles.criteriaValue}>{ratingText}</span>
                              </div>
                            )}

                            {energyText && (
                              <div className={styles.criteriaItem}>
                                <span className={styles.criteriaLabel}>⚡ Energy:</span>
                                <span className={styles.criteriaValue}>{energyText}</span>
                              </div>
                            )}

                            {bpmText && (
                              <div className={styles.criteriaItem}>
                                <span className={styles.criteriaLabel}>🎵 BPM:</span>
                                <span className={styles.criteriaValue}>{bpmText}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noCriteria}>
                          <span>No filter criteria set</span>
                        </div>
                      )}

                      <div className={styles.playlistActions}>
                        <button
                          className={styles.actionButton}
                          onClick={() => toggleSmartPlaylistActive(playlist.playlistId)}
                          disabled={syncingPlaylists.has(playlist.playlistId)}
                        >
                          {syncingPlaylists.has(playlist.playlistId)
                            ? "Syncing..."
                            : `${playlist.isActive ? "Disable" : "Enable"} Sync`}
                        </button>
                        {playlist.isActive && (
                          <button
                            className={styles.actionButton}
                            onClick={() => handleManualSync(playlist)}
                            disabled={syncingPlaylists.has(playlist.playlistId)}
                          >
                            {syncingPlaylists.has(playlist.playlistId) ? "Syncing..." : "Sync Now"}
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
  );
};

export default SmartPlaylistModal;
