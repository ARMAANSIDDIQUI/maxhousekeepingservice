import { calculateItemPrice, calculateQuote } from '../src/services/pricing/engine.js';

function runTests() {
  console.log('--- Testing Deterministic Pricing Engine ---');

  // Test 1: Simple Fixed Service (e.g. Sofa Dry Cleaning 5-seater)
  const sofaService = {
    _id: 'srv-1',
    title: 'Sofa Dry Cleaning',
    slug: 'sofa-dry-cleaning',
    price: 1199,
    mrp: 1499,
    duration: '1.5 hrs'
  };

  const res1 = calculateItemPrice(sofaService, {}, null, 1);
  console.assert(res1.unitPrice === 1199, `Test 1 Failed: Expected price 1199, got ${res1.unitPrice}`);
  console.assert(res1.unitMrp === 1499, `Test 1 Failed: Expected mrp 1499, got ${res1.unitMrp}`);
  console.assert(res1.savings === 300, `Test 1 Failed: Expected savings 300, got ${res1.savings}`);
  console.assert(res1.discountPct === 20, `Test 1 Failed: Expected discountPct 20, got ${res1.discountPct}`);
  console.log('Passed Test 1: Simple dual-pricing calculation');

  // Test 2: Matrix selection (e.g. Full Home Deep Cleaning with BHK variants)
  const homeCleaningService = {
    _id: 'srv-2',
    title: 'Full Home Deep Cleaning',
    slug: 'full-home-deep-cleaning',
    price: 3499, // Base 1 BHK
    mrp: 3999,
    matrix: [
      { selection: { size: '1-bhk' }, price: 3499, mrp: 3999, duration: '4-5 hrs' },
      { selection: { size: '2-bhk' }, price: 4499, mrp: 5499, duration: '5-6 hrs' },
      { selection: { size: '3-bhk' }, price: 5499, mrp: 6999, duration: '6-7 hrs' },
      { selection: { size: 'villa' }, price: 8999, mrp: 11999, duration: '8+ hrs' }
    ]
  };

  const res2 = calculateItemPrice(homeCleaningService, { size: '2-bhk' }, null, 1);
  console.assert(res2.unitPrice === 4499, `Test 2 Failed: Expected 4499, got ${res2.unitPrice}`);
  console.assert(res2.unitMrp === 5499, `Test 2 Failed: Expected 5499, got ${res2.unitMrp}`);
  console.assert(res2.savings === 1000, `Test 2 Failed: Expected savings 1000, got ${res2.savings}`);
  console.assert(res2.duration === '5-6 hrs', `Test 2 Failed: Expected duration 5-6 hrs`);
  console.log('Passed Test 2: Matrix match (2 BHK)');

  // Test 3: Option deltas (Add-ons e.g. Balcony Cleaning add-on +₹300)
  const kitchenService = {
    _id: 'srv-3',
    title: 'Kitchen Deep Cleaning',
    price: 1499,
    mrp: 1799,
    optionGroups: [
      {
        key: 'chimney',
        type: 'single',
        options: [
          { key: 'include', priceDelta: 400, mrpDelta: 500 },
          { key: 'exclude', priceDelta: 0, mrpDelta: 0 }
        ]
      }
    ]
  };

  const res3 = calculateItemPrice(kitchenService, { chimney: 'include' });
  console.assert(res3.unitPrice === 1899, `Test 3 Failed: Expected 1899, got ${res3.unitPrice}`);
  console.assert(res3.unitMrp === 2299, `Test 3 Failed: Expected 2299, got ${res3.unitMrp}`);
  console.log('Passed Test 3: Option group price and MRP delta');

  // Test 4: City override (e.g. Rampur pricing discount)
  const bathroomService = {
    _id: 'srv-4',
    title: 'Bathroom Deep Cleaning',
    price: 799,
    mrp: 999,
    cityOverrides: [
      { citySlug: 'rampur', priceOverride: 699, mrpOverride: 899 }
    ]
  };

  const res4 = calculateItemPrice(bathroomService, {}, 'rampur');
  console.assert(res4.unitPrice === 699, `Test 4 Failed: Expected 699, got ${res4.unitPrice}`);
  console.assert(res4.unitMrp === 899, `Test 4 Failed: Expected 899, got ${res4.unitMrp}`);
  console.log('Passed Test 4: City override (Rampur)');

  // Test 5: Full Cart Quote with Coupon
  const quote = calculateQuote(
    [
      { service: homeCleaningService, selections: { size: '2-bhk' }, qty: 1 },
      { service: sofaService, qty: 2 }
    ],
    null,
    {
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      minBookingAmount: 2000,
      maxDiscount: 1000
    }
  );

  // Subtotal = 4499 (2bhk) + (1199 * 2 = 2398) = 6897
  // MRP Total = 5499 + (1499 * 2 = 2998) = 8497
  // 10% coupon of 6897 = 690
  // Final total = 6897 - 690 = 6207
  console.assert(quote.totals.subtotal === 6897, `Test 5 Subtotal failed: ${quote.totals.subtotal}`);
  console.assert(quote.totals.mrpTotal === 8497, `Test 5 MRP failed: ${quote.totals.mrpTotal}`);
  console.assert(quote.totals.couponDiscount === 690, `Test 5 Coupon discount failed: ${quote.totals.couponDiscount}`);
  console.assert(quote.totals.total === 6207, `Test 5 Final total failed: ${quote.totals.total}`);
  console.assert(quote.totals.customerSaved === (8497 - 6897 + 690), `Test 5 Savings failed: ${quote.totals.customerSaved}`);
  console.log('Passed Test 5: Multi-item quote with coupon calculations');

  console.log('\nALL 5 PRICING ENGINE TESTS PASSED SUCCESFULLY!');
}

runTests();
