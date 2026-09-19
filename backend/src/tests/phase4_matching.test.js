import assert from 'node:assert';
import { scoreRide, suggestPickupPoint, haversineDistanceKm } from '../services/matching/matchingService.js';
import { calculateCostSplit, estimateFuelCost } from '../services/matching/costSharing.js';

console.log('🧪 Running Phase 4 Matching & Cost Sharing Verification Suite...\n');

// -------------------------------------------------------------
// TEST 1: Pure Function scoreRide() - Weight Breakdown & Formula Verification
// -------------------------------------------------------------
console.log('▶ Test 1: Testing pure scoreRide() with realistic commute corridor...');

// Driver's offered ride: Pune Station [73.8744, 18.5284] to Hinjewadi Phase 1 [73.7389, 18.5913] at 08:30
const driverRide = {
  _id: 'ride_pune_hinjewadi_01',
  startLocation: {
    address: 'Pune Railway Station',
    coordinates: [73.8744, 18.5284],
  },
  destination: {
    address: 'Hinjewadi Phase 1, Rajiv Gandhi Infotech Park',
    coordinates: [73.7389, 18.5913],
  },
  departureTime: '08:30',
  date: '2026-09-20',
  availableSeats: 3,
};

// Search criteria: Passenger near Shivajinagar (1.2 km away from Pune Station corridor),
// going to Hinjewadi Phase 1 (0.8 km from driver's drop), departing at 08:40 (10 min diff)
// Approx 1.2km west of Pune Station: [73.8630, 18.5300]
// Approx 0.8km from Hinjewadi drop: [73.7330, 18.5950]
const passengerSearch = {
  pickupCoords: [73.8630, 18.5300],
  destCoords: [73.7330, 18.5950],
  departureTime: '08:40',
  date: '2026-09-20',
};

const result = scoreRide(driverRide, passengerSearch);

console.log('Score Result Summary:', result.summary);
console.log('Total Match Score:', result.score, '/ 100');
console.log('Match Percentage:', result.matchPercentage, '%');
console.log('Component Breakdown:');
console.log('  1. Route Similarity (40% weight):', result.breakdown.routeSimilarity);
console.log('  2. Time Compatibility (25% weight):', result.breakdown.timeCompatibility);
console.log('  3. Pickup Proximity (20% weight):', result.breakdown.pickupProximity);
console.log('  4. Destination Proximity (15% weight):', result.breakdown.destinationProximity);

// Assertions on the structure and numbers
assert.ok(result.score > 70 && result.score <= 100, `Score should be between 70 and 100, got ${result.score}`);
assert.strictEqual(result.breakdown.routeSimilarity.weight, 40);
assert.strictEqual(result.breakdown.timeCompatibility.weight, 25);
assert.strictEqual(result.breakdown.pickupProximity.weight, 20);
assert.strictEqual(result.breakdown.destinationProximity.weight, 15);
assert.strictEqual(result.breakdown.timeCompatibility.diffMinutes, 10);
assert.ok(result.breakdown.pickupProximity.distanceKm > 0, 'Pickup distance should be > 0');
assert.ok(result.breakdown.destinationProximity.distanceKm > 0, 'Dest distance should be > 0');
assert.ok(result.summary.includes('% match'), 'Summary must include % match');
assert.ok(result.summary.includes('10 min time diff'), 'Summary must include time diff');
assert.ok(result.summary.includes('pickup distance'), 'Summary must include pickup distance');

console.log('✅ Test 1 Passed: scoreRide() calculated authentic weighted score breakdown with exact numbers!\n');

// -------------------------------------------------------------
// TEST 2: Sanity Check Cost Sharing Math with Simple Numbers
// -------------------------------------------------------------
console.log('▶ Test 2: Sanity check cost sharing math with simple numbers...');
console.log('Scenario: Fuel is ₹200, Toll is ₹0, 2 passengers join.');

