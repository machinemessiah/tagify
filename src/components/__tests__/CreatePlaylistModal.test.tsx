import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react"; // Only import React once
import CreatePlaylistModal from "../../components/CreatePlaylistModal";

describe("CreatePlaylistModal", () => {
  const mockProps = {
    trackCount: 25,
    localTrackCount: 3,
    activeTagDisplayNames: ["House", "Uplifting"],
    excludedTagDisplayNames: ["Chill"],
    isOrFilterMode: false,
    ratingFilters: [4, 5],
    energyMinFilter: 6,
    energyMaxFilter: null,
    bpmMinFilter: 120,
    bpmMaxFilter: 130,
    currentSearchTerm: "",
    onCreatePlaylist: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(<CreatePlaylistModal {...mockProps} {...props} />);
  };

  describe("Rendering", () => {
    it("should render modal with correct title", () => {
      renderModal();
      expect(screen.getByRole("heading", { name: "Create Playlist" })).toBeInTheDocument();
    });

    it("should show track count information", () => {
      renderModal();
      expect(
        screen.getByText((_, el) => el?.textContent === "Creating playlist with 25 tracks")
      ).toBeInTheDocument();
    });
  });

  describe("Form Inputs", () => {
    it("should allow editing playlist name", async () => {
      const user = userEvent.setup();
      renderModal();

      const nameInput = screen.getByLabelText(/playlist name/i);

      // No need for act() - userEvent handles this automatically
      await user.clear(nameInput);
      await user.type(nameInput, "My Custom Playlist");

      expect(nameInput).toHaveValue("My Custom Playlist");
    });

    it("should allow editing playlist description", async () => {
      const user = userEvent.setup();
      renderModal();

      const descriptionInput = screen.getByLabelText(/description/i);

      // Clean approach without act()
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "My custom description");

      expect(descriptionInput).toHaveValue("My custom description");
    });

    it("should respect input length limits", async () => {
      const user = userEvent.setup();
      renderModal();

      const nameInput = screen.getByLabelText(/playlist name/i);
      const longName = "a".repeat(150);

      await user.clear(nameInput);
      await user.type(nameInput, longName);

      // Should be truncated to 100 characters
      expect(nameInput).toHaveValue("a".repeat(100));
    });
  });

  describe("Checkbox Options", () => {
    it("should toggle public playlist option", async () => {
      const user = userEvent.setup();
      renderModal();

      const publicCheckbox = screen.getByLabelText(/public playlist/i);
      expect(publicCheckbox).not.toBeChecked();

      await user.click(publicCheckbox);
      expect(publicCheckbox).toBeChecked();
    });

    it("should toggle smart playlist option", async () => {
      const user = userEvent.setup();
      renderModal();

      const smartCheckbox = screen.getByLabelText(/smart playlist/i);
      expect(smartCheckbox).not.toBeChecked();

      await user.click(smartCheckbox);
      expect(smartCheckbox).toBeChecked();
    });
  });

  describe("Smart Playlist Warning", () => {
    it("should show search term warning for smart playlists", async () => {
      const user = userEvent.setup();
      renderModal({ currentSearchTerm: "test search" });

      const smartCheckbox = screen.getByLabelText(/smart playlist/i);
      await user.click(smartCheckbox);

      // Use waitFor for elements that appear after state changes
      await waitFor(() => {
        expect(
          screen.getByText(/Search term "test search" will not be included/)
        ).toBeInTheDocument();
      });
    });

    it("should not show warning when no search term", async () => {
      const user = userEvent.setup();
      renderModal({ currentSearchTerm: "" });

      const smartCheckbox = screen.getByLabelText(/smart playlist/i);
      await user.click(smartCheckbox);

      expect(screen.queryByText(/Search term.*will not be included/)).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call onCreatePlaylist with correct parameters", async () => {
      const user = userEvent.setup();
      renderModal();

      const nameInput = screen.getByLabelText(/playlist name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const publicCheckbox = screen.getByLabelText(/public playlist/i);
      const smartCheckbox = screen.getByLabelText(/smart playlist/i);

      // Fill out the form
      await user.clear(nameInput);
      await user.type(nameInput, "Test Playlist");
      await user.clear(descriptionInput);
      await user.type(descriptionInput, "Test Description");
      await user.click(publicCheckbox);
      await user.click(smartCheckbox);

      // Submit the form
      const submitButton = screen.getByRole("button", { name: /create playlist/i });
      await user.click(submitButton);

      expect(mockProps.onCreatePlaylist).toHaveBeenCalledWith(
        "Test Playlist",
        "Test Description",
        true,
        true
      );
    });

    it("should use default values when inputs are empty", async () => {
      const user = userEvent.setup();
      renderModal();

      const nameInput = screen.getByLabelText(/playlist name/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.clear(nameInput);
      await user.clear(descriptionInput);

      const submitButton = screen.getByRole("button", { name: /create playlist/i });
      await user.click(submitButton);

      expect(mockProps.onCreatePlaylist).toHaveBeenCalledWith(
        expect.stringMatching(/playlist/i), // Should use default name
        expect.stringMatching(/tagify/i), // Should use default description
        false,
        false
      );
    });

    it("should submit form with enter key", async () => {
      const user = userEvent.setup();
      renderModal();

      const nameInput = screen.getByLabelText(/playlist name/i);
      await user.type(nameInput, "Test{Enter}");

      expect(mockProps.onCreatePlaylist).toHaveBeenCalled();
    });
  });

  describe("Modal Interaction", () => {
    it("should close modal when clicking close button", async () => {
      const user = userEvent.setup();
      renderModal();

      const closeButton = screen.getByRole("button", { name: "×" });
      await user.click(closeButton);

      expect(mockProps.onClose).toHaveBeenCalled();
    });

    it("should close modal when clicking overlay", async () => {
      const user = userEvent.setup();
      const { container } = renderModal();

      // Find the overlay (usually the parent of the modal)
      const overlay =
        container.querySelector('[class*="overlay"]') ||
        container.querySelector('[class*="backdrop"]') ||
        container.firstChild;

      if (overlay && overlay !== container.querySelector('[class*="modal"]')) {
        await user.click(overlay as Element);
        expect(mockProps.onClose).toHaveBeenCalled();
      }
    });

    it("should not close modal when clicking modal content", async () => {
      const user = userEvent.setup();
      const { container } = renderModal();

      // Click on the modal content itself
      const modalContent =
        container.querySelector('[class*="modal"]') || screen.getByRole("dialog");

      if (modalContent) {
        await user.click(modalContent);
        expect(mockProps.onClose).not.toHaveBeenCalled();
      }
    });
  });

  // Only use act() when absolutely necessary for state updates
  describe("Advanced State Management", () => {
    it("should handle complex state updates", async () => {
      const user = userEvent.setup();
      renderModal();

      // For complex operations that might need act(), use it sparingly
      const nameInput = screen.getByLabelText(/playlist name/i);
      const smartCheckbox = screen.getByLabelText(/smart playlist/i);

      // Most user interactions don't need act()
      await user.clear(nameInput);
      await user.type(nameInput, "Complex Test");
      await user.click(smartCheckbox);

      // Verify the state changes
      expect(nameInput).toHaveValue("Complex Test");
      expect(smartCheckbox).toBeChecked();
    });
  });
});
