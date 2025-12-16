// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Import Supabase with proper ES modules syntax
import supabaseClient from '@/lib/supabase';

// Define proper types for database entities
interface BlogPostDb {
  id: string;
  post_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  date: string;
  image: string | null;
  content?: string;
}

// Course interface based on your table structure
interface CourseDb {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  duration: string | null;
  level: string | null;
  price: number | null;
  original_price: number | null;
  thumbnail_url: string | null;
  course_type: 'online' | 'live' | 'hybrid';
  live_start_date: string | null;
  live_end_date: string | null;
  max_participants: number | null;
  current_participants: number | null;
  is_active: boolean | null;
  is_registration_open: boolean | null;
  created_at: string;
}

// Define result types - course eklendi
interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: 'blog' | 'page' | 'event' | 'project' | 'course';
  image?: string;
  category?: string;
  date?: string;
  tags?: string[];
  // Course specific data
  courseData?: {
    price?: number;
    originalPrice?: number;
    instructor?: string;
    level?: string;
    duration?: string;
    courseType?: 'online' | 'live' | 'hybrid';
    liveStartDate?: string;
    liveEndDate?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    isRegistrationOpen?: boolean;
  };
}

// Static page definition
interface StaticPage {
  path: string;
  name: string;
}

// Helper function to format date in Turkish format
const formatDateTurkish = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } catch {
    return dateStr; // Return original if any error
  }
};

