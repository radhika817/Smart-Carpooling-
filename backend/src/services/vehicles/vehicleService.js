import { Vehicle } from '../../models/Vehicle.js';

export const createVehicle = async ({ ownerId, model, registrationNumber, type, seats, image }) => {
  const vehicle = await Vehicle.create({
    owner: ownerId,
    model: model.trim(),
    registrationNumber: registrationNumber.trim().toUpperCase(),
    type: type || 'sedan',
    seats: seats || 4,
    image: image || undefined,
  });
  return vehicle;
};

export const getVehiclesByOwner = async (ownerId) => {
  return await Vehicle.find({ owner: ownerId }).sort({ createdAt: -1 });
};

export const getVehicleById = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    const error = new Error('Vehicle not found.');
    error.statusCode = 404;
    throw error;
  }
  return vehicle;
};

export const updateVehicle = async (vehicleId, ownerId, updateData) => {
  const vehicle = await getVehicleById(vehicleId);

  if (vehicle.owner.toString() !== ownerId.toString()) {
    const error = new Error('Forbidden: You can only update your own vehicles.');
    error.statusCode = 403;
    throw error;
  }

  if (updateData.registrationNumber) {
    updateData.registrationNumber = updateData.registrationNumber.trim().toUpperCase();
  }
  if (updateData.model) {
    updateData.model = updateData.model.trim();
  }

  Object.assign(vehicle, updateData);
  await vehicle.save();
  return vehicle;
};

export const deleteVehicle = async (vehicleId, ownerId) => {
  const vehicle = await getVehicleById(vehicleId);

  if (vehicle.owner.toString() !== ownerId.toString()) {
    const error = new Error('Forbidden: You can only delete your own vehicles.');
    error.statusCode = 403;
    throw error;
  }

  await Vehicle.findByIdAndDelete(vehicleId);
  return { success: true, message: 'Vehicle deleted successfully.' };
};
