import React, { useState, useEffect } from "react";
import styles from "./MultiTrackDetails.module.css";
import { BatchTagUpdate, TagCategory, TrackTag } from "../hooks/useTagData";
import {
  DraftTagState,
  useMultiTrackTagging,
} from "../hooks/useMultiTrackTagging";

interface MultiTrackDetailsProps {
  tracks: Array<{
    uri: string;
    name: string;
    artists: { name: string }[];
    album: { name: string };
  }>;
  trackDataMap: DraftTagState;
  categories: TagCategory[];
  onCancelTagging: () => void;
  onPlayTrack: (uri: string) => void;
  lockedTrackUri: string | null;
  onLockTrack: (uri: string | null) => void;
  multiTrackDraftTags: DraftTagState;
  onSetMultiTrackDraftTags: (draftTags: DraftTagState) => void;
  onBatchUpdate: (updates: BatchTagUpdate[]) => void;
}

const MultiTrackDetails: React.FC<MultiTrackDetailsProps> = ({
  tracks,
  trackDataMap,
  categories,
  onCancelTagging,
  onPlayTrack,
  lockedTrackUri,
  onLockTrack,
  multiTrackDraftTags,
  onSetMultiTrackDraftTags,
  onBatchUpdate,
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    findCommonTagsFromDraft,
    findCommonStarRatingFromDraft,
    findCommonEnergyRatingFromDraft,
  } = useMultiTrackTagging();

  const updateDraftTags = (
    updater: DraftTagState | ((prev: DraftTagState) => DraftTagState)
  ) => {
    if (typeof updater === "function") {
      const newDraft = updater(multiTrackDraftTags);
      onSetMultiTrackDraftTags(newDraft);
    } else {
      onSetMultiTrackDraftTags(updater);
    }
  };

  // Check for changes whenever draft tags update
  useEffect(() => {
    let hasAnyChanges = false;

    for (const track of tracks) {
      const originalTrackData = trackDataMap[track.uri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };
      const draftTrackData = multiTrackDraftTags[track.uri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };

      if (
        originalTrackData.tags.length !== draftTrackData.tags.length ||
        originalTrackData.rating !== draftTrackData.rating ||
        originalTrackData.energy !== draftTrackData.energy
      ) {
        hasAnyChanges = true;
        break;
      }

      // Check if all original tags exist in draft
      const hasAllOriginal = originalTrackData.tags.every((origTag) =>
        draftTrackData.tags.some(
          (draftTag) =>
            draftTag.categoryId === origTag.categoryId &&
            draftTag.subcategoryId === origTag.subcategoryId &&
            draftTag.tagId === origTag.tagId
        )
      );

      if (!hasAllOriginal) {
        hasAnyChanges = true;
        break;
      }
    }

    setHasUnsavedChanges(hasAnyChanges);
  }, [multiTrackDraftTags, trackDataMap, tracks]);

  const getTagName = (
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return "Unknown";

    const subcategory = category.subcategories.find(
      (s) => s.id === subcategoryId
    );
    if (!subcategory) return "Unknown";

    const tag = subcategory.tags.find((t) => t.id === tagId);
    return tag ? tag.name : "Unknown";
  };

  const commonTags = findCommonTagsFromDraft(multiTrackDraftTags).sort(
    (a, b) => {
      const nameA = getTagName(a.categoryId, a.subcategoryId, a.tagId);
      const nameB = getTagName(b.categoryId, b.subcategoryId, b.tagId);
      return nameA.localeCompare(nameB);
    }
  );

  const isCommonTag = (tag: TrackTag) => {
    return commonTags.some(
      (commonTag) =>
        commonTag.categoryId === tag.categoryId &&
        commonTag.subcategoryId === tag.subcategoryId &&
        commonTag.tagId === tag.tagId
    );
  };

  // Handle tag removal/addition in draft state
  const handleRemoveTagDraft = (tag: TrackTag) => {
    updateDraftTags((prev: DraftTagState) => {
      const newDraft = { ...prev };

      if (lockedTrackUri) {
        // Single track toggle
        const trackData = newDraft[lockedTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        const tagIndex = trackData.tags.findIndex(
          (t) =>
            t.categoryId === tag.categoryId &&
            t.subcategoryId === tag.subcategoryId &&
            t.tagId === tag.tagId
        );

        if (tagIndex >= 0) {
          newDraft[lockedTrackUri] = {
            ...trackData,
            tags: trackData.tags.filter((_, i) => i !== tagIndex),
          };
        } else {
          newDraft[lockedTrackUri] = {
            ...trackData,
            tags: [...trackData.tags, tag],
          };
        }

        return newDraft;
      } else {
        const commonTags = findCommonTagsFromDraft(newDraft);
        const allHaveTag = commonTags.some(
          (commonTag) =>
            commonTag.categoryId === tag.categoryId &&
            commonTag.subcategoryId === tag.subcategoryId &&
            commonTag.tagId === tag.tagId
        );

        // Apply or remove to/from all tracks
        tracks.forEach((track) => {
          const trackData = newDraft[track.uri] || {
            tags: [],
            rating: 0,
            energy: 0,
          };
          const tagIndex = trackData.tags.findIndex(
            (t) =>
              t.categoryId === tag.categoryId &&
              t.subcategoryId === tag.subcategoryId &&
              t.tagId === tag.tagId
          );

          if (allHaveTag && tagIndex >= 0) {
            // Remove from all
            newDraft[track.uri] = {
              ...trackData,
              tags: trackData.tags.filter((_, i) => i !== tagIndex),
            };
          } else if (!allHaveTag && tagIndex < 0) {
            // Add to all that don't have it
            newDraft[track.uri] = {
              ...trackData,
              tags: [...trackData.tags, tag],
            };
          }
        });
        return newDraft;
      }
    });
  };

  // Handle track click
  const handleTrackClick = (uri: string, e: React.MouseEvent) => {
    // Don't trigger when clicking on play button or tags
    if (
      (e.target as HTMLElement).closest(`.${styles.playButton}`) ||
      (e.target as HTMLElement).closest(`.${styles.tagItem}`)
    ) {
      return;
    }

    // If already locked on this track, unlock it
    if (lockedTrackUri === uri) {
      onLockTrack(null);
    } else {
      onLockTrack(uri);
    }
  };

  // Handle individual track tag click in draft state
  const handleTagClickDraft = (
    trackUri: string,
    tag: TrackTag,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent track locking when clicking on tags

    // Toggle the tag for this specific track in draft state
    updateDraftTags((prev: DraftTagState) => {
      const newDraft = { ...prev };
      const trackData = newDraft[trackUri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };
      const tagIndex = trackData.tags.findIndex(
        (t) =>
          t.categoryId === tag.categoryId &&
          t.subcategoryId === tag.subcategoryId &&
          t.tagId === tag.tagId
      );

      if (tagIndex >= 0) {
        newDraft[trackUri] = {
          ...trackData,
          tags: trackData.tags.filter((_, i) => i !== tagIndex),
        };
      } else {
        newDraft[trackUri] = {
          ...trackData,
          tags: [...trackData.tags, tag],
        };
      }

      return newDraft;
    });
  };

  const handleBulkStarRatingClick = (rating: number) => {
    updateDraftTags((prev: DraftTagState) => {
      const newDraft = { ...prev };

      if (lockedTrackUri) {
        // Single track toggle
        const trackData = newDraft[lockedTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        const newRating = trackData.rating === rating ? 0 : rating;

        newDraft[lockedTrackUri] = {
          ...trackData,
          rating: newRating,
        };
      } else {
        // Bulk toggle
        const commonRating = findCommonStarRatingFromDraft(newDraft);
        const newRating = commonRating === rating ? 0 : rating;

        tracks.forEach((track) => {
          const trackData = newDraft[track.uri] || {
            tags: [],
            rating: 0,
            energy: 0,
          };
          newDraft[track.uri] = {
            ...trackData,
            rating: newRating,
          };
        });
      }

      return newDraft;
    });
  };

  // Handle bulk energy rating click
  const handleBulkEnergyClick = (energy: number) => {
    updateDraftTags((prev: DraftTagState) => {
      const newDraft = { ...prev };

      if (lockedTrackUri) {
        // Single track toggle
        const trackData = newDraft[lockedTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        const newEnergy = trackData.energy === energy ? 0 : energy;

        newDraft[lockedTrackUri] = {
          ...trackData,
          energy: newEnergy,
        };
      } else {
        // Bulk toggle
        const commonEnergy = findCommonEnergyRatingFromDraft(newDraft);
        const newEnergy = commonEnergy === energy ? 0 : energy;

        tracks.forEach((track) => {
          const trackData = newDraft[track.uri] || {
            tags: [],
            rating: 0,
            energy: 0,
          };
          newDraft[track.uri] = {
            ...trackData,
            energy: newEnergy,
          };
        });
      }

      return newDraft;
    });
  };

  // Save changes - apply all draft changes
  const handleSaveChanges = () => {
    // Calculate what changed
    const changes: BatchTagUpdate[] = [];

    tracks.forEach((track) => {
      const originalData = trackDataMap[track.uri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };
      const draftData = multiTrackDraftTags[track.uri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };

      const toAdd = draftData.tags.filter(
        (draftTag) =>
          !originalData.tags.some(
            (origTag) =>
              origTag.categoryId === draftTag.categoryId &&
              origTag.subcategoryId === draftTag.subcategoryId &&
              origTag.tagId === draftTag.tagId
          )
      );

      const toRemove = originalData.tags.filter(
        (origTag) =>
          !draftData.tags.some(
            (draftTag) =>
              draftTag.categoryId === origTag.categoryId &&
              draftTag.subcategoryId === origTag.subcategoryId &&
              draftTag.tagId === origTag.tagId
          )
      );

      const ratingChanged = originalData.rating !== draftData.rating;
      const energyChanged = originalData.energy !== draftData.energy;

      if (
        toAdd.length > 0 ||
        toRemove.length > 0 ||
        ratingChanged ||
        energyChanged
      ) {
        const change: BatchTagUpdate = { trackUri: track.uri, toAdd, toRemove };

        if (ratingChanged) {
          change.newRating = draftData.rating;
        }

        if (energyChanged) {
          change.newEnergy = draftData.energy;
        }

        changes.push(change);
      }
    });

    if (changes.length === 0) {
      Spicetify.showNotification("No changes to save");
      return;
    }

    // Apply all changes in a single batch
    onBatchUpdate(changes);

    // Update the draft state to match what we just saved
    // This ensures the UI reflects the saved state immediately
    const newDraft: DraftTagState = {};
    tracks.forEach((track) => {
      newDraft[track.uri] = { ...multiTrackDraftTags[track.uri] };
    });
    onSetMultiTrackDraftTags(newDraft);

    // setHasUnsavedChanges(false);
    Spicetify.showNotification(`Saved changes to ${changes.length} tracks`);
  };

  // Cancel changes - reset to original state
  const handleCancelChanges = () => {
    const resetDraft: DraftTagState = {};
    tracks.forEach((track) => {
      const originalData = trackDataMap[track.uri] || {
        tags: [],
        rating: 0,
        energy: 0,
      };
      resetDraft[track.uri] = {
        tags: [...originalData.tags],
        rating: originalData.rating,
        energy: originalData.energy,
      };
    });
    onSetMultiTrackDraftTags(resetDraft);
    setHasUnsavedChanges(false);
  };

  // Handle cancel with confirmation if there are unsaved changes
  const handleCancelTagging = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to cancel?")
      ) {
        const resetDraft: DraftTagState = {};
        tracks.forEach((track) => {
          const originalData = trackDataMap[track.uri] || {
            tags: [],
            rating: 0,
            energy: 0,
          };
          resetDraft[track.uri] = {
            tags: [...originalData.tags],
            rating: originalData.rating,
            energy: originalData.energy,
          };
        });
        onSetMultiTrackDraftTags(resetDraft);
        setHasUnsavedChanges(false);

        onCancelTagging();
      }
    } else {
      const resetDraft: DraftTagState = {};
      tracks.forEach((track) => {
        const originalData = trackDataMap[track.uri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        resetDraft[track.uri] = {
          tags: [...originalData.tags],
          rating: originalData.rating,
          energy: originalData.energy,
        };
      });
      onSetMultiTrackDraftTags(resetDraft);
      setHasUnsavedChanges(false);
      onCancelTagging();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Bulk Tagging</h2>
        <div className={styles.summary}>
          <span className={styles.trackCount}>
            {tracks.length} tracks selected
          </span>
          {hasUnsavedChanges && (
            <span className={styles.unsavedIndicator}>• Unsaved changes</span>
          )}
          <div className={styles.actionButtons}>
            <button
              className={styles.saveButton}
              onClick={handleSaveChanges}
              disabled={!hasUnsavedChanges}
            >
              Save Changes
            </button>
            <button
              className={styles.discardButton}
              onClick={handleCancelChanges}
              disabled={!hasUnsavedChanges}
            >
              Discard
            </button>
            <button
              className={styles.cancelButton}
              onClick={handleCancelTagging}
            >
              {"Cancel Bulk Tagging"}
            </button>
          </div>
        </div>
      </div>

      {lockedTrackUri ? (
        <div className={styles.lockingBanner}>
          <span className={styles.lockingIcon}>🔒</span>
          <span className={styles.lockingText}>
            Tags will be applied to the locked track only. Click the track again
            to revert to bulk tagging.
          </span>
        </div>
      ) : (
        <div className={styles.multiTaggingBanner}>
          <span className={styles.multiTaggingIcon}>🏷️</span>
          <span className={styles.multiTaggingText}>
            Tags will be applied to all selected tracks.{" "}
            <span role="img" aria-label="pointer">
              👉
            </span>{" "}
            <strong>Click on a track</strong> to lock tagging to that track
            only.
          </span>
        </div>
      )}

      <div className={styles.commonTagsSection}>
        <h3 className={styles.sectionTitle}>Common Tags</h3>
        {commonTags.length > 0 ? (
          <div className={styles.tagList}>
            {commonTags.map((tag, index) => (
              <div
                key={index}
                className={styles.tagItem}
                onClick={() => handleRemoveTagDraft(tag)}
                title="Click to toggle this tag"
              >
                {getTagName(tag.categoryId, tag.subcategoryId, tag.tagId)}
                <span className={styles.removeTagIcon}>×</span>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noTags}>No common tags</p>
        )}
      </div>

      <div className={styles.trackListContainer}>
        <h3 className={styles.sectionTitle}>Selected Tracks</h3>
        <div className={styles.trackList}>
          {tracks.map((track) => (
            <div
              key={track.uri}
              className={`${styles.trackItem} ${
                lockedTrackUri === track.uri ? styles.lockedTrack : ""
              }`}
              onClick={(e) => handleTrackClick(track.uri, e)}
            >
              <div className={styles.trackInfo}>
                {lockedTrackUri === track.uri && (
                  <span className={styles.lockIcon}>🔒</span>
                )}
                <span className={styles.trackName}>{track.name}</span>
                <span className={styles.trackArtist}>
                  {track.artists.map((artist) => artist.name).join(", ")}
                </span>
              </div>
              <div className={styles.trackTagsInline}>
                {(multiTrackDraftTags[track.uri]?.tags || []).length > 0 ? (
                  <div className={styles.tagList}>
                    {multiTrackDraftTags[track.uri]?.tags
                      .slice()
                      .sort((a, b) => {
                        const nameA = getTagName(
                          a.categoryId,
                          a.subcategoryId,
                          a.tagId
                        );
                        const nameB = getTagName(
                          b.categoryId,
                          b.subcategoryId,
                          b.tagId
                        );
                        return nameA.localeCompare(nameB);
                      })
                      .map((tag, index) => (
                        <div
                          key={index}
                          className={`${styles.tagItem} ${
                            isCommonTag(tag) ? styles.commonTagHighlight : ""
                          }`}
                          onClick={(e) =>
                            handleTagClickDraft(track.uri, tag, e)
                          }
                          title="Click to toggle this tag on this track"
                        >
                          {getTagName(
                            tag.categoryId,
                            tag.subcategoryId,
                            tag.tagId
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <span className={styles.noTags}>No tags</span>
                )}
              </div>
              <button
                className={styles.playButton}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  onPlayTrack(track.uri);
                }}
                title={"Play this track"}
              >
                {"Play"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.instructions}>
        <p>
          Apply tags to{" "}
          {lockedTrackUri ? "the locked track" : "all selected tracks"} using
          the tag selector below.{" "}
          {hasUnsavedChanges && "Remember to save your changes!"}
        </p>
        <p>
          {lockedTrackUri
            ? "Click the locked track again to unlock it."
            : "Click any track to lock tagging to that track only."}
        </p>
      </div>
    </div>
  );
};

export default MultiTrackDetails;
