import { useState, useEffect } from "react";
import { TagCategory } from "./useTagData";

export function useFilterState() {
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [excludedTagFilters, setExcludedTagFilters] = useState<string[]>([]);

  const createTagId = (categoryId: string, subcategoryId: string, tagId: string): string => {
    return `${categoryId}:${subcategoryId}:${tagId}`;
  };

  const parseTagId = (
    fullTagId: string
  ): { categoryId: string; subcategoryId: string; tagId: string } | null => {
    const parts = fullTagId.split(":");
    if (parts.length !== 3) return null;
    return {
      categoryId: parts[0],
      subcategoryId: parts[1],
      tagId: parts[2],
    };
  };

  // Load saved filters on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("tagify:filterState");
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);

        // Only set the tag filters if they exist in the saved state
        if (filters.activeTagFilters && Array.isArray(filters.activeTagFilters)) {
          setActiveTagFilters(filters.activeTagFilters);
        }

        if (filters.excludedTagFilters && Array.isArray(filters.excludedTagFilters)) {
          setExcludedTagFilters(filters.excludedTagFilters);
        }
      }
    } catch (error) {
      console.error("Error loading tag filters from localStorage:", error);
    }
  }, []);

  // Save filters when they change
  useEffect(() => {
    try {
      const filterState = {
        activeTagFilters,
        excludedTagFilters,
      };

      localStorage.setItem("tagify:filterState", JSON.stringify(filterState));
    } catch (error) {
      console.error("Error saving filter state:", error);
    }
  }, [activeTagFilters, excludedTagFilters]);

  const handleRemoveFilter = (categoryId: string, subcategoryId: string, tagId: string) => {
    const fullTagId = createTagId(categoryId, subcategoryId, tagId);

    if (activeTagFilters.includes(fullTagId)) {
      setActiveTagFilters((prev) => prev.filter((t) => t !== fullTagId));
    } else if (excludedTagFilters.includes(fullTagId)) {
      setExcludedTagFilters((prev) => prev.filter((t) => t !== fullTagId));
    }
  };

  const handleToggleFilterType = (
    categoryId: string,
    subcategoryId: string,
    tagId: string,
    isExcluded: boolean
  ) => {
    const fullTagId = createTagId(categoryId, subcategoryId, tagId);

    if (isExcluded) {
      setExcludedTagFilters((prev) => prev.filter((t) => t !== fullTagId));
      setActiveTagFilters((prev) => [...prev, fullTagId]);
    } else {
      setActiveTagFilters((prev) => prev.filter((t) => t !== fullTagId));
      setExcludedTagFilters((prev) => [...prev, fullTagId]);
    }
  };

  const onFilterByTag = (categoryId: string, subcategoryId: string, tagId: string) => {
    const fullTagId = createTagId(categoryId, subcategoryId, tagId);

    if (activeTagFilters.includes(fullTagId)) {
      // Move from INCLUDE to EXCLUDE
      setActiveTagFilters((prev) => prev.filter((t) => t !== fullTagId));
      setExcludedTagFilters((prev) => [...prev, fullTagId]);
    } else if (excludedTagFilters.includes(fullTagId)) {
      // Move from EXCLUDE to OFF
      setExcludedTagFilters((prev) => prev.filter((t) => t !== fullTagId));
    } else {
      // Move from OFF to INCLUDE
      setActiveTagFilters((prev) => [...prev, fullTagId]);
    }
  };

  // Toggle tags between ON/OFF - no EXCLUDE
  const onFilterByTagOnOff = (categoryId: string, subcategoryId: string, tagId: string) => {
    const fullTagId = createTagId(categoryId, subcategoryId, tagId);

    if (activeTagFilters.includes(fullTagId)) {
      // Remove from active filters (turn OFF)
      setActiveTagFilters((prev) => prev.filter((t) => t !== fullTagId));
    } else if (excludedTagFilters.includes(fullTagId)) {
      // Move from excluded to active (turn ON)
      setExcludedTagFilters((prev) => prev.filter((t) => t !== fullTagId));
      setActiveTagFilters((prev) => [...prev, fullTagId]);
    } else {
      // Add to active filters (turn ON)
      setActiveTagFilters((prev) => [...prev, fullTagId]);
    }
  };

  const getTagDisplayName = (fullTagId: string, categories: TagCategory[]): string => {
    const parsed = parseTagId(fullTagId);
    if (!parsed) return fullTagId;

    const category = categories.find((c) => c.id === parsed.categoryId);
    const subcategory = category?.subcategories.find((s) => s.id === parsed.subcategoryId);
    const tag = subcategory?.tags.find((t) => t.id === parsed.tagId);

    return tag?.name || fullTagId;
  };

  const clearTagFilters = () => {
    setActiveTagFilters([]);
    setExcludedTagFilters([]);
  };

  return {
    activeTagFilters,
    excludedTagFilters,
    handleRemoveFilter,
    handleToggleFilterType,
    onFilterByTag,
    onFilterByTagOnOff,
    clearTagFilters,
    createTagId,
    parseTagId,
    getTagDisplayName,
  };
}
