import { NextRequest, NextResponse } from 'next/server';
import coursesData from '../../../data/courses.json';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  instructor: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter "q" is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    
    // Return empty array for empty queries
    if (!trimmedQuery) {
      return NextResponse.json([]);
    }

    // Validate courses data structure
    if (!Array.isArray(coursesData)) {
      console.error('Courses data is not an array');
      return NextResponse.json(
        { error: 'Internal server error: Invalid data structure' },
        { status: 500 }
      );
    }

    const searchTerm = trimmedQuery.toLowerCase();
    
    // Improved search algorithm with scoring
    const searchResults = coursesData
      .map((course: Course) => {
        let score = 0;
        const title = course.title?.toLowerCase() || '';
        const description = course.description?.toLowerCase() || '';
        const category = course.category?.toLowerCase() || '';
        const instructor = course.instructor?.toLowerCase() || '';

        // Title matches get highest score
        if (title.includes(searchTerm)) {
          score += title.startsWith(searchTerm) ? 10 : 5;
        }

        // Category matches get medium score
        if (category.includes(searchTerm)) {
          score += 3;
        }

        // Instructor matches get medium score
        if (instructor.includes(searchTerm)) {
          score += 3;
        }

        // Description matches get lowest score
        if (description.includes(searchTerm)) {
          score += 1;
        }

        return score > 0 ? { ...course, score } : null;
      })
      .filter((course): course is Course & { score: number } => course !== null)
      .sort((a, b) => b.score - a.score) // Sort by relevance score
      .slice(0, 50) // Limit results to prevent performance issues
      .map(({ score, ...course }) => course); // Remove score from final result

    // Add cache headers for better performance
    const response = NextResponse.json(searchResults);
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30');
    
    return response;

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
