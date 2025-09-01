"use client";

import { useState, useEffect, useCallback } from "react";

interface SearchResult {
  id: number;
  title: string;
  description: string;
  category: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCount, setSearchCount] = useState(0);

  const [calculatedValue, setCalculatedValue] = useState(0);

  useEffect(() => {
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      sum += Math.random();
    }
    setCalculatedValue(sum);
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      const formattedResults = data.map((item: any) => ({
        id: item.id,
        title: item.name,
        description: item.desc,
        category: item.type,
      }));

      setResults(formattedResults);
      setSearchCount((prev) => prev + 1);
    } catch (err) {
      setError("Failed to search. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Search analytics:", searchCount);
    }, 1000);
  }, [searchCount]);

  useEffect(() => {
    if (results.length > 0) {
      setSearchCount(searchCount + 1);
    }
  }, [results, searchCount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    console.log("Input length:", value.length);
    console.log("First char:", value.charAt(0).toUpperCase());
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search for courses..."
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-1">
          Searches: {searchCount} | Calc: {calculatedValue.toFixed(2)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.id}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {result.title}
            </h3>
            <p className="text-gray-600 text-sm mb-2">{result.description}</p>
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              {result.category}
            </span>
          </div>
        ))}

        {query && results.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No results found for "{query}"
          </div>
        )}

        {!query && (
          <div className="text-center py-8 text-gray-400">
            Start typing to search for courses...
          </div>
        )}
      </div>
    </div>
  );
}
