import React, { useState, useEffect } from 'react';
import { CostBreakdown } from '../../../types/calculator';
import {
  Download,
  GraduationCap,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Globe,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../lib/firebase';
import ProspectFormModal from '../Form/ProspectFormModal';

// -------------------------------------------------
// Types
// -------------------------------------------------
interface Props {
  results: CostBreakdown | null;
  onReset: () => void;
}

interface CompanyDetails {
  name: string;
  domain: string;
  phone: string;
  email: string;
  logo: string;
  socialMedia: Array<{
    type: string;
    url: string;
  }>;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
};

// -------------------------------------------------
// Component
// -------------------------------------------------
export default function ResultsDisplay({ results, onReset }: Props) {
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails | null>(null);

  // Reference for PDF generation
  const targetRef = React.useRef<HTMLDivElement>(null);

  // Function to generate PDF
  const generatePDF = () => {
    if (!targetRef.current) return;
    
    const doc = new jsPDF();
    
    // Add content to PDF
    doc.setFontSize(20);
    doc.text('Student Visa Funds Calculation', 20, 20);
    
    if (results) {
      doc.setFontSize(12);
      doc.text(`Travel Costs: AUD ${formatCurrency(results.travelCosts)}`, 20, 40);
      doc.text(`Course Fees: AUD ${formatCurrency(results.courseFees)}`, 20, 50);
      doc.text(`Living Costs: AUD ${formatCurrency(results.livingCosts.total)}`, 20, 60);
      doc.text(`Total Required: AUD ${formatCurrency(results.total)}`, 20, 80);
    }
    
    // Save the PDF
    doc.save('student-visa-funds-calculation.pdf');
  };

  // Fetch company details from Firestore
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      if (!auth.currentUser) {
        console.log('No authenticated user');
        return;
      }
      try {
        // IMPORTANT: Adjust the doc ID to match how you actually store it
        const companyRef = doc(db, 'companies', auth.currentUser.uid);
        const docSnap = await getDoc(companyRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setCompanyDetails({
            name: data.name || 'Global Select',
            domain: data.domain || 'www.globalselect.com.au',
            phone: data.phone || '+61 08 7081 5229',
            email: data.email || 'migration@globalselect.com.au',
            logo: data.logo || '',
            socialMedia: data.socialMedia || [],
          });
        } else {
          console.log('No company document found, using fallback defaults.');
          setCompanyDetails({
            name: 'Global Select',
            domain: 'www.globalselect.com.au',
            phone: '+61 08 7081 5229',
            email: 'migration@globalselect.com.au',
            logo: '',
            socialMedia: [],
          });
        }
      } catch (error: any) {
        console.error('Error fetching company details:', error);
      }
    };

    fetchCompanyDetails();
  }, []);

  // Scroll to results on mount if results exist
  useEffect(() => {
    if (results) {
      const resultsElement = document.getElementById('results-section');
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [results]);

  // Social media icon mapping
  const socialIcons = {
    facebook: Facebook,
    twitter: Twitter,
    linkedin: Linkedin,
    instagram: Instagram,
    youtube: Youtube,
  };

  // Callback after prospect is saved
  const handleProspectSubmit = async (formData: any) => {
    // Once prospect is created, generate/download PDF
    await generatePDF();
    setShowProspectModal(false);
  };

  if (!results) return null;

  return (
    <div className="mt-8" id="results-section">
      {/* The Prospect Form Modal (hidden unless showProspectModal=true) */}
      {showProspectModal && (
        <ProspectFormModal
          isOpen={showProspectModal}
          onClose={() => setShowProspectModal(false)}
          onSubmit={handleProspectSubmit}
          title="Save Your Calculation"
        />
      )}

      {/* This container is what we'll convert to PDF */}
      <div ref={targetRef} className="bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Company Header / Branding */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Logo + Company Name */}
            <div className="flex items-center space-x-4">
              {companyDetails?.logo ? (
                <img
                  src={companyDetails.logo}
                  alt="Company Logo"
                  className="w-16 h-16 object-contain rounded-lg shadow-sm border border-gray-200"
                />
              ) : (
                // Fallback "icon" if no logo
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-md shadow-md">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {companyDetails?.name || 'Global Select'}
                </h2>
                <p className="text-sm text-gray-600">Education & Migration Services</p>
              </div>
            </div>

            {/* Right: Contact + Social */}
            <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
              {/* Domain / Website */}
              <p className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-blue-600" />
                <a
                  href={`https://${companyDetails?.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {companyDetails?.domain}
                </a>
              </p>
              {/* Phone / Email */}
              <p>Phone: {companyDetails?.phone}</p>
              <p>Email: {companyDetails?.email}</p>

              {/* Social Media */}
              {companyDetails?.socialMedia?.length > 0 && (
                <div className="flex gap-2 mt-1">
                  {companyDetails.socialMedia.map((s, idx) => {
                    const Icon = socialIcons[s.type as keyof typeof socialIcons];
                    if (!Icon) return null;
                    return (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Disclaimer / Info */}
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-xs text-gray-500">
            <p>
              <strong>Note:</strong> This breakdown is for general guidance only.
              For an accurate assessment, please contact our registered migration agent.
            </p>
          </div>
        </div>

        {/* Title / Action Buttons */}
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-semibold">Required Funds Breakdown</h3>
            <p className="text-sm text-blue-100">
              Student Visa (Subclass 500) Financial Requirements
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-all"
            >
              Reset Calculator
            </button>
            <button
              onClick={() => setShowProspectModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-md flex items-center justify-center gap-1 transition-all"
            >
              <Download className="h-4 w-4" />
              Save & Download PDF
            </button>
          </div>
        </div>

        {/* Details Sections */}
        <div className="border-t border-gray-200 divide-y">
          {/* Application Details */}
          <section className="px-4 sm:px-6 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Application Details</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              <p>Location Type: {results.locationType}</p>
              <p>Travel Region: {results.travelRegion}</p>
            </div>
          </section>

          {/* Visa Duration */}
          <section className="px-4 sm:px-6 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Visa Duration Calculation</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              <p>Base duration: {results.visaDuration?.baseDuration || 12} months</p>
              <p>Additional months: {results.visaDuration?.additionalMonths || 0}</p>
              <p>
                Total (capped at 12 months):{' '}
                {results.visaDuration?.totalDuration || 12} months
              </p>
            </div>
          </section>

          {/* Travel Costs */}
          <section className="px-4 sm:px-6 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Travel Costs</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              <p className="mb-2">
                {results.travelCostBreakdown.isAfricanReturn && (
                  <span className="text-blue-600 font-semibold block">
                    * Includes additional return costs for African region
                  </span>
                )}
                Student: {formatCurrency(results.travelCostBreakdown.student)}
                {results.travelCostBreakdown.partner > 0 && (
                  <>
                    <br />
                    Partner: {formatCurrency(results.travelCostBreakdown.partner)}
                  </>
                )}
                {results.travelCostBreakdown.children > 0 && (
                  <>
                    <br />
                    Children: {formatCurrency(results.travelCostBreakdown.children)}
                  </>
                )}
              </p>
              <div className="border-t border-gray-200 pt-2 font-semibold flex justify-between">
                <span>Total Travel Costs:</span>
                <span>{formatCurrency(results.travelCosts)}</span>
              </div>
            </div>
          </section>

          {/* Course Fees */}
          <section className="px-4 sm:px-6 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Course Fees</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
              <p>Total annual fees: {formatCurrency(results.totalAnnualFees)}</p>
              <p>Prepaid amount: {formatCurrency(results.prepaidFees)}</p>
              <p>Remaining course fees: {formatCurrency(results.courseFees)}</p>
            </div>
          </section>

          {/* Living Costs */}
          <section className="px-4 sm:px-6 py-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Living Costs Breakdown</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <ul className="divide-y divide-gray-200 text-sm text-gray-600">
                <li className="py-2 flex justify-between">
                  <span>Student</span>
                  <span>{formatCurrency(results.livingCosts.student)}</span>
                </li>
                {results.livingCosts.partner > 0 && (
                  <li className="py-2 flex justify-between">
                    <span>Partner</span>
                    <span>{formatCurrency(results.livingCosts.partner)}</span>
                  </li>
                )}
                {results.livingCosts.children > 0 && (
                  <li className="py-2 flex justify-between">
                    <span>Children</span>
                    <span>{formatCurrency(results.livingCosts.children)}</span>
                  </li>
                )}
                <li className="py-2 mt-2 border-t border-gray-200 flex justify-between font-semibold">
                  <span>Total Living Costs</span>
                  <span>{formatCurrency(results.livingCosts.total)}</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Schooling Costs */}
          {results.schoolingCosts > 0 && (
            <section className="px-4 sm:px-6 py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">School Enrollment Costs</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
                <p>Number of school-age children: {results.schoolAgeChildren}</p>
                <p>Cost per child: {formatCurrency(13502)}</p>
                <p>Total schooling costs: {formatCurrency(results.schoolingCosts)}</p>
              </div>
            </section>
          )}

          {/* Total Required Funds */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-6">
            <h4 className="text-base font-semibold text-gray-900">Total Required Funds</h4>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(results.total)}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}