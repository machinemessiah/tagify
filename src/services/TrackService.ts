import { TagDataStructure } from "../hooks/useTagData";

class TrackService {
  playTrackViaQueue = (uri: string): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // Special handling for local files
        if (uri.startsWith("spotify:local:")) {
          // Format for queue API
          const trackObject = [{ uri }];

          // Check if Player is currently playing music
          const isPlaying = Spicetify.Player.isPlaying();

          if (isPlaying) {
            // Add track to queue and skip to it
            Spicetify.addToQueue(trackObject)
              .then(() => {
                // Need to wait a moment for queue to update
                setTimeout(() => {
                  Spicetify.Player.next();
                  resolve(true);
                }, 300);
              })
              .catch((err) => {
                console.error("Failed to add local file to queue:", err);
                // Navigate to Local Files as fallback
                Spicetify.Platform.History.push("/collection/local-files");
                Spicetify.showNotification(
                  "Local files must be played from Local Files section",
                  true
                );
                resolve(false);
              });
          } else {
            // If nothing is playing, try direct playback first
            Spicetify.Player.playUri(uri)
              .then(() => {
                resolve(true);
              })
              .catch((err) => {
                console.error("Failed to play local file directly:", err);
                // Navigate to Local Files as fallback
                Spicetify.Platform.History.push("/collection/local-files");
                Spicetify.showNotification(
                  "Local files must be played from Local Files section",
                  true
                );
                resolve(false);
              });
          }
        } else {
          // Regular Spotify track handling
          const isPlaying = Spicetify.Player.isPlaying();

          if (isPlaying) {
            try {
              // Add track to top of queue
              const trackObject = [{ uri }];

              // Queue access approach that should work
              const queue = Spicetify.Queue;

              if (queue && queue.nextTracks && queue.nextTracks.length > 0) {
                // Queue has tracks, try to insert our track at the beginning
                Spicetify.addToQueue(trackObject)
                  .then(() => {
                    // After adding to queue, play next
                    Spicetify.Player.next();
                    resolve(true);
                  })
                  .catch((err) => {
                    console.error("Failed to add to queue", err);
                    Spicetify.showNotification("Unable to play track, playing directly", true);

                    // Fallback to direct play
                    Spicetify.Player.playUri(uri)
                      .then(() => resolve(true))
                      .catch((playErr) => {
                        console.error("Failed to play directly:", playErr);
                        resolve(false);
                      });
                  });
              } else {
                // Queue is empty, simply add to queue and skip
                Spicetify.addToQueue(trackObject)
                  .then(() => {
                    Spicetify.Player.next();
                    resolve(true);
                  })
                  .catch((err) => {
                    console.error("Failed to add to queue", err);
                    Spicetify.showNotification("Unable to play track, playing directly", true);

                    // Fallback to direct play
                    Spicetify.Player.playUri(uri)
                      .then(() => resolve(true))
                      .catch((playErr) => {
                        console.error("Failed to play directly:", playErr);
                        resolve(false);
                      });
                  });
              }
            } catch (error) {
              console.error("Error manipulating queue:", error);

              // Fallback to direct play
              Spicetify.Player.playUri(uri)
                .then(() => resolve(true))
                .catch((playErr) => {
                  console.error("Failed to play directly:", playErr);
                  resolve(false);
                });
            }
          } else {
            // No music playing, just play the track directly
            Spicetify.Player.playUri(uri)
              .then(() => resolve(true))
              .catch((err) => {
                console.error("Failed to play track:", err);
                resolve(false);
              });
          }
        }
      } catch (error) {
        console.error("Error in playTrackViaQueue:", error);
        resolve(false);
      }
    });
  };

  /**
   * Plays a collection of track URIs, handling mixed collections with local files
   */
  playAllFilteredTracks = async (trackUris: string[]): Promise<void> => {
    if (trackUris.length === 0) {
      Spicetify.showNotification("No playable tracks match the filters", true);
      return;
    }

    const spotifyTrackUris: string[] = trackUris.filter((uri) => !uri.startsWith("spotify:local:"));
    const isMixedTrackCollection: boolean = trackUris.some((uri) =>
      uri.startsWith("spotify:local:")
    );
    if (isMixedTrackCollection) {
      await this.playMixedTrackCollection(trackUris, spotifyTrackUris);
    } else {
      await this.playSpotifyOnlyCollection(spotifyTrackUris);
    }
  };

  /**
   * When filtered tracks are only Spotify tracks (no Local Files) - simple approach
   */
  private playSpotifyOnlyCollection = async (spotifyTrackUris: string[]): Promise<void> => {
    try {
      await Spicetify.Player.playUri(spotifyTrackUris[0]);

      const remainingTracks = [...spotifyTrackUris.slice(1)];
      const tracksToQueue = remainingTracks.map((uri) => ({ uri }));

      await Spicetify.addToQueue(tracksToQueue);
      Spicetify.showNotification(`Playing ${spotifyTrackUris.length} tracks`);
    } catch (error) {
      console.error("Error playing tracks:", error);
      Spicetify.showNotification("Failed to start playback", true);
    }
  };

  /**
   * When filtered tracks (Play All) contains Local Files
   * Requires more complex approach (cannot play a Local File directly, must queue)
   */
  private playMixedTrackCollection = async (
    allTrackUris: string[],
    spotifyTrackUris: string[]
  ): Promise<void> => {
    try {
      // Get a dummy track URI (this will be played solely to clear the track queue)
      const dummyUri =
        spotifyTrackUris.length > 0 ? spotifyTrackUris[0] : await this.getDummyTrackUri();

      await this.clearQueueWithDummyTrack(dummyUri);

      await this.queueAndStartPlayback(allTrackUris, dummyUri);

      Spicetify.showNotification(`Playing ${allTrackUris.length} tracks`);
    } catch (error) {
      console.error("Error playing tracks:", error);
      Spicetify.showNotification("Failed to start playback", true);
    }
  };

  private clearQueueWithDummyTrack = async (dummyUri: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await Spicetify.Player.playUri(dummyUri);

    await new Promise((resolve) => setTimeout(resolve, 300));
    await Spicetify.Player.playUri(dummyUri); // Play again to force clear

    await this.waitForSpecificTrack(dummyUri);
  };

  private queueAndStartPlayback = async (trackUris: string[], dummyUri: string): Promise<void> => {
    const tracksToQueue = trackUris.map((uri) => ({ uri }));
    await Spicetify.addToQueue(tracksToQueue);

    // Skip first track queue
    Spicetify.Player.next();
    await new Promise((resolve) => setTimeout(resolve, 200));

    const playerData: Spicetify.PlayerState = Spicetify.Player.data;

    const currentUri = playerData.item?.uri;
    if (currentUri === dummyUri) {
      Spicetify.Player.next();
    }
  };

  private getDummyTrackUri = async (): Promise<string> => {
    try {
      // Get a track from the user's saved tracks
      const response = await Spicetify.CosmosAsync.get(
        "https://api.spotify.com/v1/me/tracks?limit=1"
      );
      if (response?.items?.[0]?.track?.uri) {
        return response.items[0].track.uri;
      }
      // Fallback - Never Gonna Give You Up - Rick Astley
      return "spotify:track:4iV5W9uYEdYUVa79Axb7Rh";
    } catch (error) {
      console.error("Error getting dummy track:", error);
      return "spotify:track:4iV5W9uYEdYUVa79Axb7Rh";
    }
  };

  private waitForSpecificTrack = (expectedUri: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const maxAttempts = 30; // 3 seconds max wait
      let attempts = 0;
      const checkPlayback = () => {
        attempts++;
        // Check if we're playing and get the current track
        if (Spicetify.Player.isPlaying() && Spicetify.Player.data) {
          const playerData: Spicetify.PlayerState = Spicetify.Player.data;
          const currentUri = playerData.item?.uri;
          if (currentUri === expectedUri) {
            resolve();
            return;
          }
        }
        // Timeout after max attempts
        if (attempts >= maxAttempts) {
          reject(new Error(`Timeout waiting for track ${expectedUri} to play`));
          return;
        }
        setTimeout(checkPlayback, 100);
      };
      checkPlayback();
    });
  };

  // Resolves tag IDs to display names - to be consumed by TrackList
  getTracksWithResolvedTags = (tagData: TagDataStructure) => {
    const trackMapWithResolvedTags: {
      [uri: string]: {
        rating: number;
        energy: number;
        bpm: number | null;
        tagIds: { tagId: string }[];
        dateCreated?: number;
        dateModified?: number;
      };
    } = {};

    try {
      if (!tagData || typeof tagData !== "object") {
        console.error("TagData is invalid", tagData);
        return {};
      }

      if (!tagData.categories || !Array.isArray(tagData.categories)) {
        console.error("TagData is missing valid categories array", tagData.categories);
        return {};
      }

      if (!tagData.tracks || typeof tagData.tracks !== "object") {
        console.error("TagData is missing valid tracks object", tagData.tracks);
        return {};
      }

      // Process each track
      Object.entries(tagData.tracks).forEach(([trackUri, trackData]) => {
        if (!trackData) return;

        if (trackData.rating === 0 && trackData.energy === 0 && (!trackData.tags || trackData.tags.length === 0)) {
          return;
        }

        // Create entry for this track
        trackMapWithResolvedTags[trackUri] = {
          rating: trackData.rating || 0,
          energy: trackData.energy || 0,
          bpm: trackData.bpm || null,
          tagIds: [],
          dateCreated: trackData.dateCreated,
          dateModified: trackData.dateModified,
        };

        if (!trackData.tags || !Array.isArray(trackData.tags) || trackData.tags.length === 0) {
          return;
        }

        // Process each tag
        trackData.tags.forEach((tag) => {
          const category = tagData.categories.find((c) => c.id === tag.categoryId);
          if (!category) return;

          const subcategory = category.subcategories.find((s) => s.id === tag.subcategoryId);
          if (!subcategory) return;

          const tagObj = subcategory.tags.find((t) => t.id === tag.tagId);
          if (!tagObj) return;

          trackMapWithResolvedTags[trackUri].tagIds.push({
            tagId: tagObj.name,
          });
        });
      });

      return trackMapWithResolvedTags;
    } catch (error) {
      console.error("Error formatting track data:", error);
      return {}; // Return empty object on error
    }
  };
}

export const trackService = new TrackService();
