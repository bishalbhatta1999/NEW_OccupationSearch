import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PointsCalculator from '@/components/Dashboard/PointsCalculator'; // Changed from GSMCalculator
import VisaFeeCalculator from '@/components/VisaFeeCalculator';
import DocumentChecklist from '@/components/DocumentChecklist';
import OccupationSearch from '@/components/OccupationSearch';
import './index.css';

const Widget = () => {
  // Get configuration from parent window
  const config = (window.parent as any).OCCUPATION_SEARCH_CONFIG || {};
  const tools = config.tools || ['search', 'points', 'fees', 'docs'];

  return (
    <div className="p-4 max-w-[800px] mx-auto bg-white rounded-xl shadow-sm">
      <Tabs defaultValue={tools[0]} className="w-full">
        <TabsList className="flex w-full p-1 bg-gray-100 rounded-lg mb-6 gap-2">
          {tools.includes('search') && (
            <TabsTrigger 
              value="search" 
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Occupation Search
            </TabsTrigger>
          )}
          {tools.includes('points') && (
            <TabsTrigger 
              value="points" 
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Points Calculator
            </TabsTrigger>
          )}
          {tools.includes('fees') && (
            <TabsTrigger 
              value="fees"
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Visa Fees
            </TabsTrigger>
          )}
          {tools.includes('docs') && (
            <TabsTrigger 
              value="docs"
              className="flex-1 px-4 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Documents
            </TabsTrigger>
          )}
        </TabsList>
        
        {tools.includes('search') && (
          <TabsContent value="search">
            <OccupationSearch 
              query=""
              loading={false}
              error={null}
              occupations={[]}
              onClear={() => {}}
              onSearch={() => {}}
              onSelect={() => {}}
            />
          </TabsContent>
        )}
        {tools.includes('points') && (
          <TabsContent value="points">
            <PointsCalculator /> {/* This component has all calculator options */}
          </TabsContent>
        )}
        {tools.includes('fees') && (
          <TabsContent value="fees">
            <VisaFeeCalculator />
          </TabsContent>
        )}
        {tools.includes('docs') && (
          <TabsContent value="docs">
            <DocumentChecklist />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

createRoot(document.getElementById('widget-root')!).render(
  <React.StrictMode>
    <Widget />
  </React.StrictMode>
);