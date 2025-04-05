import React, { useEffect, useState } from 'react';
import {
  FileCheck,
  Download,
  Mail,
  AlertCircle,
  Search,
  FileText,
  FileBox,
  FileImage,
  FileSpreadsheet,
  FileJson,
  FileCode,
  FileLock2,
  FileWarning,
  FileSignature,
  FileKey2,
  FileStack,
  FileUp,
  FileX2,
  ChevronDown
} from 'lucide-react';
import { DropdownFilter } from './ui/DropdownFilter';
import PDFGenerator from '../utils/pdfGenerator';

// Define a generic response type – structure may vary by visa type
interface ChecklistResponse {
  [key: string]: any;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface DocumentItemProps {
  text: string;
  index: number;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ text, index }) => {
  // Array of document icons to cycle through
  const icons = [
    FileText,
    FileBox,
    FileImage,
    FileSpreadsheet,
    FileJson,
    FileCode,
    FileLock2,
    FileWarning,
    FileSignature,
    FileKey2,
    FileStack,
    FileUp,
    FileX2
  ];
  
  // Get icon based on index
  const Icon = icons[index % icons.length];
  
  // Get color based on document type keywords
  const getIconColor = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('passport') || lowerText.includes('visa')) return 'text-blue-500';
    if (lowerText.includes('certificate') || lowerText.includes('degree')) return 'text-green-500';
    if (lowerText.includes('photo') || lowerText.includes('image')) return 'text-purple-500';
    if (lowerText.includes('form') || lowerText.includes('application')) return 'text-orange-500';
    if (lowerText.includes('letter') || lowerText.includes('statement')) return 'text-indigo-500';
    if (lowerText.includes('id') || lowerText.includes('license')) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
  <li className="group flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
    <div className={`p-1.5 rounded-lg bg-gray-50 group-hover:bg-white transition-colors ${getIconColor(text)}`}>
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{text}</span>
  </li>
  );
};

// Helper to convert keys (e.g., "singleApplicant") to Title Case ("Single Applicant")
const formatHeader = (str: string) =>
  str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase());

