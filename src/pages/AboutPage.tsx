import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AboutSection from '../components/LandingPage/AboutSection';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AboutPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: 'What is the Occupation Search tool?',
      a: 'Our Occupation Search tool is a real-time portal that maps Australian occupations, eligibility criteria, and visa pathways using up-to-date government data. It is designed to help professionals and applicants easily find ANZSCO codes relevant to their skills.'
    },
    {
      q: 'Is the data verified and current?',
      a: 'Yes. We pull information from official databases, including government and state nomination authorities, on a daily basis to ensure everything remains accurate and timely.'
    },
    {
      q: 'Which visas or categories are covered?',
      a: 'Our tool covers various Australian skilled visa pathways, including subclass 189, 190, 491, and more. We also provide state-specific eligibility requirements for each relevant occupation.'
    },
    {
      q: 'How do I generate detailed reports?',
      a: 'You can create PDF or email reports instantly from within your dashboard. These documents contain occupation tasks, skill assessment authorities, and visa requirements, making them ideal for client consultations.'
    },
    {
      q: 'Can I integrate Occupation Search with my website?',
      a: 'Absolutely! We offer widget and API integration that can be embedded on your site, allowing visitors or clients to perform occupation searches without leaving your platform.'
    },
    {
      q: 'Do you provide customer support?',
      a: 'We offer multiple support channels—email, ticketing, and live chat—depending on your subscription level. Our goal is to ensure you get the help you need, when you need it.'
    },
    {
      q: 'Is there a free trial?',
      a: 'Yes. We understand you may want to explore the tool first, so we provide a 14-day free trial on all paid plans, granting you full access to all premium features.'
    },
    {
      q: 'Can migration agents track client inquiries?',
      a: 'Yes. We include a basic client management system that logs inquiries, stores client details, and even allows you to send automated occupation reports directly to them.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <AboutSection />

      {/* FAQ Section with an accordion design */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          {/* Accordion Container */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  {/* FAQ question row */}
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left 
                             font-semibold text-lg text-gray-800 focus:outline-none 
                             hover:bg-gray-100 transition-colors rounded-t-xl"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {/* FAQ answer */}
                  {isOpen && (
                    <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Our team is here to guide you through every step of your occupation search needs.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white 
                     bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg 
                     hover:shadow-xl transition-transform duration-200"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;