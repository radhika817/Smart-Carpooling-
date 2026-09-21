import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Compass, PlusCircle, LayoutDashboard, LogOut, Menu, X, ShieldCheck, BarChart3, Users } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Car className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                SmartRide
              </span>
              <span className="text-[10px] tracking-wider font-bold text-brand-600 -mt-1">
                Campus & Commute
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/search"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/search')
                  ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <Compass className="w-4 h-4 text-brand-600" />
              <span>Find ride</span>
            </Link>

            {user?.role === 'driver' && (
              <>
                <Link
                  to="/create-ride"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive('/create-ride')
                      ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-brand-600" />
                  <span>Post ride</span>
                </Link>

                <Link
                  to="/vehicles"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive('/vehicles')
                      ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <Car className="w-4 h-4 text-sunrise-600" />
                  <span>Vehicles</span>
                </Link>
              </>
            )}

            <Link
              to="/groups"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/groups') || location.pathname.startsWith('/groups/')
                  ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <Users className="w-4 h-4 text-brand-600" />
              <span>Groups</span>
            </Link>

            <Link
              to="/dashboard"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/dashboard')
                  ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-slate-600" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/admin/analytics"
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive('/admin/analytics')
                  ? 'bg-brand-50 text-brand-800 font-semibold border border-brand-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-brand-600" />
              <span>Analytics</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive('/admin')
                    ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs'
                    : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin console</span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 pl-3 pr-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize flex items-center gap-1">
                      {user?.role}
                      {user?.organization && (
                        <span className="text-slate-400">• {user.organization}</span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow transition-all duration-200"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-elevated">
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Find ride</span>
          </Link>

          {user?.role === 'driver' && (
            <>
              <Link
                to="/create-ride"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
              >
                <PlusCircle className="w-4 h-4 text-brand-600" />
                <span>Post ride</span>
              </Link>
              <Link
                to="/vehicles"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
              >
                <Car className="w-4 h-4 text-sunrise-600" />
                <span>Vehicles</span>
              </Link>
            </>
          )}

          <Link
            to="/groups"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
          >
            <Users className="w-4 h-4 text-brand-600" />
            <span>Carpool groups</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-slate-600" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/admin/analytics"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center space-x-2 py-2 text-slate-700 hover:text-brand-600 font-medium text-sm"
          >
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span>Platform analytics</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2 py-2 text-purple-700 hover:text-purple-900 font-bold text-sm"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin console</span>
            </Link>
          )}

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="text-xs text-slate-600">
                Signed in as <strong className="text-slate-900">{user?.name}</strong> ({user?.role})
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-sm font-semibold hover:bg-rose-100 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 flex flex-col space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center text-sm font-bold text-white bg-brand-500 rounded-xl hover:bg-brand-600 shadow-sm transition"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