const DocumentChecklist: React.FC = () => {
  const [checklistData, setChecklistData] = useState<ChecklistResponse>({});
  const [selectedVisa, setSelectedVisa] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch checklist data from Firebase on mount
  useEffect(() => {
    const fetchChecklistData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          'https://globalselectchecklist202-43.firebaseio.com/checklist/.json'
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ChecklistResponse = await response.json();
        setChecklistData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchChecklistData();
  }, []);

  // When the visa subclass is selected, set a default section (preferably "singleApplicant")
  useEffect(() => {
    if (selectedVisa && checklistData[selectedVisa]) {
      const sections = Object.keys(checklistData[selectedVisa]).filter(
        (key) => key !== 'visaType'
      );
      if (sections.includes('singleApplicant')) {
        setSelectedSection('singleApplicant');
      } else if (sections.length > 0) {
        setSelectedSection(sections[0]);
      } else {
        setSelectedSection('');
      }
    }
  }, [selectedVisa, checklistData]);

  // Helper to filter a list of documents based on the search query
  const filterList = (list: string[]): string[] => {
    if (!searchQuery) return list;
    return list.filter((item) =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Stub function for sending checklist via email
  const handleEmailChecklist = () => {
    alert(`Checklist would be sent to ${email}`);
    setShowEmailForm(false);
    setEmail('');
  };

  // Generate PDF with company branding
  const generatePDF = async () => {
    if (!selectedVisa || !selectedSection || !currentSectionData) {
      setError('Please select a visa subclass and section first');
      return;
    }

    setPdfGenerating(true);
    try {
      // Create PDF generator with options
      const pdf = new PDFGenerator({
        coverTitle: 'Document Checklist',
        coverSubtitle: `${checklistData[selectedVisa].visaType} - ${formatHeader(selectedSection)}`,
        filename: `document-checklist-${selectedVisa}-${selectedSection}.pdf`,
        includeTimestamp: true,
        includePageNumbers: true,
      });

      // Initialize and add cover page
      await pdf.init();
      pdf.addCoverLetter();

      // Add each section's requirements as a table
      Object.entries(currentSectionData).forEach(([subKey, value]) => {
        if (Array.isArray(value)) {
          const filteredItems = searchQuery
            ? value.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
            : value;

          // Add as a table with bullet points
          pdf.addTable(
            [{ header: formatHeader(subKey), dataKey: 'item' }],
            filteredItems.map(item => ({ item: `• ${item}` }))
          );
        }
      });

      // Add disclaimer as a text block
      pdf.addTextBlock(
        'Important Notes',
        '• Documents marked with * are mandatory.\n' +
        '• Additional documents may be required based on your specific circumstances.\n' +
        '• Always verify requirements with the Department of Home Affairs.'
      );

      // Save and download the PDF
      await pdf.save();
      setError(null);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF. Please try again.');
    } finally {
      setPdfGenerating(false);
    }
  };

  // Get options for section filter based on selected visa
  const sectionOptions: DropdownOption[] =
    selectedVisa && checklistData[selectedVisa]
      ? Object.keys(checklistData[selectedVisa])
          .filter((key) => key !== 'visaType')
          .map((key) => ({
            value: key,
            label: formatHeader(key)
          }))
      : [];

  // Get section data safely
  const currentSectionData = selectedVisa && selectedSection 
    ? checklistData[selectedVisa]?.[selectedSection]
    : null;

  return (
    <div className="max-w-5xl mx-auto my-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FileCheck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Document Checklist Generator</h2>
            <p className="mt-1 text-lg">
              Create and download a comprehensive checklist for your visa application.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {loading && <p className="text-center">Loading checklist data...</p>}
            
  
        {error && (
          <p className="text-center text-red-500">Error: {error}</p>
        )}
        {!loading && !error && Object.keys(checklistData).length > 0 && (
          <div className="space-y-8">
            {/* Visa Subclass Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Visa Subclass
              </label>
              <DropdownFilter
                options={Object.entries(checklistData).map(([key, data]) => ({
                  value: key,
                  label: `${key} - ${data.visaType}`
                }))}
                value={selectedVisa}
                onChange={(value) => setSelectedVisa(value)}
                placeholder="Select a visa subclass"
              />
            </div>

            {/* Section Filter Dropdown */}
            {selectedVisa && sectionOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Checklist Section
                </label>
                <DropdownFilter
                  options={sectionOptions}
                  value={selectedSection}
                  onChange={(value) => setSelectedSection(value)}
                  placeholder="Select a section"
                />
              </div>
            )}

            {/* Search Field */}
            {selectedSection && (
              <div className="relative mt-4">
                <Search className="absolute w-5 h-5 text-gray-500 left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            {/* Display Checklist Details */}
            {selectedVisa && selectedSection && (
              <>
                {currentSectionData ? (
                  <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                      {checklistData[selectedVisa].visaType}
                    </h3>
                    <div>
                      <h4 className="text-xl font-bold text-gray-700 mb-2">
                        {formatHeader(selectedSection)}
                      </h4>
                      <div>
                        {Object.entries(currentSectionData).map(
                          ([subKey, value]) =>
                            Array.isArray(value) && (
                              <div key={subKey} className="mb-4">
                                <h5 className="font-semibold text-gray-600 mb-1">
                                  {formatHeader(subKey)}:
                                </h5>
                                <ul className="list-disc ml-6">
                                  <div className="space-y-1">
                                    {filterList(value).map((item, index) => (
                                      <DocumentItem key={index} text={item} index={index} />
                                    ))}
                                  </div>
                                </ul>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500">
                    No checklist available for this section.
                  </p>
                )}
              </>
            )}

            {/* Action Buttons */}
            {selectedVisa && selectedSection && currentSectionData && (
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-300">
                <button
                  onClick={generatePDF}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                  disabled={pdfGenerating}
                >
                  {pdfGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Mail className="w-5 h-5" />
                  Email Checklist
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center">
        <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
        <span className="text-sm text-amber-700">
          Documents marked with * are mandatory. Additional documents may be required based on your specific circumstances.
        </span>
      </div>

      {/* Email Form Modal */}
      {showEmailForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Email Checklist</h3>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowEmailForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailChecklist}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentChecklist;