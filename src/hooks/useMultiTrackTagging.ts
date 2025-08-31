import { useState, useCallback, useMemo, useEffect } from "react";
import { SpotifyTrack } from "../types/SpotifyTypes";
import { TrackData, TrackTag, useTagData } from "./useTagData";

export interface DraftTagState {
  [trackUri: string]: {
    tags: TrackTag[];
    rating?: number;
    energy?: number;
  };
}

/**
 * MULTI-TRACK TAGGING HOOK
 *
 * This hook encapsulates all state and logic related to bulk tagging operations, including:
 * - Managing multiple selected tracks for batch tagging
 * - Handling draft tag state with optimistic updates
 * - Supporting **track locking** for **individual track tagging** within bulk mode
 * - Computing common tags across selected tracks
 * - Providing tag toggle functionality for both individual and bulk operations
 *
 * The hook implements a draft system where tag changes are staged locally before being
 * committed via batch operations, allowing users to make multiple changes and save them
 * atomically or discard them entirely.
 *
 * @example
 * ```typescript
 * const {
 *   isMultiTagging,
 *   multiTagTracks,
 *   toggleTag,
 *   selectedTagsForSelector,
 *   cancelMultiTagging
 * } = useMultiTrackTagging();
 *
 * // Enter multi-tagging mode with selected tracks
 * setIsMultiTagging(true);
 * setMultiTagTracks(selectedTracks);
 *
 * // Toggle a tag for all selected tracks
 * toggleTag('genre', 'electronic', 'house');
 * ```
 *
 * @remarks
 * This hook is designed to work in conjunction with:
 * - `useTagData` for accessing global tag data and categories
 * - `MultiTrackDetails` component for UI rendering
 * - `TagSelector` component for tag selection interface
 *
 * The hook maintains referential equality for memoized values and uses `useCallback`
 * for performance optimization with large track selections.
 */
