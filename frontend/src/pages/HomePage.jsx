import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  MapPin, 
  ShieldCheck, 
  Leaf, 
  DollarSign, 
  Users, 
  ArrowRight, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge (Clean sentence case, high contrast) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold mb-6 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Smart carpooling for campus & workplace communities</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]"
          >
            Commute Smarter.{' '}
            <span className="text-brand-700">
              Share the Ride.
            </span>{' '}
            Cut Costs.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
          >
            Connect with verified peers traveling along your exact route. Split fuel and toll costs,
            enjoy comfortable shared journeys, and shrink your campus carbon footprint.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-center space-x-2 text-base group"
              >
                <span>Go to your dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-center space-x-2 text-base group"
                >
                  <span>Join SmartRide free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all text-base text-center"
                >
                  Sign in to account
                </Link>
              </>
            )}
          </motion.div>

          {/* Highlights bar */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Atomic Booking</span>
                <span className="text-slate-600">Zero double-booking races</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">4-Factor Matching</span>
                <span className="text-slate-600">Route, time, pickup score</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-sunrise-700 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">SOS & Live Track</span>
                <span className="text-slate-600">Time-boxed ride privacy</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Real-time Chat</span>
                <span className="text-slate-600">Socket.IO ride namespaces</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-16 bg-white/60 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Built for campus communities & workplace commuters
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Say goodbye to overcrowded transit and costly solo commute expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-sunrise-50 border border-sunrise-200 flex items-center justify-center text-sunrise-700 mb-5">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Transparent Cost Sharing</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Fair splitting of fuel, toll, and parking expenses. Drivers offset commute costs while
                passengers enjoy rides at a fraction of private cab prices.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Safety-First Architecture</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Verified university/organization affiliations, mutual two-way reviews, SOS emergency
                triggers, and time-boxed revocable ride sharing.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 mb-5">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Measurable Green Impact</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Track personal and collective CO₂ avoided, vehicle-kilometers saved, and progress towards
                UN Sustainable Development Goals 11 & 13.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
