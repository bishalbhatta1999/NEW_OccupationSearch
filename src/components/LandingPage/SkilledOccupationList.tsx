import React, { FC } from 'react';
import { Search, Filter, Download } from 'lucide-react';

const SkilledOccupationList: FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Most Accurate Skilled Occupation List Tool
          </h2>
          <p className="text-xl text-gray-600">
            Stay updated with the latest occupations eligible for skilled migration visas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Search</h3>
            <p className="text-gray-600">
              Quickly find your occupation with our smart search functionality
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Filter className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Advanced Filtering</h3>
            <p className="text-gray-600">
              Filter by visa type, skill level, and assessing authority
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export Options</h3>
            <p className="text-gray-600">
              Download occupation lists and requirements in various formats
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white 
                         bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg 
                         hover:shadow-xl transition-all duration-200">
            Check Your Eligibility Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default SkilledOccupationList;