export function useMultiTrackTagging() {
  const [isMultiTagging, setIsMultiTagging] = useState<boolean>(false);
  const [lockedMultiTrackUri, setLockedMultiTrackUri] = useState<string | null>(
    null
  );
  const [multiTrackDraftTags, setMultiTrackDraftTags] =
    useState<DraftTagState | null>(null);
  const [multiTagTracks, setMultiTagTracks] = useState<SpotifyTrack[]>([]);

  // Get tag data and functions from the main tag data hook
  const { tagData } = useTagData();

  // initialize draft from current saved tags
  useEffect(() => {
    if (isMultiTagging && multiTagTracks.length > 0) {
      const initialDraft: DraftTagState = {};
      multiTagTracks.forEach((track) => {
        const trackData = tagData.tracks[track.uri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        initialDraft[track.uri] = {
          tags: [...trackData.tags],
          rating: trackData.rating,
          energy: trackData.energy,
        };
      });
      setMultiTrackDraftTags(initialDraft);
    } else if (!isMultiTagging) {
      setMultiTrackDraftTags(null);
    }
  }, [isMultiTagging, multiTagTracks.length, tagData.tracks]);

  // Helper function to find common tags from draft state
  const findCommonTagsFromDraft = useCallback(
    (draftTags: DraftTagState): TrackTag[] => {
      const trackUris = Object.keys(draftTags);

      if (trackUris.length === 0) return [];

      const firstTrackUri = trackUris[0];
      const firstTrackTags = draftTags[firstTrackUri]?.tags || [];

      if (trackUris.length === 1) return firstTrackTags;

      // go through all tags for the first track
      return firstTrackTags?.filter((tag) => {
        // for this candidate tag, check if ALL tracks ha´ve it
        return trackUris.every((uri) => {
          const currentTrackTags = draftTags[uri]?.tags || [];
          // does this track have the candidate tag?
          return currentTrackTags.some(
            (t) =>
              t.categoryId === tag.categoryId &&
              t.subcategoryId === tag.subcategoryId &&
              t.tagId === tag.tagId
          );
        });
      });
    },
    []
  );

  const findCommonStarRatingFromDraft = useCallback(
    (draftTags: DraftTagState): number | undefined => {
      const trackUris = Object.keys(draftTags);

      if (trackUris.length === 0) return undefined;

      const firstTrackUri = trackUris[0];
      const firstTrackRating = draftTags[firstTrackUri]?.rating;

      if (trackUris.length === 1) return firstTrackRating;

      const hasCommonStarRating = trackUris.every((uri) => {
        return draftTags[uri]?.rating === firstTrackRating;
      });

      return hasCommonStarRating ? firstTrackRating : undefined;
    },
    []
  );

  const findCommonEnergyRatingFromDraft = useCallback(
    (draftTags: DraftTagState): number | undefined => {
      const trackUris = Object.keys(draftTags);

      if (trackUris.length === 0) return undefined;

      const firstTrackUri = trackUris[0];
      const firstTrackEnergy = draftTags[firstTrackUri]?.energy;

      if (trackUris.length === 1) return firstTrackEnergy;

      const hasCommonEnergyRating = trackUris.every((uri) => {
        return draftTags[uri]?.energy === firstTrackEnergy;
      });

      return hasCommonEnergyRating ? firstTrackEnergy : undefined;
    },
    []
  );

  // Main tag toggle handler (ONLY for multi-track mode)
  const toggleTagMultiTrack = useCallback(
    (categoryId: string, subcategoryId: string, tagId: string) => {
      if (!isMultiTagging) {
        console.warn("toggleTag called when not in multi-tagging mode");
        return;
      }

      // When in multi-tagging mode with draft state, update the draft instead
      // Create shallow copy of the current draft state
      const newDraft: DraftTagState = { ...multiTrackDraftTags };

      if (lockedMultiTrackUri) {
        // TOGGLE FOR SINGLE TRACK
        const trackData = newDraft[lockedMultiTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        const tagIndex: number = trackData.tags.findIndex(
          (t) =>
            t.categoryId === categoryId &&
            t.subcategoryId === subcategoryId &&
            t.tagId === tagId
        );

        if (tagIndex >= 0) {
          newDraft[lockedMultiTrackUri] = {
            ...trackData,
            tags: trackData.tags.filter((_, i) => i !== tagIndex),
          };
        } else {
          newDraft[lockedMultiTrackUri] = {
            ...trackData,
            tags: [...trackData.tags, { categoryId, subcategoryId, tagId }],
          };
        }
      } else {
        // TOGGLE FOR ALL TRACKS
        // check if every single track has this particular tag
        const commonTags = findCommonTagsFromDraft(newDraft);
        const tagIsCommonToAll = commonTags.some(
          (tag) =>
            tag.categoryId === categoryId &&
            tag.subcategoryId === subcategoryId &&
            tag.tagId === tagId
        );

        // apply toggle logic based on whether tag is common to all tracks
        multiTagTracks.forEach((track) => {
          const trackData = newDraft[track.uri] || {
            tags: [],
            rating: 0,
            energy: 0,
          };
          const tagIndex = trackData.tags.findIndex(
            (t) =>
              t.categoryId === categoryId &&
              t.subcategoryId === subcategoryId &&
              t.tagId === tagId
          );

          if (tagIsCommonToAll && tagIndex >= 0) {
            // all tracks had the tag, remove it
            newDraft[track.uri].tags = trackData.tags.filter(
              (_, i) => i !== tagIndex
            );
          } else if (!tagIsCommonToAll && tagIndex < 0) {
            // not all tracks had the tag, add it to those that don't have it
            newDraft[track.uri].tags = [
              ...trackData.tags,
              { categoryId, subcategoryId, tagId },
            ];
          }
        });
      }

      setMultiTrackDraftTags(newDraft);
    },
    [isMultiTagging, multiTrackDraftTags, lockedMultiTrackUri, multiTagTracks]
  );

  const toggleStarRating = useCallback(
    (rating: number) => {
      if (!isMultiTagging) {
        console.warn("toggleStarRating called when not in multi-tagging mode");
        return;
      }

      const newDraft: DraftTagState = { ...multiTrackDraftTags };

      if (lockedMultiTrackUri) {
        // TOGGLE FOR SINGLE TRACK
        const trackData = newDraft[lockedMultiTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };

        // if clicking on the same rating, set to 0 (ie: if rating = 3.5, clicking 3.5 removes the rating)
        const newRating = trackData.rating === rating ? 0 : rating;

        newDraft[lockedMultiTrackUri] = {
          ...trackData,
          rating: newRating,
        };
      } else {
        // TOGGLE FOR ALL TRACKS
        const commonRating = findCommonStarRatingFromDraft(newDraft);

        const newRating = commonRating === rating ? 0 : rating;

        multiTagTracks.forEach((track) => {
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

      setMultiTrackDraftTags(newDraft);
    },
    [
      isMultiTagging,
      multiTrackDraftTags,
      lockedMultiTrackUri,
      multiTagTracks,
      findCommonStarRatingFromDraft,
    ]
  );

  const toggleEnergyRating = useCallback(
    (energy: number) => {
      if (!isMultiTagging || !multiTrackDraftTags) {
        console.warn(
          "toggleEnergyRating called when not in multi-tagging mode"
        );
        return;
      }

      const newDraft: DraftTagState = { ...multiTrackDraftTags };

      if (lockedMultiTrackUri) {
        // TOGGLE FOR SINGLE TRACK
        const trackData = newDraft[lockedMultiTrackUri] || {
          tags: [],
          rating: 0,
          energy: 0,
        };
        const newEnergy = trackData.energy === energy ? 0 : energy;

        newDraft[lockedMultiTrackUri] = {
          ...trackData,
          energy: newEnergy,
        };
      } else {
        // TOGGLE FOR ALL TRACKS
        const commonEnergy = findCommonEnergyRatingFromDraft(newDraft);
        const newEnergy = commonEnergy === energy ? 0 : energy;

        multiTagTracks.forEach((track) => {
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

      setMultiTrackDraftTags(newDraft);
    },
    [
      isMultiTagging,
      multiTrackDraftTags,
      lockedMultiTrackUri,
      multiTagTracks,
      findCommonEnergyRatingFromDraft,
    ]
  );

  const cancelMultiTagging = () => {
    setMultiTagTracks([]);
    setIsMultiTagging(false);
    setLockedMultiTrackUri(null);
    setMultiTrackDraftTags(null);

    // Clear any URL parameters to avoid getting back into multi-tagging mode
    if (Spicetify?.Platform?.History?.push) {
      Spicetify.Platform.History.push("/tagify");
    }
  };

  // Determine which tags to highlight in TagSelector (ONLY for multi-track mode)
  const selectedTagsForSelector = useMemo((): TrackTag[] | null => {
    // Only compute for multi-track mode
    if (!isMultiTagging) {
      return null;
    }

    // if locked track is in multi-track mode, highlight only its particular draft tags
    if (lockedMultiTrackUri) {
      return multiTrackDraftTags?.[lockedMultiTrackUri].tags || [];
    }
    // otherwise, highlight ALL common draft tags
    return findCommonTagsFromDraft(multiTrackDraftTags ?? {});
  }, [
    isMultiTagging,
    multiTrackDraftTags,
    lockedMultiTrackUri,
    multiTagTracks,
    findCommonTagsFromDraft,
  ]);

  return {
    // State
    isMultiTagging,
    lockedMultiTrackUri,
    multiTagTracks,
    multiTrackDraftTags,

    // Actions
    setIsMultiTagging,
    setMultiTagTracks,
    setLockedMultiTrackUri,
    setMultiTrackDraftTags,
    toggleTagMultiTrack,
    toggleStarRating,
    toggleEnergyRating,
    cancelMultiTagging,

    // Computed values
    selectedTagsForSelector,
    findCommonTagsFromDraft,
    findCommonStarRatingFromDraft,
    findCommonEnergyRatingFromDraft,
  };
}
