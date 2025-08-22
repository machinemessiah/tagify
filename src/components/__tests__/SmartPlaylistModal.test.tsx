import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SmartPlaylistModal from "../../components/SmartPlaylistModal";
import { SmartPlaylistCriteria, TagCategory } from "../../hooks/useTagData";
import React, { act } from "react";

const mockTagCategories: TagCategory[] = [
  {
    id: "genre",
    name: "Genre",
    subcategories: [
      {
        id: "electronic",
        name: "Electronic",
        tags: [
          { id: "house", name: "House" },
          { id: "techno", name: "Techno" },
        ],
      },
    ],
  },
  {
    id: "mood",
    name: "Mood",
    subcategories: [
      {
        id: "energy",
        name: "Energy",
        tags: [
          { id: "uplifting", name: "Uplifting" },
          { id: "chill", name: "Chill" },
        ],
      },
    ],
  },
];

const mockSmartPlaylists: SmartPlaylistCriteria[] = [
  {
    playlistId: "playlist1",
    playlistName: "Electronic House Mix",
    isActive: true,
    smartPlaylistTrackUris: ["spotify:track:123", "spotify:track:456"],
    lastSyncAt: Date.now(),
    criteria: {
      activeTagFilters: [{ categoryId: "genre", subcategoryId: "electronic", tagId: "house" }],
      excludedTagFilters: [],
      ratingFilters: [4, 5],
      energyMinFilter: 6,
      energyMaxFilter: null,
      bpmMinFilter: 120,
      bpmMaxFilter: 130,
      isOrFilterMode: false,
    },
    createdAt: 0,
  },
  {
    playlistId: "playlist2",
    playlistName: "Chill Vibes",
    isActive: false,
    smartPlaylistTrackUris: [],
    lastSyncAt: Date.now(),
    criteria: {
      activeTagFilters: [{ categoryId: "mood", subcategoryId: "energy", tagId: "chill" }],
      excludedTagFilters: [],
      ratingFilters: [],
      energyMinFilter: null,
      energyMaxFilter: 5,
      bpmMinFilter: null,
      bpmMaxFilter: null,
      isOrFilterMode: false,
    },
    createdAt: 0,
  },
];

