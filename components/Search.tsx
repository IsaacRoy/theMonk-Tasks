"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { debounce } from "lodash";

interface SearchResult {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  instructor: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculatedValue, setCalculatedValue] = useState(0);

  // Move calculation to useEffect to fix hydration mismatch
  useEffect(() => {
    const sum = Math.random() * 10000 + Math.random() * 40000;
    setCalculatedValue(sum);
  }, []);

  // Debounced search function to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while searching');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change with useCallback for optimization
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setLoading(true);
      debouncedSearch(value);
    } else {
      setResults([]);
      setLoading(false);
      setError(null);
    }
  }, [debouncedSearch]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Memoize expensive calculations
  const resultStats = useMemo(() => {
    if (results.length === 0) return null;
    
    const totalPrice = results.reduce((sum, course) => sum + (course.price || 0), 0);
    const avgPrice = totalPrice / results.length;
    const categories = new Set(results.map(course => course.category));
    
    return {
      total: results.length,
      avgPrice: avgPrice.toFixed(2),
      categories: categories.size
    };
  }, [results]);

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
            aria-label="Search courses"
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-1">
          Debug: Calc: {calculatedValue.toFixed(2)}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Searching...</span>
        </div>
      )}

      {resultStats && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Found {resultStats.total} courses • Average price: ${resultStats.avgPrice} • {resultStats.categories} categories
          </p>
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
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {result.category}
              </span>
              <span>Instructor: {result.instructor}</span>
              <span className="font-semibold text-green-600">${result.price}</span>
            </div>
          </div>
        ))}

        {query && results.length === 0 && !loading && !error && (
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
