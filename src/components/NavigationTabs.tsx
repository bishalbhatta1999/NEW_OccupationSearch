import React from 'react';
import { FileCheck, Users, BookOpen, Calendar, MapPin } from 'lucide-react';

interface NavigationTabsProps {
  activeSection: string | null;
  loadingSections: Record<string, boolean>;
  onSectionClick: (section: string) => void;
}

const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeSection,
  loadingSections,
  onSectionClick
}) => {
  const sections = [
    { id: 'visa', label: 'Visa Eligibility', icon: FileCheck },
    { id: 'details', label: 'Occupation Details', icon: Users },
    { id: 'assessment', label: 'Skill Assessment', icon: BookOpen },
    { id: 'eoi', label: 'EOI Rounds', icon: Calendar },
    { id: 'nomination', label: 'State Nomination', icon: MapPin }
  ];

  return (
    <div className="relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-indigo-50 rounded-2xl blur-xl opacity-50"></div>
      
      {/* Main Navigation */}
      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-2">
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSectionClick(id)}
              className={`group relative flex-1 min-w-[100px] sm:min-w-[120px] py-2 sm:py-3 px-3 sm:px-4 transition-all duration-300
                         ${activeSection === id 
                           ? 'text-blue-600' 
                           : 'text-gray-500 hover:text-blue-600'}`}
            >
              {/* Active Section Indicator */}
              {activeSection === id && (
                <div className="absolute inset-0 bg-blue-50 rounded-xl -z-10 animate-scaleIn">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl"></div>
                </div>
              )}
              
              {/* Icon and Label */}
              <div className="flex flex-col items-center gap-1">
                <div className={`p-2 rounded-lg transition-colors duration-300
                              ${activeSection === id
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs sm:text-sm font-medium">{label}</span>
                
                {/* Loading Indicator */}
                {loadingSections[id] && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              {/* Bottom Border Indicator */}
              <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-300
                            ${activeSection === id 
                              ? 'w-12 bg-blue-600' 
                              : 'w-0 bg-transparent group-hover:w-12 group-hover:bg-blue-200'}`}>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationTabs;