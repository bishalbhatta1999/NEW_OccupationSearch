import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Loader2,
  RefreshCw,
  BadgeCheck,
  Briefcase,
  Globe,
  FileText,
  ExternalLink,
} from 'lucide-react';
import '../ApiDataRenderer.css';

interface ApiResponse {
  id: string;
  name: string;
  data: string; // HTML
  link: string;
}

interface ApiDataRendererProps {
  id: string; // The doc's ID in Firebase
}

const ApiDataRenderer: React.FC<ApiDataRendererProps> = ({ id }) => {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Simple cache to avoid re-fetching
  const cacheRef = useRef<Record<string, ApiResponse>>({});

  /**
   * Updated Patterns:
   * - paginationTdPattern: removes entire <td> if it has "previous page" or "next page".
   * - paginationRowPattern: removes entire <tr> if it has "previous page" or "next page".
   * 
   * You can remove either the <td> or <tr> pattern depending on your actual markup.
   */
  const breadcrumbPattern = /<div id="chapbreadcrumb">[\s\S]*?<\/div>/gi;
  // Matches any <td> containing "previous page" or "next page" inside an <a> or text
  const paginationTdPattern = /<td[^>]*>[\s\S]*?(?:previous\s*page|next\s*page)[\s\S]*?<\/td>/gim;
  // Matches entire <tr> containing "previous page" or "next page"
  const paginationRowPattern = /<tr[^>]*>[\s\S]*?(?:previous\s*page|next\s*page)[\s\S]*?<\/tr>/gim;
  // Remove HTML comments or extra sections
  const extraSectionsPattern = /<!--[\s\S]*?-->/g;

  /**
   * Removes unwanted "Previous Page" / "Next Page" 
   * plus other extraneous HTML sections.
   */
  const cleanData = (html: string): string => {
    let cleaned = html;

    // 1) Remove breadcrumbs
    cleaned = cleaned.replace(breadcrumbPattern, '');

    // 2) Remove <td> sections that have "previous page" or "next page"
    cleaned = cleaned.replace(paginationTdPattern, '');

    // 3) Remove entire <tr> if it references "previous" or "next" 
    cleaned = cleaned.replace(paginationRowPattern, '');

    // 4) Remove any HTML comments
    cleaned = cleaned.replace(extraSectionsPattern, '');

    return cleaned;
  };

  const fetchData = async (forceRefresh = false) => {
    if (!forceRefresh && cacheRef.current[id]) {
      // Use cached data
      setApiData(cacheRef.current[id]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://allhtml-details.firebaseio.com/.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: ApiResponse[] = await response.json();
      // Find doc by ID
      const foundData = data.find(item => item.id === id);
      if (foundData) {
        const cleaned = cleanData(foundData.data);
        const finalObj = { ...foundData, data: cleaned };
        setApiData(finalObj);
        if (!forceRefresh) {
          cacheRef.current[id] = finalObj;
        }
      } else {
        setError('Data not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, refreshKey]);

  return (
    <div className="p-4">
      {/* Refresh button */}
      <div className="flex justify-end mb-4">
        <Button
          className="flex items-center gap-2 bg-Blue text-Black border-blue-200
                     hover:bg-blue-50 hover:text-white hover:border-blue-300 shadow-sm px-4 py-2 rounded-xl
                     transition-all duration-200 group relative"
          onClick={() => {
            setRefreshKey(prev => prev + 1);
            fetchData(true); // Force refresh
          }}
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="font-medium">Refresh Data</span>

          {/* Hover tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs
                          rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200
                          whitespace-nowrap pointer-events-none">
            Fetch latest data
          </span>
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
          <span className="ml-2 text-lg font-medium">Loading...</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center font-semibold">
          {error}
        </div>
      )}

      {apiData && !loading && !error && (
        <Card>
          <CardContent>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BadgeCheck className="text-main-color" /> Unit Group: {apiData.id}
            </h2>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Briefcase className="text-main-color" /> Occupation Name: {apiData.name}
            </h2>

            {/* Render the cleaned HTML */}
            <div
              className="api-content mb-6"
              dangerouslySetInnerHTML={{ __html: apiData.data }}
            />

            {/* Official Sources */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Official Sources</h3>
              </div>

              <div className="space-y-4">
                <a
                  href={apiData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200
                             hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100/50 group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Australian Bureau of Statistics</h4>
                      <p className="text-sm text-gray-600">
                        View detailed information on the ABS website
                      </p>
                    </div>
                  </div>
                  <ExternalLink
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors"
                  />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiDataRenderer;