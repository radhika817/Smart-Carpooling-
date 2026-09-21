import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  CheckCircle2,
  Clock,
  Navigation,
  KeyRound,
  Radio,
  Sliders,
  ShieldAlert,
  Search,
  Check,
  Star,
  Building2,
  Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Quick launchpad state
  const [quickPickup, setQuickPickup] = useState('');
  const [quickDest, setQuickDest] = useState('');

  // Interactive Corridor & Fair-Split Simulator state
  const [simSeats, setSimSeats] = useState(3);
  const [simTimeOffset, setSimTimeOffset] = useState(0); // minutes delta

  // Dual-role perspective toggle state ('passenger' | 'driver')
  const [activeRolePerspective, setActiveRolePerspective] = useState('passenger');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (quickPickup.trim()) params.set('pickup', quickPickup.trim());
    if (quickDest.trim()) params.set('destination', quickDest.trim());
    navigate(`/search?${params.toString()}`);
  };

  // Live calculation for simulator
  const totalTripCost = 200; // Base fuel & toll for 22km Pune commute
  const totalOccupants = 1 + simSeats; // driver + passengers
  const calculatedPerSeat = Math.round(totalTripCost / totalOccupants);
  const commercialCabCost = 380;
  const passengerSavings = commercialCabCost - calculatedPerSeat;

  // Simulator match score calculation based on time offset
  const timeScore = Math.max(10, 25 - Math.abs(simTimeOffset) * 0.5);
  const overallMatchPct = Math.min(99, Math.round(38 + timeScore + 19 + 14));

  return (
    <div className="relative bg-canvas text-slate-900 overflow-hidden">
      {/* Subtle Background Structural Accent Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-40 [background-image:linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: HERO & LIVE COMMUTE SHOWCASE */}
      {/* ---------------------------------------------------- */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & Quick Launchpad */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Smart Carpooling for Campus & Workplace Communities</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
            >
              Commute Smarter.{' '}
              <span className="text-brand-700">Share the Ride.</span>{' '}
              Cut Costs.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed"
            >
              Connect with verified peers traveling along your exact daily route.
              Split fuel and toll expenses transparently, enjoy comfortable shared journeys,
              and track every kilometer live with atomic safety controls.
            </motion.p>

            {/* Quick Trip Launchpad Form (Solid Tier-1 Card) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand-600" />
                  Quick route finder
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Instant corridor lookup</span>
              </div>

              <form onSubmit={handleQuickSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5 relative">
                  <MapPin className="w-4 h-4 text-brand-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pickup (e.g. Shivajinagar)"
                    value={quickPickup}
                    onChange={(e) => setQuickPickup(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-brand-600 focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-5 relative">
                  <MapPin className="w-4 h-4 text-sunrise-700 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Drop-off (e.g. Hinjewadi Phase 1)"
                    value={quickDest}
                    onChange={(e) => setQuickDest(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-brand-600 focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full h-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Core Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-6 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition flex items-center gap-2 text-sm group"
                >
                  <span>Go to your dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-6 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition flex items-center gap-2 text-sm group"
                  >
                    <span>Get started free</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/search"
                    className="px-6 py-3 rounded-xl font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-xs transition text-sm"
                  >
                    Browse active rides
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          {/* Right Column: Authentic Live Commute Card Showcase */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-5 relative"
            >
              {/* Card Header: Driver Identity & Verified Trust */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-base border border-brand-200">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-slate-900">Rohit K.</h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Honda City • Pune Tech Park Circle
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>4.9</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">48 commutes</span>
                </div>
              </div>

              {/* Physical Route Corridor Timeline */}
              <div className="space-y-4 relative pl-2">
                {/* Connecting Track Line */}
                <div className="absolute left-[17px] top-3 bottom-3 w-0.5 bg-slate-200 border-l border-dashed border-slate-300" />

                {/* Origin */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-emerald-800 text-[10px] font-bold shadow-xs">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Shivajinagar Bus Station</span>
                      <span className="text-xs font-semibold text-slate-500">08:30 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Pickup at Platform 3 Gate</p>
                  </div>
                </div>

                {/* Destination */}
                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-6 h-6 rounded-full bg-sunrise-100 border-2 border-sunrise-600 flex items-center justify-center text-sunrise-800 text-[10px] font-bold shadow-xs">
                    B
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Hinjewadi Tech Park Phase 1</span>
                      <span className="text-xs font-semibold text-slate-500">09:12 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Main Campus North Circle</p>
                  </div>
                </div>
              </div>

              {/* Recessed Metric & Pricing Pill Bar (Level 2 Recessed Panel) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Fair Split</span>
                  <span className="text-sm font-black text-emerald-900">₹50</span>
                  <span className="text-[9px] text-emerald-700 block font-medium">per seat</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Availability</span>
                  <span className="text-sm font-black text-amber-900">2 open</span>
                  <span className="text-[9px] text-amber-700 block font-medium">of 4 total</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold">Live GPS</span>
                  <span className="text-sm font-black text-brand-800 flex items-center justify-center gap-1">
                    <Radio className="w-3 h-3 text-brand-600 animate-pulse" />
                    En route
                  </span>
                  <span className="text-[9px] text-slate-500 block">6 mins away</span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                to="/search"
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <span>View similar verified campus rides</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: INTERACTIVE CORRIDOR & FAIR-SPLIT SIMULATOR */}
      {/* ---------------------------------------------------- */}
      <section className="py-16 bg-white border-y border-slate-200/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Smart Matching & Pricing Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900">
              Interactive Route Corridor & Fair-Split Simulator
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Test how SmartRide's 4-factor matching engine pairs co-riders along real road corridors
              and divides fuel/toll costs automatically. Adjust seats and timing below to see live calculations.
            </p>
          </div>

          {/* Interactive Simulator Card (Level 1 Solid Card) */}
          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-canvas border border-slate-200/90 shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Interactive Controls */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-brand-600" />
                    Commute parameters
                  </h3>
                  <span className="text-[11px] text-slate-500">Live variables</span>
                </div>

                {/* Co-rider count selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Passenger co-riders sharing seats</span>
                    <span className="font-bold text-brand-700">{simSeats} passengers</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSimSeats(s)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          simSeats === s
                            ? 'bg-brand-50 border-brand-500 text-brand-800 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {s} {s === 1 ? 'seat' : 'seats'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Departure Time Delta Slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Departure time flexibility</span>
                    <span className="font-bold text-brand-700">
                      {simTimeOffset === 0 ? 'Exact departure' : `${simTimeOffset > 0 ? '+' : ''}${simTimeOffset} mins`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    step="5"
                    value={simTimeOffset}
                    onChange={(e) => setSimTimeOffset(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>30m earlier</span>
                    <span>Exact match</span>
                    <span>30m later</span>
                  </div>
                </div>

                {/* Route Corridor Info */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">Commute Corridor:</span>
                    <span>22.4 km (Pune West)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">Estimated Fuel & Toll:</span>
                    <span className="font-bold text-slate-900">₹200.00</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Calculated Algorithm Outputs */}
              <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-emerald-600" />
                      Matching & cost division
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                      {overallMatchPct}% Match
                    </span>
                  </div>

                  {/* 4-Factor Matching Score Breakdown Bar */}
                  <div className="space-y-2 pt-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600 font-medium">4-Factor compatibility score</span>
                      <span className="font-bold text-brand-800">{overallMatchPct}/100 pts</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${overallMatchPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Factoring 40% route geometry, 25% departure window, 20% pickup proximity, and 15% destination.
                    </p>
                  </div>

                  {/* Price Comparison Comparison Box */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                        SmartRide Share
                      </span>
                      <span className="text-2xl font-black text-emerald-950 block mt-1">
                        ₹{calculatedPerSeat}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-medium">₹200 ÷ {totalOccupants} people</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Private Solo Cab
                      </span>
                      <span className="text-2xl font-black text-slate-400 block mt-1 line-through">
                        ₹{commercialCabCost}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Standard commercial rate</span>
                    </div>
                  </div>
                </div>

                {/* Savings Banner */}
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-center justify-between text-amber-900 font-semibold">
                  <span>Your net savings per ride:</span>
                  <span className="text-sm font-black text-amber-950">₹{passengerSavings} saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: DUAL-ROLE PERSPECTIVE EXPERIENCE */}
      {/* ---------------------------------------------------- */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tailored for both sides of the commute
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Whether you have empty seats in your car or need an affordable, safe commute ride every morning.
          </p>

          {/* Perspective Toggle Buttons (Solid Pill) */}
          <div className="inline-flex p-1 rounded-xl bg-slate-200 border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveRolePerspective('passenger')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeRolePerspective === 'passenger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              I am a Commuter (Passenger)
            </button>
            <button
              type="button"
              onClick={() => setActiveRolePerspective('driver')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                activeRolePerspective === 'driver'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              I am a Car Owner (Driver)
            </button>
          </div>
        </div>

        {/* Perspective Content Switcher */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {activeRolePerspective === 'passenger' ? (
            <>
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Verified Peer Identity</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every driver is affiliated with a verified workplace or university campus with government
                  ID authentication and vehicle registration on file.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">4-Digit Security PIN</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You receive a unique verification PIN. Drivers cannot mark the trip as started until you
                  safely enter the vehicle and authenticate in person.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Radio className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Time-Boxed GPS Sharing</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Generate private tracking links for family. To protect your ongoing privacy, links automatically
                  expire and self-destruct once the trip concludes.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Automatic Cost Recovery</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Offset monthly fuel and toll bills naturally. Co-rider contributions are calculated and
                  reserved atomically with zero awkward cash conversations.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Community & Group Scope</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Optionally restrict your shared ride offers strictly to colleagues from your university
                  or organization circle for trusted familiarity.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-card space-y-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Recurring Commute Schedules</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Set your daily Mon–Fri commute route once. SmartRide automatically manages independent daily
                  occurrences, allowing flexible individual date cancellations.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: CALL TO ACTION */}
      {/* ---------------------------------------------------- */}
      <section className="py-16 bg-canvas border-t border-slate-200/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-card space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Ready to upgrade your daily commute?
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              Join students, faculty, and professionals already sharing rides, reducing carbon emissions,
              and cutting commute expenses in half.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm transition"
              >
                Create your account
              </Link>
              <Link
                to="/search"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-sm shadow-xs transition"
              >
                Search campus routes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
