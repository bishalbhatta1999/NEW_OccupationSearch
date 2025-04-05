import React, { useState, useEffect } from 'react';
import {
  Calculator,
  DollarSign,
  AlertCircle,
  Search,
  CreditCard,
  Building2,
  UserPlus,
  UserMinus,
} from 'lucide-react';

////////////////////////////////////////////////////////////////////////////////
// 1) We store separate onshore states for primary, secondary, and children.
// 2) If subsequent_fee > 0, we show each group's onshore question. If yes, we ask
//    which previous visa. If not 'none', we multiply found.subsequent_fee by the #
//    of that category (1 primary, # of secondary, # of children).
// 3) We also show the nonInternetFee as a separate line if user chooses offline
//    lodging and if non_internet_fee>0 in the data.
////////////////////////////////////////////////////////////////////////////////

// The shape of data from your DB
interface VisaSubclass {
  visa_subclass: string;       // e.g., "500"
  visa_name: string;          // e.g., "Student Visa (Subclass 500)"
  base_fee: number;           // Base Application Charge
  subsequent_fee: number;     // Subsequent Temporary Application charge
  non_internet_fee: number;   // Non - Internet Application charge
  additional_adult_fee: number; // Additional Applicant 18 years or Over
  additional_child_fee: number; // Additional Applicant under 18 years
}

// We'll store the final computed fees in an interface for clarity
interface FeeBreakdown {
  baseFee: number;
  nonInternetFee: number;
  subsequentFeePrimary: number;
  subsequentFeeSecondary: number;
  subsequentFeeChildren: number;
  adultFee: number;
  childFee: number;
  surcharge: number;
  total: number;
}

// We track separate onshore states for primary, secondary, and children
interface FeeCalculatorState {
  selectedVisa: string;

  // Primary applicant onshore logic
  primaryInAustralia: boolean;
  primaryPreviousVisa: string;

  // Secondary onshore logic
  secondaryInAustralia: boolean;
  secondaryPreviousVisa: string;

  // Dependent Children onshore logic
  childrenInAustralia: boolean;
  childrenPreviousVisa: string;

  paymentMethod:
    | 'bpay'
    | 'paypal'
    | 'visa'
    | 'american_express'
    | 'mastercard'
    | 'unionpay';

  // Applicants
  applicants: {
    primary: boolean;
    secondary: number; // # of adult secondaries
    dependents: number; // # of child dependents
  };

  useOnlineApplication: boolean;
}

// Payment surcharges
const paymentSurcharges: { [key in FeeCalculatorState['paymentMethod']]: number } = {
  bpay: 0,
  paypal: 1.01,
  visa: 1.4,
  american_express: 1.4,
  mastercard: 1.4,
  unionpay: 1.69,
};

// Payment method icons
const paymentIcons: { [key in FeeCalculatorState['paymentMethod']]: React.ReactNode } = {
  bpay: <Building2 className="w-5 h-5" />,
  paypal: <span className="text-[22px] font-bold text-[#00457C]">P</span>,
  visa: <CreditCard className="w-5 h-5 text-[#1A1F71]" />,
  american_express: <CreditCard className="w-5 h-5 text-[#2E77BE]" />,
  mastercard: <CreditCard className="w-5 h-5 text-[#EB001B]" />,
  unionpay: <CreditCard className="w-5 h-5 text-[#DD0000]" />,
};

// Visas for onshore logic
const previousVisaOptions = [
  { value: 'none', label: "No, I haven't received visa, ONSHORE" },
  { value: '402_training_research_ot', label: '402 - Occupational Trainee stream' },
  { value: '402_training_research_r', label: '402 - Research stream' },
  { value: '407', label: '407 - Training visa' },
  { value: '408', label: '408 - Temporary Activity visa' },
  { value: '417', label: '417 - Working Holiday' },
  { value: '426', label: '426 - Domestic Worker (Diplomatic/Consular)' },
  { value: '442', label: '442 - Occupational Trainee' },
  { value: '457', label: '457 - Temporary Work (Skilled)' },
  { value: '462', label: '462 - Work and Holiday' },
  { value: '482', label: '482 - Temporary Skill Shortage (TSS)' },
  { value: '500', label: '500 - Student' },
  { value: '576', label: '576 - Foreign Affairs or Defence Sector' },
  { value: '600', label: '600 - Visitor' },
  { value: '602', label: '602 - Medical Treatment' },
  { value: '685', label: '685 - Medical Treatment (Long Stay)' },
];

