import React, { useEffect, useState } from "react";
import styles from "./app.module.css";
import "./styles/globals.css";
import TrackDetails from "./components/TrackDetails";
import TagSelector from "./components/TagSelector";
import TrackList from "./components/TrackList";
import TagManager from "./components/TagManager";
import DataManager from "./components/DataManager";
import MultiTrackDetails, { DraftTagState } from "./components/MultiTrackDetails";
import LocalTracksModal from "./components/LocalTracksModal";
import { TrackTag, useTagData } from "./hooks/useTagData";
import { useTrackState } from "./hooks/useTrackState";
import { useFilterState } from "./hooks/useFilterState";
import { usePlaylistState } from "./hooks/usePlaylistState";
import { useFontAwesome } from "./hooks/useFontAwesome";
// import { checkAndUpdateCacheIfNeeded } from "./utils/PlaylistCache";
import { trackService } from "./services/TrackService";
import { useSpicetifyHistory } from "./hooks/useSpicetifyHistory";
import { SpotifyTrack } from "./types/SpotifyTypes";
import ExportPanel from "./components/ExportPanel";

function App() {
  const [showTagManager, setShowTagManager] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [isMultiTagging, setIsMultiTagging] = useState<boolean>(false);
  const [lockedMultiTrackUri, setLockedMultiTrackUri] = useState<string | null>(null);

  const [multiTrackDraftTags, setMultiTrackDraftTags] = useState<DraftTagState | null>(null);
  const [multiTagTracks, setMultiTagTracks] = useState<SpotifyTrack[]>([]);

  const {
    tagData,
    lastSaved,
    isLoading,
    toggleTagForTrack,
    setRating,
    setEnergy,
    setBpm,
    toggleTagForMultipleTracks,
    replaceCategories,
    exportBackup,
    importBackup,
    findCommonTags,
    updateBpm,
    applyBatchTagUpdates,
    exportData,
  } = useTagData();

  const {
    activeTagFilters,
    excludedTagFilters,
    handleRemoveFilter,
    handleToggleFilterType,
    onFilterByTag,
    onFilterByTagOnOff,
    clearTagFilters,
  } = useFilterState();

  const {
    showLocalTracksModal,
    setShowLocalTracksModal,
    localTracksForPlaylist,
    createdPlaylistInfo,
    createPlaylistFromFilters,
  } = usePlaylistState();

  const {
    currentTrack,
    setLockedTrack,
    isLocked,
    setIsLocked,
    toggleLock,
    handleTagTrack,
    cancelMultiTagging,
    activeTrack,
  } = useTrackState({ setMultiTagTracks, setIsMultiTagging, setLockedMultiTrackUri });

  // Set up history tracking and URL param handling
  useSpicetifyHistory({
    isMultiTagging,
    setIsMultiTagging,
    setMultiTagTracks,
    setLockedTrack,
    setIsLocked,
    setLockedMultiTrackUri,
  });

  useFontAwesome();

  // Check playlist cache on mount
  // useEffect(() => {
  //   checkAndUpdateCacheIfNeeded().catch((error) => {
  //     console.error("Error checking/updating playlist cache:", error);
  //   });
  // }, []);

  const playTrackViaQueue = trackService.playTrackViaQueue;
  const getLegacyFormatTracks = () => trackService.getLegacyFormatTracksFromTagData(tagData);

  // Hide topbar when app mounts - restore when app unmounts
  useEffect(() => {
    const topbar = document.querySelector(".main-topBar-background") as HTMLElement;
    if (topbar) {
      topbar.style.display = "none";
    }

    return () => {
      const topbar = document.querySelector(".main-topBar-background") as HTMLElement;
      if (topbar) {
        topbar.style.display = "";
      }
    };
  }, []);

  const findCommonTagsFromDraft = (
    draftTags: DraftTagState,
    tracks: SpotifyTrack[]
  ): TrackTag[] => {
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

  // Render appropriate UI based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Loading tag data...</p>
        </div>
      );
    }

    return (
      <div className={styles.content}>
        {isMultiTagging && multiTagTracks.length > 0 ? (
          <MultiTrackDetails
            tracks={multiTagTracks}
            trackTagsMap={Object.fromEntries(
              multiTagTracks.map((track) => [track.uri, tagData.tracks[track.uri]?.tags || []])
            )}
            categories={tagData.categories}
            onTagAllTracks={handleTagAllTracks}
            onTagSingleTrack={toggleTagForSingleTrack}
            onCancelTagging={() => {
              setMultiTrackDraftTags(null);
              cancelMultiTagging();
            }}
            onPlayTrack={playTrackViaQueue}
            lockedTrackUri={lockedMultiTrackUri}
            onLockTrack={setLockedMultiTrackUri}
            draftTags={multiTrackDraftTags}
            onDraftTagsChange={setMultiTrackDraftTags}
            onBatchUpdate={applyBatchTagUpdates}
          />
        ) : (
          activeTrack && (
            <TrackDetails
              track={activeTrack}
              trackData={
                tagData.tracks[activeTrack.uri] || {
                  rating: 0,
                  energy: 0,
                  bpm: null,
                  tags: [],
                }
              }
              categories={tagData.categories}
              activeTagFilters={activeTagFilters}
              excludedTagFilters={excludedTagFilters}
              onSetRating={(rating) => setRating(activeTrack.uri, rating)}
              onSetEnergy={(energy) => setEnergy(activeTrack.uri, energy)}
              onSetBpm={(bpm) => setBpm(activeTrack.uri, bpm)}
              onRemoveTag={(categoryId, subcategoryId, tagId) =>
                toggleTagForTrack(activeTrack.uri, categoryId, subcategoryId, tagId)
              }
              onFilterByTagOnOff={onFilterByTagOnOff}
              onFilterByTag={onFilterByTag}
              onPlayTrack={playTrackViaQueue}
              isLocked={isLocked}
              onToggleLock={toggleLock}
              currentTrack={currentTrack}
              onSwitchToCurrentTrack={setLockedTrack}
              onUpdateBpm={updateBpm}
            />
          )
        )}

        {renderTagSelector()}

        <TrackList
          tracks={getLegacyFormatTracks()}
          categories={tagData.categories}
          activeTagFilters={activeTagFilters}
          excludedTagFilters={excludedTagFilters}
          activeTrackUri={activeTrack?.uri || null}
          onFilterByTag={onFilterByTag}
          onRemoveFilter={handleRemoveFilter}
          onToggleFilterType={handleToggleFilterType}
          onTrackListTagClick={onFilterByTagOnOff}
          onClearTagFilters={clearTagFilters}
          onPlayTrack={playTrackViaQueue}
          onTagTrack={handleTagTrack}
          onCreatePlaylist={createPlaylistFromFilters}
        />
      </div>
    );
  };

  // Render the tag selector conditionally
  const renderTagSelector = () => {
    if (!activeTrack && !(isMultiTagging && multiTagTracks.length > 0)) {
      return null;
    }

    return (
      <TagSelector
        track={
          isMultiTagging && lockedMultiTrackUri
            ? multiTagTracks.find((t) => t.uri === lockedMultiTrackUri) || multiTagTracks[0]
            : activeTrack || multiTagTracks[0]
        }
        categories={tagData.categories}
        trackTags={
          isMultiTagging && multiTrackDraftTags
            ? lockedMultiTrackUri
              ? multiTrackDraftTags[lockedMultiTrackUri] || []
              : findCommonTagsFromDraft(multiTrackDraftTags, multiTagTracks)
            : isMultiTagging
            ? lockedMultiTrackUri
              ? tagData.tracks[lockedMultiTrackUri]?.tags || []
              : findCommonTags(multiTagTracks.map((track) => track.uri))
            : tagData.tracks[activeTrack?.uri || ""]?.tags || []
        }
        onToggleTag={handleToggleTag}
        onOpenTagManager={() => setShowTagManager(true)}
        isMultiTagging={isMultiTagging}
        isLockedTrack={!!lockedMultiTrackUri}
      />
    );
  };

  const handleToggleTag = (categoryId: string, subcategoryId: string, tagId: string) => {
    if (isMultiTagging && multiTrackDraftTags) {
      // When in multi-tagging mode with draft state, update the draft instead
      const newDraft = { ...multiTrackDraftTags };

      if (lockedMultiTrackUri) {
        // Toggle for single track
        const trackTags = newDraft[lockedMultiTrackUri] || [];
        const tagIndex = trackTags.findIndex(
          (t) =>
            t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
        );

        if (tagIndex >= 0) {
          newDraft[lockedMultiTrackUri] = trackTags.filter((_, i) => i !== tagIndex);
        } else {
          newDraft[lockedMultiTrackUri] = [...trackTags, { categoryId, subcategoryId, tagId }];
        }
      } else {
        // Toggle for all tracks
        const allHaveTag = multiTagTracks.every((track) => {
          const tags = newDraft[track.uri] || [];
          return tags.some(
            (t) =>
              t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
          );
        });

        multiTagTracks.forEach((track) => {
          const trackTags = newDraft[track.uri] || [];
          const tagIndex = trackTags.findIndex(
            (t) =>
              t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.tagId === tagId
          );

          if (allHaveTag && tagIndex >= 0) {
            newDraft[track.uri] = trackTags.filter((_, i) => i !== tagIndex);
          } else if (!allHaveTag && tagIndex < 0) {
            newDraft[track.uri] = [...trackTags, { categoryId, subcategoryId, tagId }];
          }
        });
      }

      setMultiTrackDraftTags(newDraft);
    } else if (isMultiTagging) {
      // Original multi-tagging logic without draft
      if (lockedMultiTrackUri) {
        toggleTagForSingleTrack(lockedMultiTrackUri, categoryId, subcategoryId, tagId);
      } else {
        handleTagAllTracks(categoryId, subcategoryId, tagId);
      }
    } else if (activeTrack) {
      // Single track mode
      toggleTagForTrack(activeTrack.uri, categoryId, subcategoryId, tagId);
    }
  };

  // Handler for toggling a tag on a single track
  const toggleTagForSingleTrack = (
    trackUri: string,
    categoryId: string,
    subcategoryId: string,
    tagId: string
  ) => {
    toggleTagForTrack(trackUri, categoryId, subcategoryId, tagId);
  };

  // Handler for toggling a tag on all tracks
  const handleTagAllTracks = (categoryId: string, subcategoryId: string, tagId: string) => {
    // Use the batch update function to apply to all selected tracks
    toggleTagForMultipleTracks(
      multiTagTracks.map((track) => track.uri),
      categoryId,
      subcategoryId,
      tagId
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Tagify</h1>
        </div>
      </div>

      <DataManager
        onExportBackup={exportBackup}
        onImportBackup={importBackup}
        onExportRekordbox={() => setShowExport(true)}
        lastSaved={lastSaved}
      />

      {renderContent()}

      {showTagManager && (
        <TagManager
          categories={tagData.categories}
          onClose={() => setShowTagManager(false)}
          onReplaceCategories={replaceCategories}
        />
      )}

      {showExport && <ExportPanel data={exportData()} onClose={() => setShowExport(false)} />}

      {showLocalTracksModal && (
        <LocalTracksModal
          localTracks={localTracksForPlaylist}
          playlistName={createdPlaylistInfo.name}
          playlistId={createdPlaylistInfo.id}
          onClose={() => setShowLocalTracksModal(false)}
        />
      )}
    </div>
  );
}

export default App;
