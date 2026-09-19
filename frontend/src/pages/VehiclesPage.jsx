import React, { useState, useEffect } from 'react';
import { vehicleService } from '../services/vehicleService';
import { Car, Plus, Trash2, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    model: '',
    registrationNumber: '',
    type: 'sedan',
    seats: 4,
    image: '',
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      setVehicles(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'seats' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await vehicleService.createVehicle(formData);
      setSuccess('Vehicle registered successfully!');
      setShowAddModal(false);
      setFormData({
        model: '',
        registrationNumber: '',
        type: 'sedan',
        seats: 4,
        image: '',
      });
      fetchVehicles();
    } catch (err) {
      setError(err.message || 'Failed to register vehicle');
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    setError('');

    try {
      await vehicleService.deleteVehicle(vehicleId);
      setSuccess('Vehicle removed successfully');
      fetchVehicles();
    } catch (err) {
      setError(err.message || 'Failed to delete vehicle');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
            <Car className="w-8 h-8 text-brand-400" />
            My Registered Vehicles
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Register and manage the vehicles you use to offer shared rides.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Add Vehicle
        </button>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Vehicle Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading your vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="mt-12 text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No vehicles added yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            To post rides and offer seats, add your car or two-wheeler details below.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 font-semibold text-sm border border-slate-700 transition"
          >
            <Plus className="w-4 h-4" /> Register First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {vehicles.map((v) => (
            <div
              key={v._id}
              className="glass-card p-6 rounded-2xl border border-slate-800 relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/20">
                    {v.type}
                  </span>
                  <button
                    onClick={() => handleDelete(v._id)}
                    className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                    title="Delete Vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-bold text-white mt-4">{v.model}</h3>
                <p className="text-xs font-mono font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                  {v.registrationNumber}
                </p>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                  <span>Passenger Capacity</span>
                  <span className="font-bold text-white">{v.seats} Seats</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center text-xs text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Ready for Ride Offers
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-extrabold text-white">Add New Vehicle</h3>
            <p className="text-slate-400 text-xs mt-1">Enter your vehicle details to verify ownership.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  placeholder="e.g. Honda City ZX, Hyundai i20"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  required
                  placeholder="e.g. MH 12 AB 1234"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white uppercase focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="hatchback">Hatchback</option>
                    <option value="suv">SUV</option>
                    <option value="bike">Two-Wheeler</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Passenger Seats
                  </label>
                  <input
                    type="number"
                    name="seats"
                    min="1"
                    max="8"
                    value={formData.seats}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm transition"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
