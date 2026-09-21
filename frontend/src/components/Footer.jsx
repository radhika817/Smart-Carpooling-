import React from 'react';
import { Car, Shield, Leaf, Users } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-8 mt-auto shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center">
                <Car className="w-3.5 h-3.5 text-brand-600" />
              </div>
              <span className="font-bold text-slate-900">SmartRide</span>
            </div>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500">Verified Campus & Commute Mobility</span>
          </div>

          {/* Telemetry & Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Matching Engine Live
            </span>

            <span className="flex items-center gap-1.5 text-slate-600 hover:text-brand-700 transition">
              <Leaf className="w-3.5 h-3.5 text-brand-600" />
              SDG 11 & 13 Sustainable
            </span>

            <span className="flex items-center gap-1.5 text-slate-600 hover:text-brand-700 transition">
              <Shield className="w-3.5 h-3.5 text-brand-600" />
              Verified Community
            </span>

            <span className="flex items-center gap-1.5 text-slate-600 hover:text-sunrise-700 transition">
              <Users className="w-3.5 h-3.5 text-sunrise-600" />
              Campus Circles
            </span>
          </div>

          <div className="text-slate-500 text-right">
            &copy; {new Date().getFullYear()} SmartRide. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
