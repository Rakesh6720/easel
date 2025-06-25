"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, ArrowRight, Folder, Cloud } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/contexts/search-context";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({
  className,
  placeholder = "Search projects, resources...",
}: GlobalSearchProps) {
  // Get search context with null safety
  const searchContext = useSearch();

  // Fallback state in case context is not available
  const [fallbackSearchTerm, setFallbackSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use context if available, otherwise use fallback
  const searchTerm = searchContext?.searchTerm ?? fallbackSearchTerm;
  const setSearchTerm = searchContext?.setSearchTerm ?? setFallbackSearchTerm;
  const results = searchContext?.results ?? [];
  const isSearching =
    searchContext?.isSearching ?? fallbackSearchTerm.length > 0;
  const clearSearch =
    searchContext?.clearSearch ?? (() => setFallbackSearchTerm(""));
  const recentSearches = searchContext?.recentSearches ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown when typing
  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    clearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRecentSearch = (term: string) => {
    setSearchTerm(term);
    inputRef.current?.focus();
  };

  const getResultIcon = (type: string) => {
    return type === "project" ? (
      <Folder className="h-4 w-4" />
    ) : (
      <Cloud className="h-4 w-4" />
    );
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status.toLowerCase()) {
      case "active":
      case "running":
        return "bg-green-100 text-green-800";
      case "provisioning":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "error":
      case "stopped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          className="pl-10 pr-10"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={handleClearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Recent Searches */}
          {!isSearching && recentSearches.length > 0 && (
            <div className="p-3 border-b">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Recent Searches
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    className="text-sm text-left w-full p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={() => handleRecentSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {isSearching && (
            <div className="p-3">
              {results.length > 0 ? (
                <>
                  <div className="text-xs font-medium text-muted-foreground mb-3">
                    {results.length} result{results.length !== 1 ? "s" : ""} for
                    "{searchTerm}"
                  </div>
                  <div className="space-y-2">
                    {results.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className="block p-3 hover:bg-muted rounded-lg transition-colors group"
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="text-muted-foreground group-hover:text-primary transition-colors">
                              {getResultIcon(result.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                                  {result.title}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {result.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.description}
                              </p>
                              {result.metadata && (
                                <div className="flex items-center space-x-3 mt-2">
                                  {result.metadata.status && (
                                    <Badge
                                      className={cn(
                                        "text-xs",
                                        getStatusColor(result.metadata.status)
                                      )}
                                    >
                                      {result.metadata.status}
                                    </Badge>
                                  )}
                                  {result.metadata.cost !== undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatCurrency(result.metadata.cost)}/mo
                                    </span>
                                  )}
                                  {result.metadata.region && (
                                    <span className="text-xs text-muted-foreground">
                                      {result.metadata.region}
                                    </span>
                                  )}
                                  {result.metadata.resourceCount !==
                                    undefined && (
                                    <span className="text-xs text-muted-foreground">
                                      {result.metadata.resourceCount} resources
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results found for "{searchTerm}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching for projects, resources, or regions
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Search Tips */}
          {!isSearching && recentSearches.length === 0 && (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Search across projects and resources
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try "API", "e-commerce", or "Active"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
