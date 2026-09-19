/**
 * PURE FUNCTION BOUNDARY: Fair Cost-Sharing Engine (system.md §3.4)
 * 
 * Non-commercial peer-to-peer carpooling cost calculation.
 * Ensures drivers do not make a commercial profit while passengers contribute
 * an equitable, transparent share of fuel, toll, parking, and maintenance expenses.
 * 
 * Formula:
 * Total Cost C_total = fuel + toll + parking + other
 * Total Occupants = 1 (driver) + passengerCount (or offered seats)
 * Cost per passenger = Math.round(C_total / Total Occupants)
 * Driver absorption = C_total - (Cost per passenger * passengerCount)
 */

/**
 * Calculate fair cost split among driver and passengers.
 * 
 * @param {Object} options
 * @param {number} options.fuel - Estimated fuel expense in INR
 * @param {number} options.toll - Toll plaza charges in INR
 * @param {number} options.parking - Parking charges in INR
 * @param {number} options.other - Maintenance/incidental allowance in INR
 * @param {number} options.seatsOffered - Number of passenger seats offered (default 3)
 * @param {number} [options.passengerCount] - Actual joined passengers (optional; defaults to seatsOffered)
 * @returns {Object} Cost split calculation and itemized breakdown
 */
export const calculateCostSplit = ({
  fuel = 0,
  toll = 0,
  parking = 0,
  other = 0,
  seatsOffered = 3,
  passengerCount = null,
} = {}) => {
  const f = Math.max(0, Number(fuel) || 0);
  const t = Math.max(0, Number(toll) || 0);
  const p = Math.max(0, Number(parking) || 0);
  const o = Math.max(0, Number(other) || 0);

  const totalCost = Math.round((f + t + p + o) * 100) / 100;
  
  // Occupants = 1 driver + participating passengers
  const activePassengers = Math.max(1, passengerCount !== null && passengerCount !== undefined ? Number(passengerCount) : Number(seatsOffered) || 1);
  const totalOccupants = 1 + activePassengers;

  // Split evenly among all occupants (driver + passengers)
  const exactCostPerPerson = totalOccupants > 0 ? totalCost / totalOccupants : 0;
  const costPerPassenger = Math.round(exactCostPerPerson);

  // Total collected from passengers
  const totalPassengerContribution = costPerPassenger * activePassengers;
  
  // Driver absorbs their own share (and any rounding difference)
  const driverShare = Math.max(0, Math.round((totalCost - totalPassengerContribution) * 100) / 100);

  // Itemized breakdown per passenger
  const itemizedPerPassenger = {
    fuel: Math.round((f / totalOccupants) * 100) / 100,
    toll: Math.round((t / totalOccupants) * 100) / 100,
    parking: Math.round((p / totalOccupants) * 100) / 100,
    other: Math.round((o / totalOccupants) * 100) / 100,
  };

  const formula = totalCost > 0
    ? `₹${totalCost} total expense ÷ ${totalOccupants} occupants (1 driver + ${activePassengers} passenger${activePassengers > 1 ? 's' : ''}) = ₹${costPerPassenger} per passenger`
    : 'No expenses entered';

  return {
    totalCost,
    activePassengers,
    totalOccupants,
    costPerPassenger,
    totalPassengerContribution,
    driverShare,
    breakdown: {
      total: {
        fuel: f,
        toll: t,
        parking: p,
        other: o,
      },
      itemizedPerPassenger,
    },
    formula,
    isFairSharing: true,
  };
};

/**
 * Estimate fuel cost from driving distance and vehicle fuel efficiency.
 *
 * @param {number} distanceKm - Road trip distance in km
 * @param {number} mileageKmPerLitre - Vehicle mileage (default 15 km/l)
 * @param {number} fuelPricePerLitre - Fuel price in INR/L (default ₹105)
 * @returns {number} Estimated fuel cost in INR
 */
export const estimateFuelCost = (
  distanceKm,
  mileageKmPerLitre = 15,
  fuelPricePerLitre = 105
) => {
  if (!distanceKm || distanceKm <= 0) return 0;
  const litresNeeded = distanceKm / Math.max(1, mileageKmPerLitre);
  return Math.round(litresNeeded * fuelPricePerLitre);
};
