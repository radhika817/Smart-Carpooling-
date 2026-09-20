import React from 'react';
import { Car, Shield, Leaf, Users } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 mt-auto shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-900">SmartRide</span>
            <span className="text-slate-500">— Share the journey, not just the destination.</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 hover:text-emerald-700 transition">
              <Leaf className="w-3.5 h-3.5 text-emerald-600" />
              SDG 11 & 13 Sustainable
            </span>
            <span className="flex items-center gap-1.5 hover:text-emerald-700 transition">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Verified Community
            </span>
            <span className="flex items-center gap-1.5 hover:text-sunrise-700 transition">
              <Users className="w-3.5 h-3.5 text-sunrise-600" />
              Campus & Work
            </span>
          </div>

          <div className="text-slate-400">
            &copy; {new Date().getFullYear()} SmartRide. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
