import React, { FC } from 'react';
import { Mail, Phone, MapPin, Facebook, Linkedin, Twitter } from 'lucide-react';

const ContactSection: FC = () => {
  return (
    <section className="py-20 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            We're Here to Help
          </h2>
          <p className="text-xl text-gray-600">
            Get in touch with our team for any questions or support
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600">info@occupationsearch.com.au</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <p className="text-gray-600">+61 400 123 456</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                <p className="text-gray-600">Level 5, 123 Main Street<br />Sydney, NSW, 2000</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-8 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="p-3 rounded-lg bg-gray-100 hover:bg-blue-100 transition-colors">
                  <Facebook className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                </a>
                <a href="#" className="p-3 rounded-lg bg-gray-100 hover:bg-blue-100 transition-colors">
                  <Linkedin className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                </a>
                <a href="#" className="p-3 rounded-lg bg-gray-100 hover:bg-blue-100 transition-colors">
                  <Twitter className="w-6 h-6 text-gray-600 hover:text-blue-600" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-gray-50 p-8 rounded-xl">
            <h3 className="text-xl font-semibold mb-6">Submit your inquiry</h3>
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  placeholder="Your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Your message"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;