import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PointsCalculator from '@/components/Dashboard/GSMCalculator';
import VisaFeeCalculator from '@/components/VisaFeeCalculator';
import DocumentChecklist from '@/components/DocumentChecklist';

const WidgetPage = () => {
  return (
    <div className="p-4 max-w-[800px] mx-auto">
      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="points">Points Calculator</TabsTrigger>
          <TabsTrigger value="fees">Visa Fees</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="points">
          <PointsCalculator />
        </TabsContent>
        <TabsContent value="fees">
          <VisaFeeCalculator />
        </TabsContent>
        <TabsContent value="docs">
          <DocumentChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WidgetPage;