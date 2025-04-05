import React, { useState } from 'react'
import GSMCalculator from './GSMCalculator'
import BusinessCalculator from './BusinessCalculator'
import CanberraMatrixResidents from './CanberraMatrixResidents'
import CanberraMatrixOverseas from './CanberraMatrixOverseas'

const PointsCalculator: React.FC = () => {
  // Track which calculator is active
  const [activeCalc, setActiveCalc] = useState<'gsm' | 'business' | 'resident' | 'overseas'>('gsm');
  const [transitioning, setTransitioning] = useState(false);

  const handleCalcChange = (calc: typeof activeCalc) => {
    setTransitioning(true);
    setActiveCalc(calc);
    setTimeout(() => setTransitioning(false), 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Tabs / Buttons Row */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => handleCalcChange('gsm')}
          className={`px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105
            ${activeCalc === 'gsm' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/20' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'} 
            rounded-xl flex-1 sm:flex-none min-w-[150px] relative overflow-hidden
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 
            before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000`}
        >
          GSM Calculator
        </button>

        <button
          onClick={() => handleCalcChange('business')}
          className={`px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105
            ${activeCalc === 'business' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/20' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'}
            rounded-xl flex-1 sm:flex-none min-w-[150px] relative overflow-hidden
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 
            before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000`}
        >
          Business Calculator
        </button>

        <button
          onClick={() => handleCalcChange('resident')}
          className={`px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105
            ${activeCalc === 'resident' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/20' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'}
            rounded-xl flex-1 sm:flex-none min-w-[150px] relative overflow-hidden
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 
            before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000`}
        >
          Canberra Matrix (Residents)
        </button>

        <button
          onClick={() => handleCalcChange('overseas')}
          className={`px-6 py-3 font-medium transition-all duration-300 transform hover:scale-105
            ${activeCalc === 'overseas' 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-500/20' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'}
            rounded-xl flex-1 sm:flex-none min-w-[150px] relative overflow-hidden
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/30 before:to-white/0 
            before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000`}
        >
          Canberra Matrix (Overseas)
        </button>
          </div>
        </div>
      </div>

      {/* Conditional Rendering */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className={`transition-all duration-300 transform ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {activeCalc === 'gsm' && <GSMCalculator />}
          {activeCalc === 'business' && <BusinessCalculator />}
          {activeCalc === 'resident' && <CanberraMatrixResidents />}
          {activeCalc === 'overseas' && <CanberraMatrixOverseas />}
        </div>
      </div>
    </div>
  );
};

export default PointsCalculator;
