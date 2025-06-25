// Test file to verify search functionality
import { mockProjects, searchProjects } from "../lib/mock-project-data";

// Test search functionality
console.log("Original projects count:", mockProjects.length);

// Test 1: Search for "e-commerce"
const ecommerceResults = searchProjects(mockProjects, "e-commerce");
console.log("E-commerce search results:", ecommerceResults.length);
console.log(
  "Found:",
  ecommerceResults.map((p) => p.name)
);

// Test 2: Search for "API"
const apiResults = searchProjects(mockProjects, "API");
console.log("API search results:", apiResults.length);
console.log(
  "Found:",
  apiResults.map((p) => p.name)
);

// Test 3: Search for "Active" status
const activeResults = searchProjects(mockProjects, "Active");
console.log("Active search results:", activeResults.length);
console.log(
  "Found:",
  activeResults.map((p) => p.name)
);

// Test 4: Empty search
const emptyResults = searchProjects(mockProjects, "");
console.log("Empty search results:", emptyResults.length);

// Test 5: No matches
const noMatchResults = searchProjects(mockProjects, "xyz123");
console.log("No match search results:", noMatchResults.length);
