import React from 'react';
import { Car, Heart, Shield, Leaf, Users } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Car className="w-4 h-4 text-brand-400" />
            <span className="font-semibold text-slate-200">SmartRide</span>
            <span>— Share the journey, not just the destination.</span>
          </div>

          <div className="flex items-center space-x-6 text-slate-400">
            <span className="flex items-center gap-1.5 hover:text-brand-300">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              SDG 11 & 13 Sustainable
            </span>
            <span className="flex items-center gap-1.5 hover:text-brand-300">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              Verified Community
            </span>
            <span className="flex items-center gap-1.5 hover:text-brand-300">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Campus & Work
            </span>
          </div>

          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} SmartRide. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
