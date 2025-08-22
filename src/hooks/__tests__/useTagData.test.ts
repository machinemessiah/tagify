import { useTagData, SmartPlaylistCriteria, TrackData } from "../useTagData";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { spotifyApiService } from "../../services/SpotifyApiService";

// Mock the SpotifyApiService
vi.mock("../../services/SpotifyApiService", () => ({
  spotifyApiService: {
    addTrackToSpotifyPlaylist: vi.fn(),
    removeTrackFromPlaylist: vi.fn(),
    getAllTrackUrisInPlaylist: vi.fn(),
  },
}));

describe("useTagData - Smart Playlist Logic", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Smart Playlist Criteria Evaluation", () => {
    it("should evaluate track matches criteria with tag filters", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [
          { categoryId: "genre", subcategoryId: "electronic", tagId: "house" },
          { categoryId: "mood", subcategoryId: "energy", tagId: "uplifting" },
        ],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
        excludedTagFilters: [],
        ratingFilters: [],
        energyMinFilter: null,
        energyMaxFilter: null,
        bpmMinFilter: null,
        bpmMaxFilter: null,
        isOrFilterMode: false,
      };

      // Access the internal function (you may need to expose this for testing)
      const matches = result.current.evaluateTrackMatchesCriteria(trackData, criteria);
      expect(matches).toBe(true);
    });

    it("should evaluate track does not match excluded tags", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [],
        excludedTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
        ratingFilters: [],
        energyMinFilter: null,
        energyMaxFilter: null,
        bpmMinFilter: null,
        bpmMaxFilter: null,
        isOrFilterMode: false,
      };

      const matches = result.current.evaluateTrackMatchesCriteria(trackData, criteria);
      expect(matches).toBe(false);
    });

    it("should evaluate rating filters correctly", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [],
        excludedTagFilters: [],
        ratingFilters: [4, 5],
        energyMinFilter: null,
        energyMaxFilter: null,
        bpmMinFilter: null,
        bpmMaxFilter: null,
        isOrFilterMode: false,
      };

      const matches = result.current.evaluateTrackMatchesCriteria?.(trackData, criteria);
      expect(matches).toBe(true);
    });

    it("should evaluate energy range filters correctly", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [],
        excludedTagFilters: [],
        ratingFilters: [],
        energyMinFilter: 5,
        energyMaxFilter: 8,
        bpmMinFilter: null,
        bpmMaxFilter: null,
        isOrFilterMode: false,
      };

      const matches = result.current.evaluateTrackMatchesCriteria?.(trackData, criteria);
      expect(matches).toBe(true);
    });

    it("should evaluate BPM range filters correctly", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [],
        excludedTagFilters: [],
        ratingFilters: [],
        energyMinFilter: null,
        energyMaxFilter: null,
        bpmMinFilter: 120,
        bpmMaxFilter: 130,
        isOrFilterMode: false,
      };

      const matches = result.current.evaluateTrackMatchesCriteria?.(trackData, criteria);
      expect(matches).toBe(true);
    });

    it("should handle OR mode for tag filters", () => {
      const { result } = renderHook(() => useTagData());

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      const criteria: SmartPlaylistCriteria["criteria"] = {
        activeTagFilters: [
          { categoryId: "genre", subcategoryId: "electronic", tagId: "house" },
          { categoryId: "genre", subcategoryId: "rock", tagId: "alternative" },
        ],
        excludedTagFilters: [],
        ratingFilters: [],
        energyMinFilter: null,
        energyMaxFilter: null,
        bpmMinFilter: null,
        bpmMaxFilter: null,
        isOrFilterMode: true,
      };

      const matches = result.current.evaluateTrackMatchesCriteria?.(trackData, criteria);
      expect(matches).toBe(true);
    });
  });

  describe("Smart Playlist Storage", () => {
    it("should store smart playlist criteria to localStorage", async () => {
      const { result } = renderHook(() => useTagData());

      const smartPlaylistCriteria: SmartPlaylistCriteria = {
        playlistId: "test-playlist-id",
        playlistName: "Test Smart Playlist",
        isActive: true,
        smartPlaylistTrackUris: [],
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
        criteria: {
          activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
          excludedTagFilters: [],
          ratingFilters: [4, 5],
          energyMinFilter: 5,
          energyMaxFilter: null,
          bpmMinFilter: null,
          bpmMaxFilter: null,
          isOrFilterMode: false,
        },
      };

      act(() => {
        result.current.storeSmartPlaylist(smartPlaylistCriteria);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        "tagify:smartPlaylists",
        expect.stringContaining("test-playlist-id")
      );
    });

    it("should load smart playlists from localStorage on mount", () => {
      const mockSmartPlaylists = [
        {
          playlistId: "test-playlist-id",
          playlistName: "Test Smart Playlist",
          isActive: true,
          smartPlaylistTrackUris: [],
          lastSyncAt: Date.now(),
          criteria: {
            activeTagFilters: [],
            excludedTagFilters: [],
            ratingFilters: [],
            energyMinFilter: null,
            energyMaxFilter: null,
            bpmMinFilter: null,
            bpmMaxFilter: null,
            isOrFilterMode: false,
          },
        },
      ];

      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(mockSmartPlaylists));

      const { result } = renderHook(() => useTagData());

      expect(result.current.smartPlaylists).toHaveLength(1);
      expect(result.current.smartPlaylists[0].playlistId).toBe("test-playlist-id");
    });
  });

  describe("Smart Playlist Sync Operations", () => {
    it("should sync single track addition to smart playlist", async () => {
      // Mock Spotify API responses
      const mockAddResult = { success: true, wasAdded: true };
      vi.mocked(spotifyApiService.addTrackToSpotifyPlaylist).mockResolvedValue(mockAddResult);

      const { result } = renderHook(() => useTagData());

      // Set up initial state with a smart playlist
      const smartPlaylist: SmartPlaylistCriteria = {
        playlistId: "test-playlist",
        playlistName: "Test Playlist",
        isActive: true,
        smartPlaylistTrackUris: [],
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
        criteria: {
          activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
          excludedTagFilters: [],
          ratingFilters: [],
          energyMinFilter: null,
          energyMaxFilter: null,
          bpmMinFilter: null,
          bpmMaxFilter: null,
          isOrFilterMode: false,
        },
      };

      act(() => {
        result.current.storeSmartPlaylist(smartPlaylist);
      });

      // Mock track data that matches the criteria
      const matchingTrackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      await act(async () => {
        await result.current.syncTrackWithSmartPlaylists(
          "spotify:track:test123",
          matchingTrackData
        );
      });

      expect(spotifyApiService.addTrackToSpotifyPlaylist).toHaveBeenCalledWith(
        "spotify:track:test123",
        "test-playlist"
      );
    });

    it("should sync single track removal from smart playlist", async () => {
      // Mock Spotify API responses
      vi.mocked(spotifyApiService.removeTrackFromPlaylist).mockResolvedValue(true);

      const { result } = renderHook(() => useTagData());

      // Set up initial state with a smart playlist that has the track
      const smartPlaylist: SmartPlaylistCriteria = {
        playlistId: "test-playlist",
        playlistName: "Test Playlist",
        isActive: true,
        smartPlaylistTrackUris: ["spotify:track:test123"],
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
        criteria: {
          activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
          excludedTagFilters: [],
          ratingFilters: [],
          energyMinFilter: null,
          energyMaxFilter: null,
          bpmMinFilter: null,
          bpmMaxFilter: null,
          isOrFilterMode: false,
        },
      };

      act(() => {
        result.current.storeSmartPlaylist(smartPlaylist);
      });

      // Mock track data that no longer matches the criteria
      const nonMatchingTrackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [{ categoryId: "genre", subcategoryId: "rock", tagId: "alternative" }],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      await act(async () => {
        await result.current.syncTrackWithSmartPlaylists(
          "spotify:track:test123",
          nonMatchingTrackData
        );
      });

      expect(spotifyApiService.removeTrackFromPlaylist).toHaveBeenCalledWith(
        "spotify:track:test123",
        "test-playlist"
      );
    });

    it("should handle full playlist sync correctly", async () => {
      // Mock Spotify API responses
      vi.mocked(spotifyApiService.getAllTrackUrisInPlaylist).mockResolvedValue([
        "spotify:track:old123",
      ]);
      vi.mocked(spotifyApiService.addTrackToSpotifyPlaylist).mockResolvedValue({
        success: true,
        wasAdded: true,
      });
      vi.mocked(spotifyApiService.removeTrackFromPlaylist).mockResolvedValue(true);

      const { result } = renderHook(() => useTagData());

      // Set up tag data with tracks
      const mockTagData = {
        categories: [],
        tracks: {
          "spotify:track:new123": {
            rating: 4,
            energy: 7,
            bpm: 128,
            tags: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
            dateCreated: Date.now(),
            dateModified: Date.now(),
          },
        },
      };

      act(() => {
        result.current.setTagData?.(mockTagData);
      });

      const smartPlaylist: SmartPlaylistCriteria = {
        playlistId: "test-playlist",
        playlistName: "Test Playlist",
        isActive: true,
        smartPlaylistTrackUris: [],
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
        criteria: {
          activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
          excludedTagFilters: [],
          ratingFilters: [],
          energyMinFilter: null,
          energyMaxFilter: null,
          bpmMinFilter: null,
          bpmMaxFilter: null,
          isOrFilterMode: false,
        },
      };

      await act(async () => {
        await result.current.syncSmartPlaylistFull(smartPlaylist);
      });

      expect(spotifyApiService.addTrackToSpotifyPlaylist).toHaveBeenCalledWith(
        "spotify:track:new123",
        "test-playlist"
      );
      expect(spotifyApiService.removeTrackFromPlaylist).toHaveBeenCalledWith(
        "spotify:track:old123",
        "test-playlist"
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully during sync", async () => {
      // Mock API to throw error
      vi.mocked(spotifyApiService.addTrackToSpotifyPlaylist).mockRejectedValue(
        new Error("Spotify API Error")
      );

      const { result } = renderHook(() => useTagData());

      const smartPlaylist: SmartPlaylistCriteria = {
        playlistId: "test-playlist",
        playlistName: "Test Playlist",
        isActive: true,
        smartPlaylistTrackUris: [],
        lastSyncAt: Date.now(),
        createdAt: Date.now(),
        criteria: {
          activeTagFilters: [],
          excludedTagFilters: [],
          ratingFilters: [],
          energyMinFilter: null,
          energyMaxFilter: null,
          bpmMinFilter: null,
          bpmMaxFilter: null,
          isOrFilterMode: false,
        },
      };

      act(() => {
        result.current.storeSmartPlaylist(smartPlaylist);
      });

      const trackData: TrackData = {
        rating: 4,
        energy: 7,
        bpm: 128,
        tags: [],
        dateCreated: Date.now(),
        dateModified: Date.now(),
      };

      await act(async () => {
        await result.current.syncTrackWithSmartPlaylists("spotify:track:test123", trackData);
      });

      // Should not throw error, should handle gracefully
      expect(result.current.smartPlaylists).toHaveLength(1);
    });
  });
});
