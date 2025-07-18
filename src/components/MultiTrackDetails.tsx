import React, { useState, useEffect } from "react";
import styles from "./MultiTrackDetails.module.css";
import { TagCategory, TrackTag } from "../hooks/useTagData";

export interface DraftTagState {
  [trackUri: string]: TrackTag[];
}

interface MultiTrackDetailsProps {
  tracks: Array<{
    uri: string;
    name: string;
    artists: { name: string }[];
    album: { name: string };
  }>;
  trackTagsMap: Record<string, TrackTag[]>;
  categories: TagCategory[];
  onTagAllTracks: (categoryId: string, subcategoryId: string, tagId: string) => void;
  onTagSingleTrack?: (
    trackUri: string,
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => void;
  onCancelTagging: () => void;
  onPlayTrack?: (uri: string) => void;
  lockedTrackUri?: string | null;
  onLockTrack?: (uri: string | null) => void;
  draftTags?: DraftTagState | null;
  onDraftTagsChange?: (draftTags: DraftTagState) => void;
  onBatchUpdate?: (
    updates: Array<{
      trackUri: string;
      toAdd: TrackTag[];
      toRemove: TrackTag[];
    }>
  ) => void;
}

const MultiTrackDetails: React.FC<MultiTrackDetailsProps> = ({
  tracks,
  trackTagsMap,
  categories,
  onTagAllTracks,
  onTagSingleTrack,
  onCancelTagging,
  onPlayTrack,
  lockedTrackUri,
  onLockTrack,
  draftTags: externalDraftTags,
  onDraftTagsChange,
  onBatchUpdate,
}) => {
  // Initialize draft state from current tags
  const [internalDraftTags, setInternalDraftTags] = useState<DraftTagState>(() => {
    const initial: DraftTagState = {};
    tracks.forEach((track) => {
      initial[track.uri] = [...(trackTagsMap[track.uri] || [])];
    });
    return initial;
  });

  // Use external draft tags if provided, otherwise use internal
  const draftTags = externalDraftTags || internalDraftTags;
  const setDraftTags = onDraftTagsChange || setInternalDraftTags;

  // Track if there are unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Update draft tags when props change (e.g., new tracks added)
  useEffect(() => {
    const newDraft: DraftTagState = {};
    tracks.forEach((track) => {
      // Preserve existing draft changes if track already exists
      if (draftTags[track.uri] !== undefined) {
        newDraft[track.uri] = draftTags[track.uri];
      } else {
        newDraft[track.uri] = [...(trackTagsMap[track.uri] || [])];
      }
    });
    setDraftTags(newDraft);
  }, [tracks.length]); // Only re-run when track count changes

  // Check for changes whenever draft tags update
  useEffect(() => {
    let hasAnyChanges = false;

    for (const track of tracks) {
      const originalTags = trackTagsMap[track.uri] || [];
      const draftTrackTags = draftTags[track.uri] || [];

      // Check if lengths differ
      if (originalTags.length !== draftTrackTags.length) {
        hasAnyChanges = true;
        break;
      }

      // Check if all original tags exist in draft
      const hasAllOriginal = originalTags.every((origTag) =>
        draftTrackTags.some(
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

    setHasChanges(hasAnyChanges);
  }, [draftTags, trackTagsMap, tracks]);

  // Helper function to get tag name
  const getTagName = (categoryId: string, subcategoryId: string, tagId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return "Unknown";

    const subcategory = category.subcategories.find((s) => s.id === subcategoryId);
    if (!subcategory) return "Unknown";

    const tag = subcategory.tags.find((t) => t.id === tagId);
    return tag ? tag.name : "Unknown";
  };

  // Find common tags across all tracks using draft state
  const findCommonTags = () => {
    if (tracks.length === 0) return [];

    const firstTrackUri = tracks[0].uri;
    const firstTrackTags = draftTags[firstTrackUri] || [];

    if (tracks.length === 1) return firstTrackTags;

    return firstTrackTags.filter((tag) => {
      return tracks.every((track) => {
        const trackTags = draftTags[track.uri] || [];
        return trackTags.some(
          (t) =>
            t.categoryId === tag.categoryId &&
            t.subcategoryId === tag.subcategoryId &&
            t.tagId === tag.tagId
        );
      });
    });
  };

  const commonTags = findCommonTags();

  // Handle tag removal/addition in draft state
  const handleRemoveTagDraft = (tag: TrackTag) => {
    if (lockedTrackUri) {
      // Toggle tag for single track
      setDraftTags((prev) => {
        const newDraft = { ...prev };
        const trackTags = newDraft[lockedTrackUri] || [];
        const tagIndex = trackTags.findIndex(
          (t) =>
            t.categoryId === tag.categoryId &&
            t.subcategoryId === tag.subcategoryId &&
            t.tagId === tag.tagId
        );

        if (tagIndex >= 0) {
          newDraft[lockedTrackUri] = trackTags.filter((_, i) => i !== tagIndex);
        } else {
          newDraft[lockedTrackUri] = [...trackTags, tag];
        }

        return newDraft;
      });
    } else {
      // Toggle tag for all tracks
      setDraftTags((prev) => {
        const newDraft = { ...prev };

        // Check if all tracks have this tag
        const allHaveTag = tracks.every((track) => {
          const tags = newDraft[track.uri] || [];
          return tags.some(
            (t) =>
              t.categoryId === tag.categoryId &&
              t.subcategoryId === tag.subcategoryId &&
              t.tagId === tag.tagId
          );
        });

        // Apply or remove to/from all tracks
        tracks.forEach((track) => {
          const trackTags = newDraft[track.uri] || [];
          const tagIndex = trackTags.findIndex(
            (t) =>
              t.categoryId === tag.categoryId &&
              t.subcategoryId === tag.subcategoryId &&
              t.tagId === tag.tagId
          );

          if (allHaveTag && tagIndex >= 0) {
            // Remove from all
            newDraft[track.uri] = trackTags.filter((_, i) => i !== tagIndex);
          } else if (!allHaveTag && tagIndex < 0) {
            // Add to all that don't have it
            newDraft[track.uri] = [...trackTags, tag];
          }
        });

        return newDraft;
      });
    }
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

    if (onLockTrack) {
      // If already locked on this track, unlock it
      if (lockedTrackUri === uri) {
        onLockTrack(null);
      } else {
        onLockTrack(uri);
      }
    }
  };

  // Handle individual track tag click in draft state
  const handleTagClickDraft = (trackUri: string, tag: TrackTag, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track locking when clicking on tags

    // Toggle the tag for this specific track in draft state
    setDraftTags((prev) => {
      const newDraft = { ...prev };
      const trackTags = newDraft[trackUri] || [];
      const tagIndex = trackTags.findIndex(
        (t) =>
          t.categoryId === tag.categoryId &&
          t.subcategoryId === tag.subcategoryId &&
          t.tagId === tag.tagId
      );

      if (tagIndex >= 0) {
        newDraft[trackUri] = trackTags.filter((_, i) => i !== tagIndex);
      } else {
        newDraft[trackUri] = [...trackTags, tag];
      }

      return newDraft;
    });
  };

  // Save changes - apply all draft changes
  const handleSaveChanges = () => {
    // Calculate what changed
    const changes: Array<{
      trackUri: string;
      toAdd: TrackTag[];
      toRemove: TrackTag[];
    }> = [];

    tracks.forEach((track) => {
      const originalTags = trackTagsMap[track.uri] || [];
      const draftTrackTags = draftTags[track.uri] || [];

      const toAdd = draftTrackTags.filter(
        (draftTag) =>
          !originalTags.some(
            (origTag) =>
              origTag.categoryId === draftTag.categoryId &&
              origTag.subcategoryId === draftTag.subcategoryId &&
              origTag.tagId === draftTag.tagId
          )
      );

      const toRemove = originalTags.filter(
        (origTag) =>
          !draftTrackTags.some(
            (draftTag) =>
              draftTag.categoryId === origTag.categoryId &&
              draftTag.subcategoryId === origTag.subcategoryId &&
              draftTag.tagId === origTag.tagId
          )
      );

      if (toAdd.length > 0 || toRemove.length > 0) {
        changes.push({ trackUri: track.uri, toAdd, toRemove });
      }
    });

    if (changes.length === 0) {
      Spicetify.showNotification("No changes to save");
      return;
    }

    // Use batch update if available, otherwise fall back to individual updates
    if (onBatchUpdate) {
      // Apply all changes in a single batch
      onBatchUpdate(changes);

      // Update the draft state to match what we just saved
      // This ensures the UI reflects the saved state immediately
      const newDraft: DraftTagState = {};
      tracks.forEach((track) => {
        newDraft[track.uri] = draftTags[track.uri] || [];
      });
      setDraftTags(newDraft);

      setHasChanges(false);
      Spicetify.showNotification(`Saved changes to ${changes.length} tracks`);
    } else {
      // Fallback to original behavior if batch update not available
      console.warn("Batch update not available, falling back to individual updates");

      // Apply changes one by one (this is the problematic approach)
      changes.forEach(({ trackUri, toAdd, toRemove }) => {
        toRemove.forEach((tag) => {
          if (onTagSingleTrack) {
            onTagSingleTrack(trackUri, tag.categoryId, tag.subcategoryId, tag.tagId);
          }
        });

        toAdd.forEach((tag) => {
          if (onTagSingleTrack) {
            onTagSingleTrack(trackUri, tag.categoryId, tag.subcategoryId, tag.tagId);
          }
        });
      });

      setHasChanges(false);
      Spicetify.showNotification(`Saved changes to ${changes.length} tracks`);
    }
  };

  // Cancel changes - reset to original state
  const handleCancelChanges = () => {
    const resetDraft: DraftTagState = {};
    tracks.forEach((track) => {
      resetDraft[track.uri] = [...(trackTagsMap[track.uri] || [])];
    });
    setDraftTags(resetDraft);
    setHasChanges(false);
  };

  // Handle cancel with confirmation if there are unsaved changes
  const handleCancelTagging = () => {
    if (hasChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        onCancelTagging();
      }
    } else {
      onCancelTagging();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mass Tagging</h2>
        <div className={styles.summary}>
          <span className={styles.trackCount}>{tracks.length} tracks selected</span>
          {hasChanges && <span className={styles.unsavedIndicator}>• Unsaved changes</span>}
          <div className={styles.actionButtons}>
            <button
              className={styles.saveButton}
              onClick={handleSaveChanges}
              disabled={!hasChanges}
            >
              Save Changes
            </button>
            <button
              className={styles.discardButton}
              onClick={handleCancelChanges}
              disabled={!hasChanges}
            >
              Discard
            </button>
            <button className={styles.cancelButton} onClick={handleCancelTagging}>
              {"Cancel Mass Tagging"}
            </button>
          </div>
        </div>
      </div>

      {lockedTrackUri ? (
        <div className={styles.lockingBanner}>
          <span className={styles.lockingIcon}>🔒</span>
          <span className={styles.lockingText}>
            Tags will be applied to the locked track only. Click the track again to revert to mass
            tagging.
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
            <strong>Click on a track</strong> to lock tagging to that track only.
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
                {lockedTrackUri === track.uri && <span className={styles.lockIcon}>🔒</span>}
                <span className={styles.trackName}>{track.name}</span>
                <span className={styles.trackArtist}>
                  {track.artists.map((artist) => artist.name).join(", ")}
                </span>
              </div>
              <div className={styles.trackTagsInline}>
                {(draftTags[track.uri] || []).length > 0 ? (
                  <div className={styles.tagList}>
                    {draftTags[track.uri].map((tag, index) => (
                      <div
                        key={index}
                        className={styles.tagItem}
                        onClick={(e) => handleTagClickDraft(track.uri, tag, e)}
                        title="Click to toggle this tag on this track"
                      >
                        {getTagName(tag.categoryId, tag.subcategoryId, tag.tagId)}
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
                  if (onPlayTrack) onPlayTrack(track.uri);
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
          Apply tags to {lockedTrackUri ? "the locked track" : "all selected tracks"} using the tag
          selector below. {hasChanges && "Remember to save your changes!"}
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