// Helper function to format date in English format
const formatDateEnglish = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr; // Return original if any error
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const locale = searchParams.get('locale') || 'tr';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Sanitize and normalize search query
    const sanitizedQuery = query.trim().toLowerCase();
    
    if (sanitizedQuery.length < 2) {
      return NextResponse.json({ 
        results: [],
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Create an array to store all search results
    const allResults: SearchResultItem[] = [];
    
    // Check if we have a valid supabase instance
    try {
      // Search blog posts - Try catch this entire block
      try {
        const { data: blogPosts, error: blogError } = await supabaseClient
          .from('unilab_vision_blog_posts')
          .select(`
            id,
            post_id,
            title,
            slug,
            excerpt,
            category,
            date,
            image
          `)
          .eq('locale', locale)
          .eq('site', 'myuni_platform')
          .or(`title.ilike.%${sanitizedQuery}%,excerpt.ilike.%${sanitizedQuery}%,content.ilike.%${sanitizedQuery}%`)
          .order('date', { ascending: false })
          .limit(20);

        if (blogError) {
          console.error('Error searching blog posts:', blogError);
        } else if (blogPosts && blogPosts.length > 0) {
          // Process blog posts results
          const blogResults = blogPosts.map((post: BlogPostDb) => {
            let formattedDate = post.date;
            if (post.date) {
              formattedDate = locale === 'tr' 
                ? formatDateTurkish(post.date)
                : formatDateEnglish(post.date);
            }
            
            return {
              id: post.post_id,
              title: post.title,
              excerpt: post.excerpt || '',
              url: `/${locale}/blog/${post.slug}`,
              type: 'blog' as const,
              image: post.image ? getFullStorageUrl(post.image) : undefined,
              category: post.category,
              date: formattedDate
            };
          });
          
          // Add to all results
          allResults.push(...blogResults);
        }
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // Continue with other searches
      }

      // Search courses - NEW ADDITION
      try {
        const { data: courses, error: coursesError } = await supabaseClient
          .from('myuni_courses')
          .select(`
            id,
            slug,
            title,
            description,
            instructor_name,
            duration,
            level,
            price,
            original_price,
            thumbnail_url,
            course_type,
            live_start_date,
            live_end_date,
            max_participants,
            current_participants,
            is_active,
            is_registration_open,
            created_at
          `)
          .eq('is_active', true)
          .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,instructor_name.ilike.%${sanitizedQuery}%`)
          .order('created_at', { ascending: false })
          .limit(15);

        if (coursesError) {
          console.error('Error searching courses:', coursesError);
        } else if (courses && courses.length > 0) {
          // Process course results
          const courseResults = courses.map((course: CourseDb) => {
            // Format display date (use live start date or created date)
            const displayDate = course.live_start_date || course.created_at;
            let formattedDate = '';
            if (displayDate) {
              formattedDate = locale === 'tr' 
                ? formatDateTurkish(displayDate)
                : formatDateEnglish(displayDate);
            }

            // Create course category based on type
            let courseCategory = '';
            switch (course.course_type) {
              case 'live':
                courseCategory = locale === 'tr' ? 'Canlı Eğitim' : 'Live Training';
                break;
              case 'hybrid':
                courseCategory = locale === 'tr' ? 'Hibrit Eğitim' : 'Hybrid Training';
                break;
              case 'online':
              default:
                courseCategory = locale === 'tr' ? 'Online Eğitim' : 'Online Course';
                break;
            }

            // Create tags from course data
            const courseTags: string[] = [];
            if (course.level) {
              courseTags.push(locale === 'tr' ? `Seviye: ${course.level}` : `Level: ${course.level}`);
            }
            if (course.duration) {
              courseTags.push(locale === 'tr' ? `Süre: ${course.duration}` : `Duration: ${course.duration}`);
            }
            if (course.instructor_name) {
              courseTags.push(locale === 'tr' ? `Eğitmen: ${course.instructor_name}` : `Instructor: ${course.instructor_name}`);
            }

            // Rich text açıklamasından plain text çıkar
            const getPlainTextFromRichText = (richText: string | null): string => {
              if (!richText) return locale === 'tr' ? 'Eğitim açıklaması mevcut değil.' : 'Course description not available.';
              
              // HTML taglerini kaldır ve içeriği temizle
              const plainText = richText
                .replace(/<style[^>]*>.*?<\/style>/gi, '') // Style taglerini kaldır
                .replace(/<script[^>]*>.*?<\/script>/gi, '') // Script taglerini kaldır
                .replace(/<[^>]*>/g, ' ') // Tüm HTML taglerini boşlukla değiştir
                .replace(/&nbsp;/g, ' ') // Non-breaking space
                .replace(/&amp;/g, '&') // HTML entities
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&hellip;/g, '...')
                .replace(/&mdash;/g, '—')
                .replace(/&ndash;/g, '–')
                .replace(/\s+/g, ' ') // Birden fazla boşluğu tek boşluğa çevir
                .replace(/^\s+|\s+$/g, '') // Başlangıç ve bitiş boşluklarını kaldır
                .trim();
              
              // Boş string kontrolü
              if (!plainText || plainText.length === 0) {
                return locale === 'tr' ? 'Eğitim açıklaması mevcut değil.' : 'Course description not available.';
              }
              
              return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
            };

            return {
              id: course.id,
              title: course.title,
              excerpt: getPlainTextFromRichText(course.description),
              url: `/${locale}/${locale === 'tr' ? 'kurs' : 'course'}/${course.slug}`,
              type: 'course' as const,
              image: course.thumbnail_url ? getFullStorageUrl(course.thumbnail_url) : undefined,
              category: courseCategory,
              date: formattedDate,
              tags: courseTags,
              courseData: {
                price: course.price ?? undefined,
                originalPrice: course.original_price ?? undefined,
                instructor: course.instructor_name ?? undefined,
                level: course.level ?? undefined,
                duration: course.duration ?? undefined,
                courseType: course.course_type,
                liveStartDate: course.live_start_date ?? undefined,
                liveEndDate: course.live_end_date ?? undefined,
                maxParticipants: course.max_participants ?? undefined,
                currentParticipants: course.current_participants ?? undefined,
                isRegistrationOpen: course.is_registration_open ?? true
              }
            };
          });
          
          // Add course results to all results
          allResults.push(...courseResults);
        }
      } catch (coursesError) {
        console.error('Error searching courses:', coursesError);
        // Continue with other searches
      }

    } catch (supabaseError) {
      console.error('Supabase client error:', supabaseError);
      // Continue with static pages
    }

    // Add static pages (this doesn't require database)
    try {
      const staticPages: StaticPage[] = [];
      
      // Define pages based on locale
      if (locale === 'tr') {
        staticPages.push(
          { path: '', name: 'Ana Sayfa' },
          { path: 'hakkimizda', name: 'Hakkımızda' },
          { path: 'kariyer', name: 'Kariyer' },
          { path: 'gizlilik', name: 'Gizlilik' },
          { path: 'sartlar-ve-kosullar', name: 'Şartlar ve Koşullar' },
          { path: 'blog', name: 'Blog' },
          { path: 'iletisim', name: 'İletişim' },
          { path: 'projelerimiz', name: 'Projelerimiz' },
          { path: 'hizmetlerimiz', name: 'Hizmetlerimiz' },
          { path: 'kurslar', name: 'Kurslar' }, // Yeni eklendi
          { path: 'egitimler', name: 'Eğitimler' } // Yeni eklendi
        );
      } else if (locale === 'en') {
        staticPages.push(
          { path: '', name: 'Home' },
          { path: 'about', name: 'About' },
          { path: 'careers', name: 'Careers' },
          { path: 'blog', name: 'Blog' },
          { path: 'contact', name: 'Contact' },
          { path: 'projects', name: 'Projects' },
          { path: 'services', name: 'Services' },
          { path: 'courses', name: 'Courses' }, // Yeni eklendi
          { path: 'training', name: 'Training' } // Yeni eklendi
        );
      }
      
      const pageResults = staticPages
        .filter(page => {
          const pageName = page.name.toLowerCase();
          const pagePath = page.path.toLowerCase();
          return pageName.includes(sanitizedQuery) || pagePath.includes(sanitizedQuery);
        })
        .map(page => ({
          id: `page-${page.path || 'home'}`,
          title: page.name,
          excerpt: locale === 'tr' 
            ? `${page.name} sayfasına git` 
            : `Go to ${page.name} page`,
          url: `/${locale}${page.path ? `/${page.path}` : ''}`,
          type: 'page' as const,
          date: locale === 'tr'
            ? formatDateTurkish(new Date().toISOString())
            : formatDateEnglish(new Date().toISOString())
        }));
      
      if (pageResults.length > 0) {
        allResults.push(...pageResults);
      }
    } catch (pagesError) {
      console.error('Error processing static pages:', pagesError);
      // Continue with whatever results we have
    }

    // Sort results by relevance and date
    const sortedResults = allResults.sort((a, b) => {
      // First, prioritize exact title matches
      const aExactMatch = a.title.toLowerCase().includes(sanitizedQuery);
      const bExactMatch = b.title.toLowerCase().includes(sanitizedQuery);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then prioritize courses (if searching for education-related terms)
      const educationTerms = ['kurs', 'course', 'eğitim', 'training', 'learn'];
      const isEducationQuery = educationTerms.some(term => sanitizedQuery.includes(term));
      
      if (isEducationQuery) {
        if (a.type === 'course' && b.type !== 'course') return -1;
        if (a.type !== 'course' && b.type === 'course') return 1;
      }
      
      // Finally, sort by date (newest first)
      const aDate = new Date(a.date || 0);
      const bDate = new Date(b.date || 0);
      return bDate.getTime() - aDate.getTime();
    });

    // Set proper headers explicitly
    const response = NextResponse.json({ 
      results: sortedResults,
      query: sanitizedQuery,
      total: sortedResults.length
    });
    
    // Explicitly set content-type
    response.headers.set('Content-Type', 'application/json');
    
    return response;

  } catch (error) {
    console.error('Search API error:', error);
    
    // Create a response with proper JSON format and content-type
    const response = NextResponse.json({ 
      results: [],
      error: 'Failed to perform search',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Explicitly set content-type
    response.headers.set('Content-Type', 'application/json');
    
    return response;
  }
}

// Helper function to get full storage URL for images
function getFullStorageUrl(path: string | null): string {
  if (!path) return '/blog/default-image.webp'; // Default image
  
  // If URL is already complete, don't modify it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If path starts with /blog/ or /courses/, it's likely a static file path
  if (path.startsWith('/blog/') || path.startsWith('/courses/')) {
    return path;
  }
  
  // Add leading slash if missing
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  // Supabase storage URL - you might need to adjust this for course images
  // If you have a separate bucket for course images, update accordingly
  const baseUrl = "https://ghuellgktqqzpryuyiky.supabase.co/storage/v1/object/public/blog-images";
  
  return baseUrl + normalizedPath;
}