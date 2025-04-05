import React, { useState } from 'react';
import { ContactDetails } from '../../../types/calculator';
import { X, User, Phone, Mail, MapPin, Globe, Building2, MapPinned } from 'lucide-react';

interface Props {
  onSubmit: (details: ContactDetails) => void;
  onCancel: () => void;
}

const australianStates = [
  'Australian Capital Territory',
  'New South Wales',
  'Northern Territory',
  'Queensland',
  'South Australia',
  'Tasmania',
  'Victoria',
  'Western Australia'
];

export default function ContactForm({ onSubmit, onCancel }: Props) {
  const [details, setDetails] = useState<ContactDetails>({
    fullName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: 'South Australia',
    postcode: '',
    country: 'Australia'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };

  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const numbers = input.replace(/\D/g, '');
    
    // Format as Australian phone number
    if (numbers.startsWith('61')) {
      // International format
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3');
    } else if (numbers.startsWith('0')) {
      // National format
      return numbers.replace(/(\d{4})(\d{4})/, '0$1 $2');
    }
    return input;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedNumber = formatPhoneNumber(e.target.value);
    setDetails({ ...details, phone: formattedNumber });
  };

  const inputClasses = "mt-1 block w-full rounded-xl border-gray-200 shadow-sm transition-all duration-200 ease-in-out focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 bg-white/90 backdrop-blur-sm text-gray-700";
  const labelClasses = "block text-sm font-medium text-gray-700";

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-2xl mx-auto my-4 p-4 sm:p-8 transform transition-all duration-300 scale-100 animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Download Your Calculation
            </h2>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Enter your details to receive a detailed PDF of your visa cost calculation
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="fullName" className={labelClasses}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="fullName"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.fullName}
                  onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="phone" className={labelClasses}>
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.phone}
                  onChange={handlePhoneChange}
                  placeholder="0400 000 000"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Format: 0400 000 000 or +61 400 000 000</p>
            </div>

            <div className="col-span-2">
              <label htmlFor="email" className={labelClasses}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="col-span-2">
              <label htmlFor="streetAddress" className={labelClasses}>
                Street Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="streetAddress"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.streetAddress}
                  onChange={(e) => setDetails({ ...details, streetAddress: e.target.value })}
                  placeholder="123 Example Street"
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="city" className={labelClasses}>
                City/Suburb
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="city"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.city}
                  onChange={(e) => setDetails({ ...details, city: e.target.value })}
                  placeholder="Adelaide"
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="state" className={labelClasses}>
                State
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPinned className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="state"
                  required
                  className={`${inputClasses} pl-10`}
                  value={details.state}
                  onChange={(e) => setDetails({ ...details, state: e.target.value })}
                >
                  {australianStates.map(state => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="postcode" className={labelClasses}>
                Post Code
              </label>
              <input
                type="text"
                id="postcode"
                required
                pattern="[0-9]{4}"
                maxLength={4}
                className={inputClasses}
                value={details.postcode}
                onChange={(e) => setDetails({ ...details, postcode: e.target.value })}
                placeholder="5000"
              />
              <p className="mt-1 text-xs text-gray-500">Australian postcodes are 4 digits</p>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="country" className={labelClasses}>
                Country
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="country"
                  required
                  readOnly
                  className={`${inputClasses} pl-10 bg-gray-50`}
                  value={details.country}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              Download PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}