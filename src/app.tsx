import React, { useEffect, useMemo, useState } from "react";
import styles from "./app.module.css";
import "./styles/globals.css";
import TrackDetails from "./components/TrackDetails";
import TagSelector from "./components/TagSelector";
import TrackList from "./components/TrackList";
import TagManager from "./components/TagManager";
import DataManager from "./components/DataManager";
import MultiTrackDetails from "./components/MultiTrackDetails";
import LocalTracksModal from "./components/LocalTracksModal";
import { useTagData } from "./hooks/useTagData";
import { useTrackState } from "./hooks/useTrackState";
import { useFilterState } from "./hooks/useFilterState";
import { usePlaylistState } from "./hooks/usePlaylistState";
import { useFontAwesome } from "./hooks/useFontAwesome";
import { trackService } from "./services/TrackService";
import { useSpicetifyHistory } from "./hooks/useSpicetifyHistory";
import ExportPanel from "./components/ExportPanel";
import packageJson from "../package.json";
import { useUpdateChecker } from "./hooks/useUpdateChecker";
import UpdateBanner from "./components/UpdateBanner";
import { useMultiTrackTagging } from "./hooks/useMultiTrackTagging";
import { useSmartPlaylists } from "./hooks/useSmartPlaylists";
import { useTagToggle } from "./hooks/useTagToggle";

