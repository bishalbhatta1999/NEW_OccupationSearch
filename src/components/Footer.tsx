import React from 'react';
import { Search, Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Column */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <span className="font-bold text-lg sm:text-xl">Occupation Search</span>
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted source for ANZSCO occupation information and migration pathways.
            </p>
            <div className="flex justify-center sm:justify-start space-x-3 sm:space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary">About Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Features</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Pricing</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Contact</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">API Reference</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Updates</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Terms of Service</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Cookie Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary">Disclaimer</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Occupation Search. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
              <a href="#" className="text-gray-600 hover:text-primary text-sm">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-primary text-sm">Terms</a>
              <a href="#" className="text-gray-600 hover:text-primary text-sm">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;