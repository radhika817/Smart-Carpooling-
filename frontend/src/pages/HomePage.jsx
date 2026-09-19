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
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Smart Carpooling for Students & Workplace Teams</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]"
          >
            Commute Smarter.{' '}
            <span className="bg-gradient-to-r from-brand-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Share the Ride.
            </span>{' '}
            Cut Costs.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
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
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 hover:from-brand-400 hover:to-teal-400 shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 text-base group"
              >
                <span>Go to Your Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-brand-500 to-teal-500 text-slate-950 hover:from-brand-400 hover:to-teal-400 shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2 text-base group"
                >
                  <span>Join SmartRide Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all text-base text-center"
                >
                  Sign In to Account
                </Link>
              </>
            )}
          </motion.div>

          {/* Highlights bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Atomic Booking</span>
                <span className="text-slate-400">Zero double-booking races</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">4-Factor Matching</span>
                <span className="text-slate-400">Route, time, pickup score</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">SOS & Live Track</span>
                <span className="text-slate-400">Time-boxed ride privacy</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">Real-time Chat</span>
                <span className="text-slate-400">Socket.IO ride namespaces</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for Campus Communities & Workplace Commuters
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Say goodbye to overcrowded buses and costly solo fuel expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6 rounded-2xl glass-card-hover border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-5">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Transparent Cost Sharing</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Fair splitting of fuel, toll, and parking expenses. Drivers offset commute costs while
                passengers enjoy rides at a fraction of cab prices.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl glass-card-hover border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Safety-First Architecture</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Verified university/organization affiliations, mutual two-way reviews, SOS emergency
                triggers, and time-boxed revocable ride sharing.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl glass-card-hover border border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Measurable Green Impact</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
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
