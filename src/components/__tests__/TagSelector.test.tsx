import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagSelector from "../../components/TagSelector";
import { TagCategory, TrackTag } from "../../hooks/useTagData";
import React, { act } from "react";

const mockCategories: TagCategory[] = [
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
          { id: "trance", name: "Trance" },
        ],
      },
      {
        id: "rock",
        name: "Rock",
        tags: [
          { id: "alternative", name: "Alternative" },
          { id: "indie", name: "Indie" },
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
          { id: "aggressive", name: "Aggressive" },
        ],
      },
    ],
  },
];

const mockTrackTags: TrackTag[] = [
  { categoryId: "genre", subcategoryId: "electronic", tagId: "house" },
  { categoryId: "mood", subcategoryId: "energy", tagId: "uplifting" },
];

// Mock localStorage for expanded state
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("TagSelector", () => {
  const mockTrack = {
    uri: "spotify:track:123",
    name: "Test Track",
  };

  const mockOnToggleTag = vi.fn();
  const mockOnOpenTagManager = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  const renderTagSelector = (props = {}) => {
    return render(
      <TagSelector
        track={mockTrack}
        categories={mockCategories}
        trackTags={mockTrackTags}
        onToggleTag={mockOnToggleTag}
        onOpenTagManager={mockOnOpenTagManager}
        isMultiTagging={false}
        isLockedTrack={false}
        {...props}
      />
    );
  };

  describe("Rendering", () => {
    it("should render all categories and subcategories", () => {
      renderTagSelector();

      expect(screen.getByText("Genre")).toBeInTheDocument();
      expect(screen.getByText("Mood")).toBeInTheDocument();
    });

    it("should show selected tags as active", () => {
      renderTagSelector();

      const houseTag = screen.getByText("House");
      const upliftingTag = screen.getByText("Uplifting");

      expect(houseTag).toHaveClass(expect.stringMatching(/selected|active/i));
      expect(upliftingTag).toHaveClass(expect.stringMatching(/selected|active/i));
    });

    it("should show unselected tags as inactive", () => {
      renderTagSelector();

      const technoTag = screen.getByText("Techno");
      expect(technoTag).not.toHaveClass(expect.stringMatching(/selected|active/i));
    });

    it("should show tag manager button", () => {
      renderTagSelector();

      const tagManagerButton = screen.getByText(/manage tags/i);
      expect(tagManagerButton).toBeInTheDocument();
    });
  });

  describe("Tag Interaction", () => {
    it("should call onToggleTag when clicking a tag", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const technoTag = screen.getByText("Techno");
      await user.click(technoTag);

      expect(mockOnToggleTag).toHaveBeenCalledWith("genre", "electronic", "techno");
    });

    it("should call onToggleTag for selected tags", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const houseTag = screen.getByText("House");
      await user.click(houseTag);

      expect(mockOnToggleTag).toHaveBeenCalledWith("genre", "electronic", "house");
    });

    it("should open tag manager when clicking manage button", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const tagManagerButton = screen.getByText(/manage tags/i);
      await user.click(tagManagerButton);

      expect(mockOnOpenTagManager).toHaveBeenCalled();
    });
  });

  describe("Category and Subcategory Expansion", () => {
    it("should expand categories when clicked", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const genreCategory = screen.getByText("Genre");
      await user.click(genreCategory);

      // Should show subcategories
      expect(screen.getByText("Electronic")).toBeInTheDocument();
      expect(screen.getByText("Rock")).toBeInTheDocument();
    });

    it("should expand subcategories when clicked", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      // First expand category
      const genreCategory = screen.getByText("Genre");
      await user.click(genreCategory);

      // Then expand subcategory
      const electronicSubcat = screen.getByText("Electronic");
      await user.click(electronicSubcat);

      // Should show tags
      expect(screen.getByText("House")).toBeInTheDocument();
      expect(screen.getByText("Techno")).toBeInTheDocument();
      expect(screen.getByText("Trance")).toBeInTheDocument();
    });

    it("should remember expanded state in localStorage", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const genreCategory = screen.getByText("Genre");
      await user.click(genreCategory);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "tagify:expandedCategories",
        expect.stringContaining("genre")
      );
    });

    it("should restore expanded state from localStorage", () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === "tagify:expandedCategories") {
          return JSON.stringify(["genre"]);
        }
        if (key === "tagify:expandedSubcategories") {
          return JSON.stringify(["electronic"]);
        }
        return null;
      });

      renderTagSelector();

      expect(screen.getByText("Electronic")).toBeInTheDocument();
      expect(screen.getByText("House")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter tags based on search term", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const searchInput = screen.getByPlaceholderText(/search tags/i);
      await user.type(searchInput, "house");

      expect(screen.getByText("House")).toBeInTheDocument();
      expect(screen.queryByText("Techno")).not.toBeInTheDocument();
    });

    it("should save search term to localStorage", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const searchInput = screen.getByPlaceholderText(/search tags/i);
      await user.type(searchInput, "test");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("tagify:tagSearchTerm", "test");
    });

    it("should restore search term from localStorage", () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === "tagify:tagSearchTerm") {
          return "house";
        }
        return null;
      });

      renderTagSelector();

      const searchInput = screen.getByPlaceholderText(/search tags/i) as HTMLInputElement;
      expect(searchInput.value).toBe("house");
    });

    it("should clear search when clicking clear button", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const searchInput = screen.getByPlaceholderText(/search tags/i);
      await act(async () => {
        await user.type(searchInput, "test");
      });

      const clearButton = screen.getByText(/clear/i);
      await act(async () => {
        await user.click(clearButton);
      });

      expect((searchInput as HTMLInputElement).value).toBe("");
    });
  });

  describe("Multi-tagging Mode", () => {
    it("should show multi-tagging indicator when enabled", () => {
      renderTagSelector({ isMultiTagging: true });

      expect(screen.getByText(/multi-tag mode/i)).toBeInTheDocument();
    });

    it("should show different styling in multi-tag mode", () => {
      const { container } = renderTagSelector({ isMultiTagging: true });

      expect(container.firstChild).toHaveClass(expect.stringMatching(/multi.*tag/i));
    });
  });

  describe("Locked Track State", () => {
    it("should disable interactions when track is locked", () => {
      renderTagSelector({ isLockedTrack: true });

      const tags = screen
        .getAllByRole("button")
        .filter(
          (button) =>
            button.textContent && ["House", "Techno", "Uplifting"].includes(button.textContent)
        );

      tags.forEach((tag) => {
        expect(tag).toBeDisabled();
      });
    });

    it("should show locked indicator", () => {
      renderTagSelector({ isLockedTrack: true });

      expect(screen.getByText(/locked/i)).toBeInTheDocument();
    });
  });

  describe("Expand All Functionality", () => {
    it("should expand all categories and subcategories when clicking expand all", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const expandAllButton = screen.getByText(/expand all/i);
      await act(async () => {
        await user.click(expandAllButton);
      });

      expect(screen.getByText("Electronic")).toBeInTheDocument();
      expect(screen.getByText("Rock")).toBeInTheDocument();
      expect(screen.getByText("Energy")).toBeInTheDocument();
      expect(screen.getByText("House")).toBeInTheDocument();
      expect(screen.getByText("Alternative")).toBeInTheDocument();
      expect(screen.getByText("Uplifting")).toBeInTheDocument();
    });

    it("should collapse all when clicking collapse all", async () => {
      const user = userEvent.setup();

      // Start with expanded state
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === "tagify:areAllExpanded") {
          return "true";
        }
        return JSON.stringify([]);
      });

      renderTagSelector();

      const collapseAllButton = screen.getByText(/collapse all/i);
      await act(async () => {
        await user.click(collapseAllButton);
      });

      expect(screen.queryByText("Electronic")).not.toBeInTheDocument();
      expect(screen.queryByText("Energy")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      renderTagSelector();

      const searchInput = screen.getByPlaceholderText(/search tags/i);
      expect(searchInput).toHaveAttribute("aria-label", expect.stringMatching(/search/i));
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      renderTagSelector();

      const houseTag = screen.getByText("House");
      houseTag.focus();

      await act(async () => {
        await user.keyboard("{Enter}");
      });

      expect(mockOnToggleTag).toHaveBeenCalledWith("genre", "electronic", "house");
    });
  });
});
