"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  mockProjects,
  searchProjects,
  type Project,
} from "@/lib/mock-project-data";
import {
  allMockResourcesData,
  type ResourceData,
} from "@/lib/mock-resource-data";

// Search result types
export interface SearchResult {
  id: string;
  type: "project" | "resource";
  title: string;
  description: string;
  href: string;
  metadata?: {
    status?: string;
    cost?: number;
    region?: string;
    resourceCount?: number;
  };
}

// Search context interface
interface SearchContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
  recentSearches: string[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Helper function to convert projects to search results
const projectsToSearchResults = (projects: Project[]): SearchResult[] => {
  return projects.map((project) => ({
    id: `project-${project.id}`,
    type: "project" as const,
    title: project.name,
    description: project.description,
    href: `/projects/${project.id}`,
    metadata: {
      status: project.status,
      cost: project.monthlyCost,
      resourceCount: project.resourceCount,
    },
  }));
};

// Helper function to convert resources to search results
const resourcesToSearchResults = (
  resources: ResourceData[]
): SearchResult[] => {
  return resources.map((resource) => ({
    id: `resource-${resource.id}`,
    type: "resource" as const,
    title: resource.name,
    description: resource.type,
    href: `/resources?id=${resource.id}`,
    metadata: {
      status: resource.status,
      cost: resource.cost,
      region: resource.region,
    },
  }));
};

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTermState] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Get all resources as array
  const allResources = useMemo(() => Object.values(allMockResourcesData), []);

  // Perform search across projects and resources
  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];

    // Search projects
    const matchingProjects = searchProjects(mockProjects, searchTerm);
    const projectResults = projectsToSearchResults(matchingProjects);

    // Search resources
    const searchLower = searchTerm.toLowerCase();
    const matchingResources = allResources.filter(
      (resource) =>
        resource.name.toLowerCase().includes(searchLower) ||
        resource.type.toLowerCase().includes(searchLower) ||
        resource.region.toLowerCase().includes(searchLower) ||
        resource.status.toLowerCase().includes(searchLower)
    );
    const resourceResults = resourcesToSearchResults(matchingResources);

    // Combine and limit results
    const allResults = [...projectResults, ...resourceResults];
    return allResults.slice(0, 10); // Limit to 10 results for performance
  }, [searchTerm, allResources]);

  const setSearchTerm = useCallback(
    (term: string) => {
      setSearchTermState(term);

      // Add to recent searches if it's a meaningful search
      if (term.trim().length > 2 && !recentSearches.includes(term)) {
        setRecentSearches((prev) => [term, ...prev.slice(0, 4)]); // Keep last 5 searches
      }
    },
    [recentSearches]
  );

  const clearSearch = useCallback(() => {
    setSearchTermState("");
  }, []);

  const isSearching = searchTerm.length > 0;

  const value = {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    clearSearch,
    recentSearches,
  };

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  // Return undefined if not in provider instead of throwing error
  // This allows components to handle missing context gracefully
  return context;
}

// Hook that throws error if context is missing (for components that require it)
export function useSearchRequired() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useSearchRequired must be used within a SearchProvider");
  }
  return context;
}