describe("SmartPlaylistModal", () => {
  const mockOnUpdateSmartPlaylists = vi.fn();
  const mockOnSyncPlaylist = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Spotify API call for playlist name sync
    global.Spicetify.CosmosAsync.get = vi.fn().mockResolvedValue({
      name: "Electronic House Mix",
      description: "Test description",
    });
  });

  const renderModal = (props = {}) => {
    return render(
      <SmartPlaylistModal
        smartPlaylists={mockSmartPlaylists}
        tagCategories={mockTagCategories}
        onUpdateSmartPlaylists={mockOnUpdateSmartPlaylists}
        onSyncPlaylist={mockOnSyncPlaylist}
        onClose={mockOnClose}
        {...props}
      />
    );
  };

  describe("Rendering", () => {
    it("should render modal with smart playlists", () => {
      renderModal();

      expect(screen.getByRole("heading", { name: /Smart Playlists/i })).toHaveTextContent(
        "Smart Playlists (2)"
      );
      expect(screen.getByText("Electronic House Mix")).toBeInTheDocument();
      expect(screen.getByText("Chill Vibes")).toBeInTheDocument();
    });

    it("should render empty state when no smart playlists exist", () => {
      renderModal({ smartPlaylists: [] });

      expect(screen.getByText("No Smart Playlists Yet")).toBeInTheDocument();
      expect(screen.getByText(/Create a playlist with filters/)).toBeInTheDocument();
    });

    it("should display playlist criteria correctly", () => {
      renderModal();

      expect(screen.getByText(/ALL of: House/)).toBeInTheDocument();
      expect(screen.getByText(/4, 5 ★/)).toBeInTheDocument();
      expect(screen.getByText(/Energy: ≥6/)).toBeInTheDocument();
      expect(screen.getByText(/120 - 130 BPM/)).toBeInTheDocument();
    });

    it("should show inactive playlist styling", () => {
      renderModal();

      const inactivePlaylist = screen.getByText("Chill Vibes").closest('[class*="playlistItem"]');
      expect(inactivePlaylist).toHaveClass(expect.stringMatching(/inactive/i));
    });
  });

  describe("Playlist Activation/Deactivation", () => {
    it("should toggle playlist active state", async () => {
      const user = userEvent.setup();
      renderModal();

      const toggleButton = screen
        .getAllByRole("button")
        .find(
          (button) =>
            button.textContent?.includes("Activate") || button.textContent?.includes("Deactivate")
        );

      if (toggleButton) {
        await act(async () => {
          await user.click(toggleButton);
        });

        expect(mockOnUpdateSmartPlaylists).toHaveBeenCalled();
      }
    });

    it("should trigger sync when activating playlist", async () => {
      const user = userEvent.setup();
      mockOnSyncPlaylist.mockResolvedValue(undefined);

      renderModal();

      // Find and click the activate button for inactive playlist
      const inactivePlaylistSection = screen
        .getByText("Chill Vibes")
        .closest('[class*="playlistItem"]');
      const activateButton = inactivePlaylistSection?.querySelector('button[class*="activate"]');

      if (activateButton) {
        await act(async () => {
          await user.click(activateButton);
        });

        await waitFor(() => {
          expect(mockOnSyncPlaylist).toHaveBeenCalled();
        });
      }
    });

    it("should handle sync errors gracefully", async () => {
      const user = userEvent.setup();
      mockOnSyncPlaylist.mockRejectedValue(new Error("Sync failed"));

      renderModal();

      const inactivePlaylistSection = screen
        .getByText("Chill Vibes")
        .closest('[class*="playlistItem"]');
      const activateButton = inactivePlaylistSection?.querySelector("button");

      if (activateButton) {
        await act(async () => {
          await user.click(activateButton);
        });

        await waitFor(() => {
          expect(global.Spicetify.showNotification).toHaveBeenCalledWith(
            "Failed to sync playlist",
            true
          );
        });
      }
    });
  });

  describe("Manual Sync", () => {
    it("should trigger manual sync for active playlist", async () => {
      const user = userEvent.setup();
      mockOnSyncPlaylist.mockResolvedValue(undefined);

      renderModal();

      // Find sync button for active playlist
      const activePlaylistSection = screen
        .getByText("Electronic House Mix")
        .closest('[class*="playlistItem"]');
      const syncButton = activePlaylistSection?.querySelector('button[class*="sync"]');

      if (syncButton) {
        await act(async () => {
          await user.click(syncButton);
        });

        await waitFor(() => {
          expect(mockOnSyncPlaylist).toHaveBeenCalledWith(mockSmartPlaylists[0]);
        });
      }
    });

    it("should show loading state during sync", async () => {
      const user = userEvent.setup();
      let resolveSync: (value?: unknown) => void;
      mockOnSyncPlaylist.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSync = resolve;
          })
      );

      renderModal();

      const activePlaylistSection = screen
        .getByText("Electronic House Mix")
        .closest('[class*="playlistItem"]');
      const syncButton = activePlaylistSection?.querySelector('button[class*="sync"]');

      if (syncButton) {
        await act(async () => {
          await user.click(syncButton);
        });

        // Should show loading state
        expect(syncButton).toBeDisabled();

        // Resolve the sync
        resolveSync!();

        await waitFor(() => {
          expect(syncButton).not.toBeDisabled();
        });
      }
    });
  });

  describe("Navigation", () => {
    it("should navigate to playlist when clicking on title", async () => {
      const user = userEvent.setup();
      renderModal();

      const playlistTitle = screen.getByText("Electronic House Mix");
      await act(async () => {
        await user.click(playlistTitle);
      });

      expect(global.Spicetify.Platform.History.push).toHaveBeenCalledWith("/playlist/playlist1");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Filter Display", () => {
    it("should format OR mode tag filters correctly", () => {
      const orModePlaylist: SmartPlaylistCriteria = {
        ...mockSmartPlaylists[0],
        criteria: {
          ...mockSmartPlaylists[0].criteria,
          activeTagFilters: [
            { categoryId: "genre", subcategoryId: "electronic", tagId: "house" },
            { categoryId: "genre", subcategoryId: "electronic", tagId: "techno" },
          ],
          isOrFilterMode: true,
        },
      };

      renderModal({ smartPlaylists: [orModePlaylist] });

      expect(screen.getByText(/ANY of: House, Techno/)).toBeInTheDocument();
    });

    it("should format excluded tag filters correctly", () => {
      const playlistWithExclusions: SmartPlaylistCriteria = {
        ...mockSmartPlaylists[0],
        criteria: {
          ...mockSmartPlaylists[0].criteria,
          excludedTagFilters: [{ categoryId: "mood", subcategoryId: "energy", tagId: "chill" }],
        },
      };

      renderModal({ smartPlaylists: [playlistWithExclusions] });

      expect(screen.getByText("Chill")).toBeInTheDocument();
    });

    it("should format energy ranges correctly", () => {
      const playlistWithEnergyRange: SmartPlaylistCriteria = {
        ...mockSmartPlaylists[0],
        criteria: {
          ...mockSmartPlaylists[0].criteria,
          energyMinFilter: 5,
          energyMaxFilter: 8,
        },
      };

      renderModal({ smartPlaylists: [playlistWithEnergyRange] });

      expect(screen.getByText("Energy: 5 - 8")).toBeInTheDocument();
    });

    it("should show track count for playlists", () => {
      renderModal();

      expect(screen.getByText("2 tracks")).toBeInTheDocument();
      expect(screen.getByText("0 tracks")).toBeInTheDocument();
    });
  });

  describe("Modal Interaction", () => {
    it("should close modal when clicking close button", async () => {
      const user = userEvent.setup();
      renderModal();

      const closeButton = screen.getByText("×");
      await act(async () => {
        await user.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should close modal when clicking overlay", async () => {
      const user = userEvent.setup();
      renderModal();

      const overlay = screen.getByRole("dialog").parentElement;
      if (overlay) {
        await act(async () => {
          await user.click(overlay);
        });
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it("should not close modal when clicking modal content", async () => {
      const user = userEvent.setup();
      renderModal();

      const modalContent = screen.getByRole("dialog");
      await act(async () => {
        await user.click(modalContent);
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Playlist Name Sync", () => {
    it("should sync playlist names on mount", async () => {
      renderModal();

      await waitFor(() => {
        expect(global.Spicetify.CosmosAsync.get).toHaveBeenCalledWith(
          expect.stringContaining("playlists/playlist1")
        );
      });
    });

    it("should update playlist names if they changed", async () => {
      global.Spicetify.CosmosAsync.get = vi.fn().mockResolvedValue({
        name: "Updated Playlist Name",
        description: "Test description",
      });

      renderModal();

      await waitFor(() => {
        expect(mockOnUpdateSmartPlaylists).toHaveBeenCalled();
      });
    });
  });
});
