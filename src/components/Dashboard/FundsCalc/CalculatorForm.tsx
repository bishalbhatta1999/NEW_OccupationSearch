import React, { useState, useEffect } from 'react';
import { ApplicationType, CalculatorFormData, Child, LocationType, TravelRegion } from '../../../types/calculator';
import { Users, GraduationCap, Plane, Calendar, DollarSign, Baby, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  onCalculate: (data: CalculatorFormData) => void;
}

const initialFormState: Partial<CalculatorFormData> = {
  applicationType: 'Single',
  locationType: 'Outside Australia',
  travelRegion: 'Outside Australia',
  children: [],
  totalAnnualFees: undefined,
  prepaidFees: undefined
};

export default function CalculatorForm({ onCalculate }: Props) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CalculatorFormData>>(initialFormState);
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const resetForm = () => {
    setFormData(initialFormState);
    setNumberOfChildren(0);
    setStep(1);
    setValidationErrors({});
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.type === 'date') {
        input.value = '';
      } else if (input.type === 'number') {
        input.value = '';
      }
    });

    const selects = document.querySelectorAll('select');
    selects.forEach(select => {
      select.value = select.options[0].value;
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.locationType === 'In Australia') {
      if (!formData.visaExpiryDate) {
        errors.visaExpiryDate = 'Visa expiry date is required';
      }
      if (!formData.courseEndDate) {
        errors.courseEndDate = 'Course end date is required';
      }
    }

    if (!formData.totalAnnualFees || formData.totalAnnualFees <= 0) {
      errors.totalAnnualFees = 'Total annual fees must be greater than 0';
    }

    if (formData.prepaidFees < 0) {
      errors.prepaidFees = 'Pre-paid fees cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCalculate(formData as CalculatorFormData);
      setTimeout(() => {
        const resultsElement = document.getElementById('results-section');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const firstError = document.querySelector('[data-error]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleApplicationTypeChange = (type: ApplicationType) => {
    setFormData(prev => ({
      ...prev,
      ...initialFormState,
      applicationType: type,
      children: type === 'Family' ? prev.children : []
    }));
    if (type !== 'Family') {
      setNumberOfChildren(0);
    }
    setStep(type === 'Family' ? 1 : 2);
  };

  const handleChildrenCountChange = (count: number) => {
    setNumberOfChildren(count);
    const newChildren: Child[] = Array(count).fill(null).map(() => ({
      dateOfBirth: new Date(),
      requiresSchooling: false
    }));
    setFormData(prev => ({
      ...prev,
      children: newChildren
    }));
  };

  const handleChildDateChange = (index: number, date: Date) => {
    setFormData(prev => {
      const newChildren = [...(prev.children || [])];
      const isSchoolAge = calculateAge(date) >= 5;
      newChildren[index] = {
        dateOfBirth: date,
        requiresSchooling: isSchoolAge
      };
      return {
        ...prev,
        children: newChildren
      };
    });
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const inputClasses = "mt-1 block w-full rounded-xl border border-gray-200 shadow-sm transition-all duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 bg-white/90 backdrop-blur-sm text-gray-700 px-4 py-3 text-base appearance-none";
  const labelClasses = "block text-base font-medium text-gray-700 transition-colors duration-200 mb-2";
  const buttonClasses = "w-full flex items-center justify-center px-6 py-4 text-base font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[48px]";
  const activeButtonClasses = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-[1.02]";
  const inactiveButtonClasses = "bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md transform hover:-translate-y-0.5";

  const renderStep1 = () => (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
            <Users className="h-6 w-6 text-white" />
          </div>
          <label className="text-lg font-semibold text-gray-900">Application Type</label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['Single', 'Couple', 'Family'] as ApplicationType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleApplicationTypeChange(type)}
              className={`${buttonClasses} ${
                formData.applicationType === type ? activeButtonClasses : inactiveButtonClasses
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {formData.applicationType === 'Family' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl animate-slideUp">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-md">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <label className="text-lg font-semibold text-gray-900">Children Details</label>
          </div>
          <div className="space-y-6">
            <div>
              <label className={labelClasses}>Number of Children</label>
              <input
                type="number"
                min="1"
                value={numberOfChildren}
                onChange={(e) => handleChildrenCountChange(Number(e.target.value))}
                className={inputClasses}
              />
            </div>
            
            {numberOfChildren > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: numberOfChildren }).map((_, index) => (
                  <div key={index} className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100">
                    <label className={`${labelClasses} mb-2`}>
                      Child {index + 1} Date of Birth
                    </label>
                    <input
                      type="date"
                      onChange={(e) => handleChildDateChange(index, new Date(e.target.value))}
                      className={inputClasses}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`${buttonClasses} ${activeButtonClasses} w-auto group`}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );

  const renderImportantDates = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-0.5 animate-slideUp">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <label className="text-lg font-semibold text-gray-900">
          Important Dates
          <span className="text-red-500 ml-1">*</span>
        </label>
      </div>
      
      <div className="space-y-6">
        <div data-error={validationErrors.visaExpiryDate}>
          <label htmlFor="visaExpiryDate" className={labelClasses}>
            Current Visa Expiry Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            id="visaExpiryDate"
            required
            onChange={(e) => setFormData(prev => ({ ...prev, visaExpiryDate: new Date(e.target.value) }))}
            className={`${inputClasses} ${validationErrors.visaExpiryDate ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {validationErrors.visaExpiryDate && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.visaExpiryDate}</p>
          )}
        </div>

        <div data-error={validationErrors.courseEndDate}>
          <label htmlFor="courseEndDate" className={labelClasses}>
            Course End Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="date"
            id="courseEndDate"
            required
            onChange={(e) => setFormData(prev => ({ ...prev, courseEndDate: new Date(e.target.value) }))}
            className={`${inputClasses} ${validationErrors.courseEndDate ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          {validationErrors.courseEndDate && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.courseEndDate}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <label className="text-lg font-semibold text-gray-900">Travel Details</label>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className={labelClasses}>Applying From</label>
            <select
              value={formData.locationType}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                locationType: e.target.value as LocationType,
                travelRegion: e.target.value === 'In Australia' ? 'Within Australia' : prev.travelRegion
              }))}
              className={inputClasses}
            >
              <option value="Outside Australia">Outside Australia</option>
              <option value="In Australia">In Australia</option>
            </select>
          </div>

          {formData.locationType === 'Outside Australia' && (
            <div>
              <label className={labelClasses}>Travel Region</label>
              <select
                value={formData.travelRegion}
                onChange={(e) => setFormData(prev => ({ ...prev, travelRegion: e.target.value as TravelRegion }))}
                className={inputClasses}
              >
                <option value="Outside Australia">Outside Australia (Non-Africa)</option>
                <option value="East/Southern Africa">East/Southern Africa</option>
                <option value="West Africa">West Africa</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <label className="text-lg font-semibold text-gray-900">Course Details</label>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className={labelClasses}>Total Annual Fees (AUD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={formData.totalAnnualFees === undefined ? '' : formData.totalAnnualFees}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  totalAnnualFees: e.target.value === '' ? undefined : Number(e.target.value) 
                }))}
                className={`${inputClasses} pl-10`}
                placeholder="Enter total annual fees"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Pre-paid Fees (AUD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={formData.prepaidFees === undefined ? '' : formData.prepaidFees}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  prepaidFees: e.target.value === '' ? undefined : Number(e.target.value) 
                }))}
                className={`${inputClasses} pl-10`}
                placeholder="Enter pre-paid fees"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {formData.locationType === 'In Australia' && renderImportantDates()}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`${buttonClasses} ${inactiveButtonClasses} w-auto group`}
        >
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
        <button
          type="submit"
          className={`${buttonClasses} ${activeButtonClasses} w-auto group`}
        >
          Calculate
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {step === 1 ? renderStep1() : renderStep2()}
    </form>
  );
}