// Safely parse an integer from a possibly comma-containing string
function parseCharge(str: string | undefined): number {
  if (!str) return 0;
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

const VisaFeeCalculator: React.FC = () => {
  const [visaSubclasses, setVisaSubclasses] = useState<VisaSubclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We store the final breakdown in state
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown>({
    baseFee: 0,
    nonInternetFee: 0,
    subsequentFeePrimary: 0,
    subsequentFeeSecondary: 0,
    subsequentFeeChildren: 0,
    adultFee: 0,
    childFee: 0,
    surcharge: 0,
    total: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [calculatorState, setCalculatorState] = useState<FeeCalculatorState>({
    selectedVisa: '',
    primaryInAustralia: false,
    primaryPreviousVisa: 'none',
    secondaryInAustralia: false,
    secondaryPreviousVisa: 'none',
    childrenInAustralia: false,
    childrenPreviousVisa: 'none',
    paymentMethod: 'bpay',
    applicants: {
      primary: true,
      secondary: 0,
      dependents: 0,
    },
    useOnlineApplication: true,
  });

  // 1) Fetch the data
  useEffect(() => {
    const fetchVisaData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          'https://occupation-search-default-rtdb.firebaseio.com/visas/.json'
        );
        if (!response.ok) throw new Error('Failed to fetch visa data');
        const data = await response.json();
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid API response format');
        }

        // parse the DB
        const processed: VisaSubclass[] = Object.values(data).map((item: any) => {
          const fullName = item['Visa Subclass'] || '';
          let extractedSubclass = '';
          const match = fullName.match(/\(Subclass\s*(\d+)\)/);
          if (match) {
            extractedSubclass = match[1];
          } else {
            extractedSubclass = fullName;
          }

          return {
            visa_subclass: extractedSubclass,
            visa_name: fullName,
            base_fee: parseCharge(item['Base Application Charge']),
            subsequent_fee: parseCharge(item['Subsequent Temporary Application charge']),
            non_internet_fee: parseCharge(item['Non - Internet Application charge']),
            additional_adult_fee: parseCharge(item['Additional Applicant 18 years and Over']),
            additional_child_fee: parseCharge(item['Additional Applicant under 18 years']),
          };
        });

        setVisaSubclasses(processed);
        if (processed.length > 0) {
          setCalculatorState((prev) => ({
            ...prev,
            selectedVisa: processed[0].visa_subclass,
          }));
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching visa data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load visa data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchVisaData();
  }, []);

  // 2) Filter logic for searching
  const filteredVisaSubclasses = visaSubclasses.filter((visa) => {
    const combined = (visa.visa_subclass + ' ' + visa.visa_name).toLowerCase();
    return combined.includes(searchQuery.toLowerCase());
  });

  // 3) Recompute fees whenever state changes
  useEffect(() => {
    setFeeBreakdown(calculateFees());
  }, [calculatorState, visaSubclasses]);

  // Calculation function
  const calculateFees = (): FeeBreakdown => {
    const found = visaSubclasses.find((v) => v.visa_subclass === calculatorState.selectedVisa);
    if (!found) {
      return {
        baseFee: 0,
        nonInternetFee: 0,
        subsequentFeePrimary: 0,
        subsequentFeeSecondary: 0,
        subsequentFeeChildren: 0,
        adultFee: 0,
        childFee: 0,
        surcharge: 0,
        total: 0,
      };
    }

    const baseFee = found.base_fee;

    const nonInternetFee =
      !calculatorState.useOnlineApplication && found.non_internet_fee > 0
        ? found.non_internet_fee
        : 0;

    // subsequent fee for primary
    let subsequentFeePrimary = 0;
    if (
      found.subsequent_fee > 0 &&
      calculatorState.primaryInAustralia &&
      calculatorState.primaryPreviousVisa !== 'none'
    ) {
      subsequentFeePrimary = found.subsequent_fee;
    }

    // subsequent fee for secondary
    let subsequentFeeSecondary = 0;
    if (
      found.subsequent_fee > 0 &&
      calculatorState.secondaryInAustralia &&
      calculatorState.secondaryPreviousVisa !== 'none' &&
      calculatorState.applicants.secondary > 0
    ) {
      subsequentFeeSecondary = found.subsequent_fee * calculatorState.applicants.secondary;
    }

    // subsequent fee for children
    let subsequentFeeChildren = 0;
    if (
      found.subsequent_fee > 0 &&
      calculatorState.childrenInAustralia &&
      calculatorState.childrenPreviousVisa !== 'none' &&
      calculatorState.applicants.dependents > 0
    ) {
      subsequentFeeChildren = found.subsequent_fee * calculatorState.applicants.dependents;
    }

    // additional fees
    const adultFee = found.additional_adult_fee * calculatorState.applicants.secondary;
    const childFee = found.additional_child_fee * calculatorState.applicants.dependents;

    const subtotal =
      baseFee +
      nonInternetFee +
      subsequentFeePrimary +
      subsequentFeeSecondary +
      subsequentFeeChildren +
      adultFee +
      childFee;

    const surchargeRate = paymentSurcharges[calculatorState.paymentMethod] || 0;
    const surcharge = (subtotal * surchargeRate) / 100;

    const total = subtotal + surcharge;

    return {
      baseFee,
      nonInternetFee,
      subsequentFeePrimary,
      subsequentFeeSecondary,
      subsequentFeeChildren,
      adultFee,
      childFee,
      surcharge,
      total,
    };
  };

  const formatCurrency = (val: number) => {
    return Number.isFinite(val) ? val.toFixed(2) : '0.00';
  };

  const downloadPDF = () => window.print();

  // The chosen visa
  const chosenVisa = visaSubclasses.find((v) => v.visa_subclass === calculatorState.selectedVisa);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Calculator className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Visa Fees Calculator{' '}
              {loading && <span className="text-sm text-gray-500">(Loading...)</span>}
            </h2>
            <p className="text-sm text-gray-600">Estimate your visa application costs</p>
          </div>
        </div>
        {error && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-amber-50 border-t border-amber-200">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search visa by name or subclass number..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filtered list if user typed something */}
            {searchQuery && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-h-64 overflow-y-auto">
                {filteredVisaSubclasses.map((visa, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCalculatorState((prev) => ({
                        ...prev,
                        selectedVisa: visa.visa_subclass,
                      }));
                      setSearchQuery('');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      Subclass {visa.visa_subclass}
                    </div>
                    <div className="text-sm text-gray-600">{visa.visa_name}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected visa display */}
            {calculatorState.selectedVisa && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-900">Selected Visa</h4>
                <p className="text-blue-800">
                  Subclass {calculatorState.selectedVisa} – {chosenVisa?.visa_name}
                </p>
              </div>
            )}

            {/* If non_internet_fee>0, show lodging online question */}
            {chosenVisa && chosenVisa.non_internet_fee > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Lodgement Mode</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Will you be lodging your application online?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() =>
                      setCalculatorState((prev) => ({
                        ...prev,
                        useOnlineApplication: true,
                      }))
                    }
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                      calculatorState.useOnlineApplication
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() =>
                      setCalculatorState((prev) => ({
                        ...prev,
                        useOnlineApplication: false,
                      }))
                    }
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                      !calculatorState.useOnlineApplication
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {/* If subsequent_fee>0, show onshore logic for primary, secondary, children */}
            {chosenVisa && chosenVisa.subsequent_fee > 0 && (
              <div className="border-t pt-4 space-y-8">
                {/* Primary Onshore? */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Will the PRIMARY applicant be in Australia when lodging?
                  </h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          primaryInAustralia: true,
                          primaryPreviousVisa: 'none',
                        }))
                      }
                      className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                        calculatorState.primaryInAustralia
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          primaryInAustralia: false,
                          primaryPreviousVisa: 'none',
                        }))
                      }
                      className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                        !calculatorState.primaryInAustralia
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      No
                    </button>
                  </div>

                  {calculatorState.primaryInAustralia && (
                    <div className="mt-4">
                      <h4 className="text-base font-semibold text-gray-800 mb-2">
                        (PRIMARY) Does the applicant hold any of these visas?
                      </h4>
                      <select
                        className="block w-full max-w-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        value={calculatorState.primaryPreviousVisa}
                        onChange={(e) => {
                          setCalculatorState((prev) => ({
                            ...prev,
                            primaryPreviousVisa: e.target.value,
                          }));
                        }}
                      >
                        {previousVisaOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Secondary Onshore? if there's at least 1 secondary */}
                {calculatorState.applicants.secondary > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Will the SECONDARY applicant(s) be in Australia when lodging?
                    </h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          setCalculatorState((prev) => ({
                            ...prev,
                            secondaryInAustralia: true,
                            secondaryPreviousVisa: 'none',
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          calculatorState.secondaryInAustralia
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() =>
                          setCalculatorState((prev) => ({
                            ...prev,
                            secondaryInAustralia: false,
                            secondaryPreviousVisa: 'none',
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          !calculatorState.secondaryInAustralia
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        No
                      </button>
                    </div>

                    {calculatorState.secondaryInAustralia && (
                      <div className="mt-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-2">
                          (SECONDARY) Do these applicant(s) hold any of the below visas?
                        </h4>
                        <select
                          className="block w-full max-w-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={calculatorState.secondaryPreviousVisa}
                          onChange={(e) => {
                            setCalculatorState((prev) => ({
                              ...prev,
                              secondaryPreviousVisa: e.target.value,
                            }));
                          }}
                        >
                          {previousVisaOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Children Onshore? if there's at least 1 child */}
                {calculatorState.applicants.dependents > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Will the DEPENDENT CHILDREN be in Australia when lodging?
                    </h3>
                    <div className="flex gap-4">
                      <button
                        onClick={() =>
                          setCalculatorState((prev) => ({
                            ...prev,
                            childrenInAustralia: true,
                            childrenPreviousVisa: 'none',
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          calculatorState.childrenInAustralia
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() =>
                          setCalculatorState((prev) => ({
                            ...prev,
                            childrenInAustralia: false,
                            childrenPreviousVisa: 'none',
                          }))
                        }
                        className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                          !calculatorState.childrenInAustralia
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        No
                      </button>
                    </div>

                    {calculatorState.childrenInAustralia && (
                      <div className="mt-4">
                        <h4 className="text-base font-semibold text-gray-800 mb-2">
                          (CHILDREN) Do these dependents hold any of the below visas?
                        </h4>
                        <select
                          className="block w-full max-w-sm p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={calculatorState.childrenPreviousVisa}
                          onChange={(e) => {
                            setCalculatorState((prev) => ({
                              ...prev,
                              childrenPreviousVisa: e.target.value,
                            }));
                          }}
                        >
                          {previousVisaOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Applicants: Secondary & Dependent Children */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Applicants</h3>
              <div className="space-y-4">
                {/* Secondary Applicants (18 years or above) */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Secondary Applicants (18 years or above)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          applicants: {
                            ...prev.applicants,
                            secondary: Math.max(0, prev.applicants.secondary - 1),
                          },
                        }))
                      }
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <UserMinus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {calculatorState.applicants.secondary}
                    </span>
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          applicants: {
                            ...prev.applicants,
                            secondary: prev.applicants.secondary + 1,
                          },
                        }))
                      }
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <UserPlus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Dependent Children */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Dependent Children (under 18 years of age)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          applicants: {
                            ...prev.applicants,
                            dependents: Math.max(0, prev.applicants.dependents - 1),
                          },
                        }))
                      }
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <UserMinus className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {calculatorState.applicants.dependents}
                    </span>
                    <button
                      onClick={() =>
                        setCalculatorState((prev) => ({
                          ...prev,
                          applicants: {
                            ...prev.applicants,
                            dependents: prev.applicants.dependents + 1,
                          },
                        }))
                      }
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <UserPlus className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Method</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(paymentSurcharges).map(([method, surcharge]) => (
                  <button
                    key={method}
                    onClick={() =>
                      setCalculatorState((prev) => ({
                        ...prev,
                        paymentMethod: method as FeeCalculatorState['paymentMethod'],
                      }))
                    }
                    className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-200 ${
                      calculatorState.paymentMethod === method
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {paymentIcons[method as keyof typeof paymentIcons]}
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {method
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </div>
                      <div className="text-xs text-gray-500">{surcharge}% fee</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Fee Breakdown */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Fee Breakdown</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Primary Applicant Base Fee</span>
                  <span className="font-medium">AUD {formatCurrency(feeBreakdown.baseFee)}</span>
                </div>

                {feeBreakdown.nonInternetFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Non-Internet Lodgement Fee</span>
                    <span className="font-medium">
                      AUD {formatCurrency(feeBreakdown.nonInternetFee)}
                    </span>
                  </div>
                )}

                {feeBreakdown.subsequentFeePrimary > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subsequent Fee (Primary)</span>
                    <span className="font-medium">
                      AUD {formatCurrency(feeBreakdown.subsequentFeePrimary)}
                    </span>
                  </div>
                )}

                {feeBreakdown.subsequentFeeSecondary > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subsequent Fee (Secondary)</span>
                    <span className="font-medium">
                      AUD {formatCurrency(feeBreakdown.subsequentFeeSecondary)}
                    </span>
                  </div>
                )}

                {feeBreakdown.subsequentFeeChildren > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subsequent Fee (Children)</span>
                    <span className="font-medium">
                      AUD {formatCurrency(feeBreakdown.subsequentFeeChildren)}
                    </span>
                  </div>
                )}

                {feeBreakdown.adultFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Additional Adult Applicants</span>
                    <span className="font-medium">AUD {formatCurrency(feeBreakdown.adultFee)}</span>
                  </div>
                )}

                {feeBreakdown.childFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dependent Children (under 18)</span>
                    <span className="font-medium">AUD {formatCurrency(feeBreakdown.childFee)}</span>
                  </div>
                )}

                {feeBreakdown.surcharge > 0 && (
                  <div className="flex justify-between items-center border-t pt-4">
                    <span className="text-gray-600">
                      Payment Surcharge ({paymentSurcharges[calculatorState.paymentMethod]}%)
                    </span>
                    <span className="font-medium">
                      AUD {formatCurrency(feeBreakdown.surcharge)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center border-t pt-4">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-xl text-blue-600">
                    AUD {formatCurrency(feeBreakdown.total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={downloadPDF}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Download Fee Breakdown (PDF)
            </button>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Fees are subject to change. Always verify the final amount on the official
                  Department of Home Affairs website.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaFeeCalculator;