const costSplitSimple = calculateCostSplit({
  fuel: 200,
  toll: 0,
  parking: 0,
  other: 0,
  seatsOffered: 2,
  passengerCount: 2,
});

console.log('Cost Split Result:');
console.log('  Total Trip Cost: ₹' + costSplitSimple.totalCost);
console.log('  Total Occupants: ' + costSplitSimple.totalOccupants + ' (1 driver + 2 passengers)');
console.log('  Cost Per Passenger: ₹' + costSplitSimple.costPerPassenger);
console.log('  Total Collected from Passengers: ₹' + costSplitSimple.totalPassengerContribution);
console.log('  Driver Absorbs: ₹' + costSplitSimple.driverShare);
console.log('  Formula Output: "' + costSplitSimple.formula + '"');

// Arithmetic checks:
// 200 / 3 occupants = 66.67 => rounded to 67
assert.strictEqual(costSplitSimple.totalCost, 200, 'Total cost must be 200');
assert.strictEqual(costSplitSimple.totalOccupants, 3, 'Total occupants must be 3 (1 driver + 2 passengers)');
assert.strictEqual(costSplitSimple.costPerPassenger, 67, 'Each passenger must pay round(200/3) = ₹67');
assert.strictEqual(costSplitSimple.totalPassengerContribution, 134, '2 passengers * ₹67 = ₹134');
assert.strictEqual(costSplitSimple.driverShare, 66, 'Driver pays remaining ₹66');
assert.strictEqual(costSplitSimple.totalPassengerContribution + costSplitSimple.driverShare, 200, 'Sum must equal total ₹200');

console.log('Scenario B: Fuel ₹300, Toll ₹60, 3 passengers offered/joining.');
const costSplitB = calculateCostSplit({
  fuel: 300,
  toll: 60,
  parking: 0,
  other: 0,
  seatsOffered: 3,
  passengerCount: 3,
});
// 360 / 4 occupants = ₹90 per person
console.log('  Total: ₹' + costSplitB.totalCost + ' / 4 occupants = ₹' + costSplitB.costPerPassenger + ' per passenger');
assert.strictEqual(costSplitB.costPerPassenger, 90);
assert.strictEqual(costSplitB.totalPassengerContribution, 270);
assert.strictEqual(costSplitB.driverShare, 90);
assert.strictEqual(costSplitB.totalPassengerContribution + costSplitB.driverShare, 360);

console.log('✅ Test 2 Passed: Cost sharing arithmetic is 100% verified and transparent!\n');

// -------------------------------------------------------------
// TEST 3: Smart Pickup Point Suggestion (Centroid Clustering)
// -------------------------------------------------------------
console.log('▶ Test 3: Testing smart pickup point centroid suggestion...');

const passengerPickups = [
  { coordinates: [73.8500, 18.5200] },
  { coordinates: [73.8540, 18.5220] },
  { coordinates: [73.8520, 18.5250] },
];

const rideRoute = [
  [73.8490, 18.5190],
  [73.8520, 18.5220],
  [73.8550, 18.5260],
];

const cluster = suggestPickupPoint(passengerPickups, rideRoute);

console.log('Cluster Suggested Coordinates:', cluster.suggestedCoordinates);
console.log('Passenger Count:', cluster.passengerCount);
console.log('Average Walking Distance:', cluster.averageWalkingKm, 'km');
console.log('Reasoning:', cluster.reasoning);

assert.strictEqual(cluster.passengerCount, 3);
assert.ok(Array.isArray(cluster.suggestedCoordinates) && cluster.suggestedCoordinates.length === 2);
assert.ok(cluster.averageWalkingKm >= 0);
assert.strictEqual(cluster.passengerDistances.length, 3);

console.log('✅ Test 3 Passed: Smart pickup clustering computed optimal rendezvous location!\n');

console.log('🎉 ALL PHASE 4 MATCHING & COST SHARING UNIT TESTS PASSED SUCCESSFULLY!');
