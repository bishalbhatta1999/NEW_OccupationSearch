import React, { useState } from 'react';
import { CalculatorFormData, CostBreakdown } from '../../../types/calculator';
import { calculateTotalCosts } from './utils';
import CalculatorForm from './CalculatorForm';
import ResultsDisplay from './ResultsDisplay';
import { Calculator } from 'lucide-react';

export default function FundsCalculator() {
  const [results, setResults] = useState<CostBreakdown | null>(null);

  const handleCalculate = (data: CalculatorFormData) => {
    const calculatedResults = calculateTotalCosts(data);
    setResults(calculatedResults);
  };

  const handleReset = () => {
    setResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100">
          <Calculator className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Visa Funds Calculator</h2>
          <p className="text-sm text-gray-600">Calculate required funds for your student visa application</p>
        </div>
      </div>

      {/* Calculator Form */}
      <CalculatorForm onCalculate={handleCalculate} />

      {/* Results Display */}
      <ResultsDisplay results={results} onReset={handleReset} />
    </div>
  );
}