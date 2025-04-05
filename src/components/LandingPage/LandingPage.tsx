// import React, { useState, FC } from 'react';
// import { ArrowRight, XCircle, Search, Shield, CheckCircle2, Globe, Users } from 'lucide-react';
// import { Link } from 'react-router-dom';

// interface LandingPageProps {
//   onGetStarted: () => void;
//   onSignInClick: () => void;  // New prop to trigger the sign-in modal
// }

// const LandingPage: FC<LandingPageProps> = ({ onGetStarted, onSignInClick }) => {
//   const [email, setEmail] = useState('');
//   const [showSignIn, setShowSignIn] = useState(false);

//   // -----------------------------------------------------------------------
//   // 1. SIGN-IN MODAL
//   // -----------------------------------------------------------------------
//   const SignInModal = () => {
//     return (
//       <div
//         className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm"
//         aria-labelledby="modal-title"
//         role="dialog"
//         aria-modal="true"
//       >
//         {/* Modal Content */}
//         <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-8">
//           {/* Close Button */}
//           <button
//             onClick={() => setShowSignIn(false)}
//             className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
//             aria-label="Close sign in modal"
//           >
//             <XCircle className="w-6 h-6" />
//           </button>

//           <h2
//             className="text-2xl font-bold text-gray-800 mb-4"
//             id="modal-title"
//           >
//             Sign In
//           </h2>
//           <p className="text-gray-600 mb-6 text-sm">
//             Access your account, track your occupations, and stay updated.
//           </p>
//           <form
//             onSubmit={(e) => {
//               e.preventDefault();
//               // ... handle sign-in
//               setShowSignIn(false);
//             }}
//             className="flex flex-col space-y-4"
//           >
//             <input
//               type="email"
//               className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
//               placeholder="Email"
//               required
//             />
//             <input
//               type="password"
//               className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
//               placeholder="Password"
//               required
//             />
//             <button
//               type="submit"
//               className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md font-semibold shadow-lg hover:shadow-xl transition-all"
//             >
//               Sign In
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   };

//   // -----------------------------------------------------------------------
//   // 2. MAIN LANDING PAGE RENDER
//   // -----------------------------------------------------------------------
//   return (
//     <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50">
//       {/* ==================== HERO SECTION ==================== */}
//       <header className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
//         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-indigo-100 opacity-50" />
        
//         <div className="relative z-10 max-w-5xl mx-auto text-center">
//           {/* Landing Page Headline */}
//           <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-8">
//             Find Your Path to Australia
//           </h1>
//           <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
//             The most comprehensive platform for skilled migration pathways.
//             Start your journey with accurate occupation assessments and real-time visa eligibility.
//           </p>

//           {/* Feature Highlights */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
//             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-lg
//                           hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 rounded-lg bg-blue-100">
//                   <Search className="w-5 h-5 text-blue-600" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">Smart Search</h3>
//               </div>
//               <p className="text-gray-600">Find your occupation code instantly with our intelligent ANZSCO search</p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-lg
//                           hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 rounded-lg bg-green-100">
//                   <CheckCircle2 className="w-5 h-5 text-green-600" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">Visa Eligibility</h3>
//               </div>
//               <p className="text-gray-600">Get instant visa eligibility assessment based on your occupation</p>
//             </div>

//             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-200 shadow-lg
//                           hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="p-2 rounded-lg bg-purple-100">
//                   <Globe className="w-5 h-5 text-purple-600" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">Real-time Updates</h3>
//               </div>
//               <p className="text-gray-600">Stay updated with the latest occupation list changes and requirements</p>
//             </div>
//           </div>
//           {/* Auth Buttons */}
//           <div className="flex flex-col sm:flex-row gap-6 justify-center">
//             <button
//               onClick={() => setShowSignIn(true)}
//               className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl
//                        shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
//                        text-lg font-semibold flex items-center justify-center gap-3 group"
//             >
//               <Shield className="w-5 h-5" />
//               Sign In
//               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
//             </button>
//             <button
//               onClick={onSignInClick}
//               className="px-8 py-4 bg-white text-blue-600 rounded-xl border-2 border-blue-200
//                        shadow-lg hover:shadow-xl hover:border-blue-300 transition-all duration-300
//                        transform hover:-translate-y-1 text-lg font-semibold flex items-center justify-center gap-3"
//             >
//               <Users className="w-5 h-5" />
//               Create Account
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* ==================== CONDITIONAL SIGN IN MODAL ==================== */}
//       {showSignIn && <SignInModal />}
//     </div>
//   );
// };

// export default LandingPage;


import React, { useState, FC } from 'react';
import { ArrowRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Existing imports for your other sections/components
import FeatureGrid from './FeatureGrid';
import TrustIndicators from './TrustIndicators';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignInClick: () => void;  // New prop to trigger the sign-in modal
}

const LandingPage: FC<LandingPageProps> = ({ onGetStarted, onSignInClick }) => {
  const [email, setEmail] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);

  // -----------------------------------------------------------------------
  // 1. SIGN-IN MODAL
  // -----------------------------------------------------------------------
  const SignInModal = () => {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Content */}
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          {/* Close Button */}
          <button
            onClick={() => setShowSignIn(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Close sign in modal"
          >
            <XCircle className="w-6 h-6" />
          </button>

          <h2
            className="text-2xl font-bold text-gray-800 mb-4"
            id="modal-title"
          >
            Sign In
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Access your account, track your occupations, and stay updated.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // ... handle sign-in
              setShowSignIn(false);
            }}
            className="flex flex-col space-y-4"
          >
            <input
              type="email"
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Email"
              required
            />
            <input
              type="password"
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Password"
              required
            />
            <button
              type="submit"
              className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  };

  // -----------------------------------------------------------------------
  // 2. MAIN LANDING PAGE RENDER
  // -----------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative">
      {/* ==================== HERO SECTION ==================== */}
      <header className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 pointer-events-none z-0" />
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Landing Page Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
            Occupation Search 
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
            Discover your occupational eligibility for Australian migration in one click.
            The most accurate Skilled Occupation tool—right at your fingertips.
          </p>

          {/* Hero Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white 
                       bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg 
                       hover:shadow-xl transition-transform duration-200 group"
            >
              Try Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={onSignInClick}  // Use the passed prop to trigger the Sign In modal
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold 
                       text-blue-600 bg-white border border-blue-200 rounded-xl shadow-lg 
                       hover:shadow-xl hover:border-blue-300 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* ==================== FEATURES SECTION ==================== */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              What Gives Us the Extra Edge?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Discover how our powerful tool simplifies Australian immigration processes.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of migration professionals who trust our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 border border-blue-200 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== WHO TRUSTS US / TRUST INDICATORS ==================== */}
      <section className="py-12 px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <TrustIndicators />
        </div>
      </section>

      {/* ==================== NEWSLETTER SECTION ==================== */}
      <section className="py-20 px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stay Updated with Immigration News
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Get the latest visa updates, occupation list changes, and industry insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-6 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                // Example newsletter signup
                alert(`Thanks for subscribing, ${email}!`);
                setEmail('');
              }}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* ==================== CONDITIONAL SIGN IN MODAL ==================== */}
      {showSignIn && <SignInModal />}
    </div>
  );
};

export default LandingPage;
