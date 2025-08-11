import React, { useState } from "react";
import styles from "./CreatePlaylistModal.module.css";
import Portal from "../utils/Portal";

interface CreatePlaylistModalProps {
  trackCount: number;
  localTrackCount: number;
  activeTagDisplayNames: string[];
  excludedTagDisplayNames: string[];
  isOrFilterMode: boolean;
  energyMinFilter: number | null;
  energyMaxFilter: number | null;
  ratingFilters: number[];
  bpmMinFilter: number | null;
  bpmMaxFilter: number | null;
  onClose: () => void;
  onCreatePlaylist: (
    playlistName: string,
    description: string,
    isPublic: boolean,
    isSmartPlaylist: boolean
  ) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  trackCount,
  localTrackCount,
  activeTagDisplayNames,
  excludedTagDisplayNames,
  isOrFilterMode,
  energyMinFilter,
  energyMaxFilter,
  ratingFilters,
  bpmMinFilter,
  bpmMaxFilter,
  onClose,
  onCreatePlaylist,
}) => {
  const defaultPlaylistName = (() => {
    const filterParts = [];

    if (activeTagDisplayNames.length > 0) {
      filterParts.push(activeTagDisplayNames.slice(0, 2).join(", ")); // Limit to first 2 tags for brevity
    }

    if (ratingFilters.length > 0) {
      filterParts.push(`${ratingFilters.sort((a, b) => a - b).join(",")}★`);
    }

    if (energyMinFilter !== null || energyMaxFilter !== null) {
      if (energyMinFilter !== null && energyMaxFilter !== null) {
        if (energyMinFilter === energyMaxFilter) {
          filterParts.push(`E${energyMinFilter}`);
        } else {
          filterParts.push(`E${energyMinFilter}-${energyMaxFilter}`);
        }
      } else if (energyMinFilter !== null) {
        filterParts.push(`E≥${energyMinFilter}`);
      } else {
        filterParts.push(`E≤${energyMaxFilter}`);
      }
    }

    if (bpmMinFilter !== null || bpmMaxFilter !== null) {
      if (bpmMinFilter !== null && bpmMaxFilter !== null) {
        filterParts.push(`${bpmMinFilter}-${bpmMaxFilter}BPM`);
      } else if (bpmMinFilter !== null) {
        filterParts.push(`≥${bpmMinFilter}BPM`);
      } else {
        filterParts.push(`≤${bpmMaxFilter}BPM`);
      }
    }

    let name =
      filterParts.length > 0
        ? `Tagify - ${filterParts.join(" ")}`
        : `Tagify Playlist ${new Date().toLocaleDateString()}`;

    // Truncate if too long
    if (name.length > 100) {
      name = name.substring(0, 97) + "...";
    }

    return name;
  })();

  const defaultPlaylistDescription = (() => {
    const filterParts = [];

    const filterMode = isOrFilterMode ? "ANY" : "ALL";

    if (activeTagDisplayNames.length > 0) {
      filterParts.push(`Tags (${filterMode}): ${activeTagDisplayNames.join(", ")}`);
    }

    if (excludedTagDisplayNames.length > 0) {
      filterParts.push(`Excluded: ${excludedTagDisplayNames.join(", ")}`);
    }

    if (ratingFilters.length > 0) {
      filterParts.push(`Rating: ${ratingFilters.sort((a, b) => a - b).join(", ")} ★`);
    }

    if (energyMinFilter !== null || energyMaxFilter !== null) {
      if (energyMinFilter !== null && energyMaxFilter !== null) {
        if (energyMinFilter === energyMaxFilter) {
          filterParts.push(`Energy: ${energyMinFilter}`);
        } else {
          filterParts.push(`Energy: ${energyMinFilter} - ${energyMaxFilter}`);
        }
      } else if (energyMinFilter !== null) {
        filterParts.push(`Energy: ≥${energyMinFilter}`);
      } else {
        filterParts.push(`Energy: ≤${energyMaxFilter}`);
      }
    }

    if (bpmMinFilter !== null || bpmMaxFilter !== null) {
      if (bpmMinFilter !== null && bpmMaxFilter !== null) {
        if (bpmMinFilter === bpmMaxFilter) {
          filterParts.push(`BPM: ${bpmMinFilter}`);
        } else {
          filterParts.push(`BPM: ${bpmMinFilter} - ${bpmMaxFilter}`);
        }
      } else if (bpmMinFilter !== null) {
        filterParts.push(`BPM: ≥${bpmMinFilter}`);
      } else {
        filterParts.push(`BPM: ≤${bpmMaxFilter}`);
      }
    }

    let description = filterParts.length > 0 ? `${filterParts.join(" | ")}` : "Created with Tagify";

    // Truncate if too long
    if (description.length > 300) {
      description = description.substring(0, 297) + "...";
    }

    return description;
  })();

  const [playlistName, setPlaylistName] = useState(defaultPlaylistName);
  const [playlistDescription, setPlaylistDescription] = useState(defaultPlaylistDescription);
  const [isPublic, setIsPublic] = useState(false);
  const [isSmartPlaylist, setIsSmartPlaylist] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreatePlaylist(
      playlistName.trim() || defaultPlaylistName,
      playlistDescription.trim() || defaultPlaylistDescription,
      isPublic,
      isSmartPlaylist
    );
  };

  return (
    <Portal>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Create Playlist</h2>
            <button className={styles.closeButton} onClick={onClose}>
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.trackStats}>
              <p>
                Creating playlist with <strong>{trackCount}</strong> tracks
              </p>
              {localTrackCount > 0 && (
                <p className={styles.warning}>
                  Note: {localTrackCount} local tracks cannot be added automatically
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className={styles.playlistForm}>
              <div className={styles.formField}>
                <label htmlFor="playlist-name" className={styles.label}>
                  Playlist Name
                </label>
                <input
                  id="playlist-name"
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter playlist name"
                  maxLength={100}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="playlist-description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="playlist-description"
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className={styles.textarea}
                  placeholder="Enter playlist description"
                  maxLength={300}
                />
              </div>

              <div className={styles.formField}>
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Public playlist</span>
                </label>
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isSmartPlaylist}
                    onChange={(e) => setIsSmartPlaylist(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="checkbox-text">Smart playlist</span>
                  <div className={styles.helpTooltip}>
                    ?
                    <div className={styles.tooltipContent}>
                      <strong>💡 </strong> When new tracks match the filter criteria, they'll be
                      automatically added to this playlist!
                    </div>
                  </div>
                </label>
              </div>

              {(activeTagDisplayNames.length > 0 ||
                ratingFilters.length > 0 ||
                energyMinFilter !== null ||
                energyMaxFilter !== null ||
                bpmMinFilter !== null ||
                bpmMaxFilter !== null) && (
                <div className={styles.filtersContainer}>
                  {/* Tags on their own row if they exist */}
                  {(activeTagDisplayNames.length > 0 || excludedTagDisplayNames.length > 0) && (
                    <div className={styles.filterRow}>
                      <span className={styles.filterLabel}>🏷️ Tags:</span>
                      <div className={styles.tags}>
                        {activeTagDisplayNames.map((displayName) => (
                          <span key={displayName} className={styles.tag}>
                            {displayName}
                          </span>
                        ))}
                        {excludedTagDisplayNames.map((displayName) => (
                          <span key={displayName} className={styles.excludedTag}>
                            {displayName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Rating, Energy, and BPM on separate rows */}
                  {(ratingFilters.length > 0 ||
                    energyMinFilter !== null ||
                    energyMaxFilter !== null ||
                    bpmMinFilter !== null ||
                    bpmMaxFilter !== null) && (
                    <div className={styles.compactFilterRow}>
                      {ratingFilters.length > 0 && (
                        <span className={styles.compactFilter}>
                          <strong>Rating:</strong> {ratingFilters.sort((a, b) => a - b).join(", ")}{" "}
                          ★
                        </span>
                      )}
                      {(energyMinFilter !== null || energyMaxFilter !== null) && (
                        <span className={styles.compactFilter}>
                          <strong>⚡ Energy:</strong>{" "}
                          {energyMinFilter !== null && energyMaxFilter !== null
                            ? energyMinFilter === energyMaxFilter
                              ? energyMinFilter
                              : `${energyMinFilter} - ${energyMaxFilter}`
                            : energyMinFilter !== null
                            ? `≥${energyMinFilter}`
                            : `≤${energyMaxFilter}`}
                        </span>
                      )}
                      {(bpmMinFilter !== null || bpmMaxFilter !== null) && (
                        <span className={styles.compactFilter}>
                          <strong>🎵 BPM:</strong>{" "}
                          {bpmMinFilter !== null && bpmMaxFilter !== null
                            ? `${bpmMinFilter} - ${bpmMaxFilter}`
                            : bpmMinFilter !== null
                            ? `≥${bpmMinFilter}`
                            : `≤${bpmMaxFilter}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className={styles.createButton}>
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default CreatePlaylistModal;
