import { useState, useCallback, useMemo, useEffect } from "react";
import { SpotifyTrack } from "../types/SpotifyTypes";
import { TrackTag, useTagData } from "./useTagData";

export interface DraftTagState {
  [trackUri: string]: TrackTag[];
}

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
        initialDraft[track.uri] = [...(tagData.tracks[track.uri]?.tags || [])];
      });
      setMultiTrackDraftTags(initialDraft);
    }
  }, [isMultiTagging, multiTagTracks.length, tagData.tracks]);

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
    },
    [isMultiTagging, multiTrackDraftTags, lockedMultiTrackUri, multiTagTracks]
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
      return multiTrackDraftTags?.[lockedMultiTrackUri] || [];
    }
    // otherwise, highlight ALL common draft tags
    return findCommonTagsFromDraft(multiTrackDraftTags ?? {}, multiTagTracks);
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
    toggleTag,
    cancelMultiTagging,

    // Computed values
    selectedTagsForSelector,
  };
}
