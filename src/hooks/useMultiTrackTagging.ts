import { useState, useCallback, useMemo } from "react";
import { SpotifyTrack } from "../types/SpotifyTypes";
import { TrackTag, useTagData } from "./useTagData";

export interface DraftTagState {
  [trackUri: string]: TrackTag[];
}

interface UseMultiTrackTaggingReturn {
  // State
  isMultiTagging: boolean;
  lockedMultiTrackUri: string | null;
  multiTagTracks: SpotifyTrack[];
  multiTrackDraftTags: DraftTagState | null;

  // Actions
  setIsMultiTagging: (value: boolean) => void;
  setMultiTagTracks: (tracks: SpotifyTrack[]) => void;
  setLockedMultiTrackUri: (uri: string | null) => void;
  setMultiTrackDraftTags: (draftTags: DraftTagState | null) => void;
  toggleTag: (categoryId: string, subcategoryId: string, tagId: string) => void;
  cancelMultiTagging: () => void;

  // Computed values for component props
  displayTrack: SpotifyTrack | null;
  displayTrackTags: TrackTag[] | null; // null when not in multi-tagging mode

  // Handlers for components
  handleTagAllTracks: (
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => void;
  handleTagSingleTrack: (
    trackUri: string,
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => void;
}

export function useMultiTrackTagging(): UseMultiTrackTaggingReturn {
  // State
  const [isMultiTagging, setIsMultiTagging] = useState<boolean>(false);
  const [lockedMultiTrackUri, setLockedMultiTrackUri] = useState<string | null>(
    null
  );
  const [multiTrackDraftTags, setMultiTrackDraftTags] =
    useState<DraftTagState | null>(null);
  const [multiTagTracks, setMultiTagTracks] = useState<SpotifyTrack[]>([]);

  // Get tag data and functions from the main tag data hook
  const {
    tagData,
    toggleTagForTrack,
    toggleTagForMultipleTracks,
    findCommonTags,
  } = useTagData();

  // Helper function to find common tags from draft state
  const findCommonTagsFromDraft = useCallback(
    (draftTags: DraftTagState, tracks: SpotifyTrack[]): TrackTag[] => {
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
    },
    []
  );

  // Main tag toggle handler (ONLY for multi-track mode)
  const toggleTag = useCallback(
    (categoryId: string, subcategoryId: string, tagId: string) => {
      if (!isMultiTagging) {
        console.warn("toggleTag called when not in multi-tagging mode");
        return;
      }

      if (multiTrackDraftTags) {
        // When in multi-tagging mode with draft state, update the draft instead
        const newDraft: DraftTagState = { ...multiTrackDraftTags };

        if (lockedMultiTrackUri) {
          // Toggle for single track
          const trackTags = newDraft[lockedMultiTrackUri] || [];
          const tagIndex: number = trackTags.findIndex(
            (t) =>
              t.categoryId === categoryId &&
              t.subcategoryId === subcategoryId &&
              t.tagId === tagId
          );

          if (tagIndex >= 0) {
            newDraft[lockedMultiTrackUri] = trackTags.filter(
              (_, i) => i !== tagIndex
            );
          } else {
            newDraft[lockedMultiTrackUri] = [
              ...trackTags,
              { categoryId, subcategoryId, tagId },
            ];
          }
        } else {
          // Toggle for all tracks
          const allHaveTag = multiTagTracks.every((track) => {
            const tags = newDraft[track.uri] || [];
            return tags.some(
              (t) =>
                t.categoryId === categoryId &&
                t.subcategoryId === subcategoryId &&
                t.tagId === tagId
            );
          });

          multiTagTracks.forEach((track) => {
            const trackTags = newDraft[track.uri] || [];
            const tagIndex = trackTags.findIndex(
              (t) =>
                t.categoryId === categoryId &&
                t.subcategoryId === subcategoryId &&
                t.tagId === tagId
            );

            if (allHaveTag && tagIndex >= 0) {
              newDraft[track.uri] = trackTags.filter((_, i) => i !== tagIndex);
            } else if (!allHaveTag && tagIndex < 0) {
              newDraft[track.uri] = [
                ...trackTags,
                { categoryId, subcategoryId, tagId },
              ];
            }
          });
        }

        setMultiTrackDraftTags(newDraft);
      } else {
        // Original multi-tagging logic without draft
        if (lockedMultiTrackUri) {
          handleTagSingleTrack(
            lockedMultiTrackUri,
            categoryId,
            subcategoryId,
            tagId
          );
        } else {
          handleTagAllTracks(categoryId, subcategoryId, tagId);
        }
      }
    },
    [isMultiTagging, multiTrackDraftTags, lockedMultiTrackUri, multiTagTracks]
  );

  // Handler for toggling a tag on a single track
  const handleTagSingleTrack = useCallback(
    (
      trackUri: string,
      categoryId: string,
      subcategoryId: string,
      tagId: string
    ) => {
      toggleTagForTrack(trackUri, categoryId, subcategoryId, tagId);
    },
    [toggleTagForTrack]
  );

  // Handler for toggling a tag on all tracks
  const handleTagAllTracks = useCallback(
    (categoryId: string, subcategoryId: string, tagId: string) => {
      // Use the batch update function to apply to all selected tracks
      toggleTagForMultipleTracks(
        multiTagTracks.map((track) => track.uri),
        categoryId,
        subcategoryId,
        tagId
      );
    },
    [multiTagTracks, toggleTagForMultipleTracks]
  );

  // Cancel multi-tagging mode
  const cancelMultiTagging = useCallback(() => {
    setMultiTagTracks([]);
    setIsMultiTagging(false);
    setLockedMultiTrackUri(null);
    setMultiTrackDraftTags(null);

    // Clear any URL parameters to avoid getting back into multi-tagging mode
    if (Spicetify?.Platform?.History?.push) {
      Spicetify.Platform.History.push("/tagify");
    }
  }, []);

  // Computed value: determine which track to display (ONLY for multi-track mode)
  const displayTrack = useMemo((): SpotifyTrack | null => {
    // Only compute for multi-track mode
    if (!isMultiTagging) {
      return null;
    }

    if (lockedMultiTrackUri) {
      return (
        multiTagTracks.find((t) => t.uri === lockedMultiTrackUri) ||
        multiTagTracks[0]
      );
    }
    return multiTagTracks[0] || null;
  }, [isMultiTagging, lockedMultiTrackUri, multiTagTracks]);

  // Computed value: determine which tags to display (ONLY for multi-track mode)
  const displayTrackTags = useMemo((): TrackTag[] | null => {
    // Only compute for multi-track mode
    if (!isMultiTagging) {
      return null;
    }

    if (multiTrackDraftTags) {
      if (lockedMultiTrackUri) {
        return multiTrackDraftTags[lockedMultiTrackUri] || [];
      }
      return findCommonTagsFromDraft(multiTrackDraftTags, multiTagTracks);
    }

    if (lockedMultiTrackUri) {
      return tagData.tracks[lockedMultiTrackUri]?.tags || [];
    }
    return findCommonTags(multiTagTracks.map((track) => track.uri));
  }, [
    isMultiTagging,
    multiTrackDraftTags,
    lockedMultiTrackUri,
    multiTagTracks,
    tagData.tracks,
    findCommonTagsFromDraft,
    findCommonTags,
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
    toggleTag,
    cancelMultiTagging,

    // Computed values
    displayTrack,
    displayTrackTags,

    // Handlers for components
    handleTagAllTracks,
    handleTagSingleTrack,
  };
}