function App() {
  const [showTagManager, setShowTagManager] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);

  const {
    tagData,
    lastSaved,
    isLoading,
    toggleTagSingleTrack,
    setRating,
    setEnergy,
    setBpm,
    replaceCategories,
    exportTagData,
    importTagData,
    updateBpm,
    applyBatchTagUpdates,
    exportData,
  } = useTagData();

  const {
    syncSmartPlaylistFull,
    createSmartPlaylist,
    cleanupDeletedSmartPlaylists,
    smartPlaylists,
    setSmartPlaylists,
    exportSmartPlaylists,
    importSmartPlaylists,
  } = useSmartPlaylists({ tagData });

  const {
    activeTagFilters,
    excludedTagFilters,
    removeTagFilter,
    toggleTagIncludeExclude,
    toggleTagIncludeExcludeOff,
    toggleTagIncludeOff,
    clearTagFilters,
    createTagId,
    parseTagId,
    getTagDisplayName,
  } = useFilterState();

  const {
    showLocalTracksModal,
    setShowLocalTracksModal,
    localTracksForPlaylist,
    createdPlaylistInfo,
    createPlaylistFromFilters,
  } = usePlaylistState();

  const {
    currentlyPlayingTrack,
    setLockedTrack,
    isLocked,
    setIsLocked,
    toggleLock,
    handleSelectTrackForTagging,
    activeTrack,
  } = useTrackState();

  const {
    isMultiTagging,
    lockedMultiTrackUri,
    multiTagTracks,
    multiTrackDraftTags,
    setIsMultiTagging,
    setMultiTagTracks,
    setLockedMultiTrackUri,
    setMultiTrackDraftTags,
    cancelMultiTagging,
    selectedTagsForSelector,
    toggleTagMultiTrack,
    toggleStarRating,
    toggleEnergyRating,
  } = useMultiTrackTagging();

  // Set up history tracking and URL param handling
  useSpicetifyHistory({
    isMultiTagging,
    setIsMultiTagging,
    setMultiTagTracks,
    setLockedTrack,
    setIsLocked,
    setLockedMultiTrackUri,
  });

  const { handleToggleTag } = useTagToggle()

  const { updateInfo, dismissUpdate } = useUpdateChecker({
    currentVersion: packageJson.version,
    repoOwner: "alexk218",
    repoName: "tagify",
    checkOnMount: true,
    delayMs: 2000,
  });

  useFontAwesome();

  const playTrack = trackService.playTrack;
  const getTracksWithResolvedTags = () =>
    trackService.getTracksWithResolvedTags(tagData);

  // Hide topbar when app mounts - restore when app unmounts
  useEffect(() => {
    const topbar = document.querySelector(
      ".main-topBar-container"
    ) as HTMLElement;
    if (topbar) {
      topbar.style.visibility = "hidden";
    }

    return () => {
      const topbar = document.querySelector(
        ".main-topBar-container"
      ) as HTMLElement;
      if (topbar) {
        topbar.style.visibility = "";
      }
    };
  }, []);

  // TODO: what is this
  const trackTags = isMultiTagging
    ? selectedTagsForSelector || []
    : tagData.tracks[activeTrack?.uri || ""]?.tags || [];

  const trackDataMap = useMemo(() => {
    return Object.fromEntries(
      multiTagTracks.map((track) => [
        track.uri,
        {
          tags: tagData.tracks[track.uri]?.tags || [],
          rating: tagData.tracks[track.uri]?.rating || 0,
          energy: tagData.tracks[track.uri]?.energy || 0,
        },
      ])
    );
  }, [multiTagTracks, tagData.tracks]);

  useEffect(() => {
    // This creates a global reference for debugging in browser console
    (window as any).__TAGIFY_DEBUG__ = {
      multiTrackDraftTags,
      isMultiTagging,
      lockedMultiTrackUri,
      multiTagTracks,
      tagData,
      smartPlaylists,
      activeTagFilters,
      excludedTagFilters,
      currentlyPlayingTrack,
      activeTrack,
      selectedTagsForSelector,
      trackDataMap,
    };
  }, [
    multiTrackDraftTags,
    isMultiTagging,
    lockedMultiTrackUri,
    multiTagTracks,
    tagData,
    smartPlaylists,
    activeTagFilters,
    excludedTagFilters,
    currentlyPlayingTrack,
    activeTrack,
    selectedTagsForSelector,
    trackDataMap,
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Tagify</h1>
        </div>
      </div>

      {updateInfo?.hasUpdate && (
        <UpdateBanner updateInfo={updateInfo} onDismiss={dismissUpdate} />
      )}

      <DataManager
        onExportTagData={exportTagData}
        onImportTagData={importTagData}
        onExportRekordbox={() => setShowExport(true)}
        lastSaved={lastSaved}
      />

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <p className={styles.loadingText}>Loading tag data...</p>
        </div>
      ) : (
        <div className={styles.content}>
          {isMultiTagging &&
          multiTagTracks.length > 0 &&
          multiTrackDraftTags
           ? (
            <MultiTrackDetails
              tracks={multiTagTracks}
              trackDataMap={trackDataMap}
              categories={tagData.categories}
              onCancelTagging={cancelMultiTagging}
              onPlayTrack={playTrack}
              lockedTrackUri={lockedMultiTrackUri}
              onLockTrack={setLockedMultiTrackUri}
              multiTrackDraftTags={multiTrackDraftTags}
              onSetMultiTrackDraftTags={setMultiTrackDraftTags}
              onBatchUpdate={applyBatchTagUpdates}
            />
          ) : (
            activeTrack && (
              <TrackDetails
                displayedTrack={activeTrack}
                currentlyPlayingTrack={currentlyPlayingTrack}
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
                  toggleTagSingleTrack(
                    activeTrack.uri,
                    categoryId,
                    subcategoryId,
                    tagId
                  )
                }
                onToggleTagIncludeOff={toggleTagIncludeOff}
                onPlayTrack={playTrack}
                isLocked={isLocked}
                onToggleLock={toggleLock}
                onSwitchToCurrentTrack={setLockedTrack}
                onUpdateBpm={updateBpm}
                createTagId={createTagId}
              />
            )
          )}

          {(activeTrack || (isMultiTagging && multiTagTracks.length > 0)) && (
            <TagSelector
              categories={tagData.categories}
              trackTags={trackTags}
              onToggleTag={handleToggleTag}
              onOpenTagManager={() => setShowTagManager(true)}
              isMultiTagging={isMultiTagging}
              isLockedTrack={!!lockedMultiTrackUri}
            />
          )}
          <TrackList
            tracks={getTracksWithResolvedTags()}
            categories={tagData.categories}
            activeTagFilters={activeTagFilters}
            excludedTagFilters={excludedTagFilters}
            activeTrackUri={activeTrack?.uri || null}
            onRemoveTagFilter={removeTagFilter}
            onToggleTagIncludeExclude={toggleTagIncludeExclude}
            onToggleTagIncludeExcludeOff={toggleTagIncludeExcludeOff} // ON OFF EXCLUDE
            onToggleTagIncludeOff={toggleTagIncludeOff} // ON OFF
            onClearTagFilters={clearTagFilters}
            onPlayTrack={playTrack}
            onTagTrack={handleSelectTrackForTagging}
            onCreatePlaylist={createPlaylistFromFilters}
            onCreateSmartPlaylist={createSmartPlaylist}
            parseTagId={parseTagId}
            smartPlaylists={smartPlaylists}
            onSetSmartPlaylists={setSmartPlaylists}
            onSyncPlaylist={syncSmartPlaylistFull}
            onCleanupDeletedSmartPlaylists={cleanupDeletedSmartPlaylists}
            onExportSmartPlaylists={exportSmartPlaylists}
            onImportSmartPlaylists={importSmartPlaylists}
          />
        </div>
      )}
      {showTagManager && (
        <TagManager
          categories={tagData.categories}
          onClose={() => setShowTagManager(false)}
          onReplaceCategories={replaceCategories}
        />
      )}

      {showExport && (
        <ExportPanel data={exportData()} onClose={() => setShowExport(false)} />
      )}

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
