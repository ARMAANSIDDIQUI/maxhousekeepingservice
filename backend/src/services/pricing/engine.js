/**
 * Deterministic Pricing Engine for Max Housekeeping Service
 * Calculates shown price (MRP), offered price (payable), option deltas,
 * city overrides, and coupon deductions.
 */

export function calculateItemPrice(service, selections = {}, citySlug = null, qty = 1) {
  const isMoradabad = !citySlug || citySlug.toLowerCase() === 'moradabad';
  let unitPrice = service.price;
  let unitMrp = service.mrp;
  let duration = service.duration || '1 hr';
  let matchedMatrixRow = null;

  // 0. Dynamic Per Sq. Ft. / Per Unit Calculation
  if (service.pricingType === 'unit' || (service.pricingUnit && service.pricingUnit !== 'fixed')) {
    const rateMbd = typeof service.unitRateMoradabad === 'number' ? service.unitRateMoradabad : service.price;
    const rateOther = typeof service.unitRateOther === 'number'
      ? service.unitRateOther
      : (typeof service.unitRateMoradabad === 'number' ? service.unitRateMoradabad : service.price);
    const activeRate = isMoradabad ? rateMbd : rateOther;

    const unitCount = Number(
      selections.units ??
      selections.unitCount ??
      selections.sqFt ??
      selections.litres ??
      selections.seats ??
      selections.chairs ??
      selections.fans
    ) || service.minUnitQuantity || 1;

    unitPrice = Math.round(activeRate * unitCount);
    const mrpFactor = (service.mrp && service.price && service.mrp > service.price) ? (service.mrp / service.price) : 1.25;
    unitMrp = Math.round(unitPrice * mrpFactor);
  }

  // City-specific surcharge (e.g. outstation surcharge)
  if (!isMoradabad && service.cityExtraCharge) {
    unitPrice += service.cityExtraCharge;
    unitMrp += service.cityExtraCharge;
  }

  // 1. Matrix match (e.g. size: '2-bhk')
  if (service.matrix && Array.isArray(service.matrix) && service.matrix.length > 0) {
    for (const row of service.matrix) {
      if (!row.isActive && row.isActive !== undefined) continue;
      
      const rowSelection = row.selection instanceof Map ? Object.fromEntries(row.selection) : (row.selection || {});
      const keys = Object.keys(rowSelection);
      
      if (keys.length > 0) {
        const isMatch = keys.every(key => {
          const expected = String(rowSelection[key]).toLowerCase().trim();
          const actual = String(selections[key] || '').toLowerCase().trim();
          return expected === actual;
        });

        if (isMatch) {
          matchedMatrixRow = row;
          unitPrice = row.price;
          unitMrp = row.mrp;
          if (row.duration) duration = row.duration;
          break;
        }
      }
    }
  }

  // 2. Option Group Deltas & Multipliers
  // If an option group was already matched and accounted for by the matrix row,
  // its base tier price is already in row.price / row.mrp. We only apply deltas for
  // groups that are NOT part of the matched matrix selection (e.g. add-ons or steppers).
  const matchedMatrixKeys = matchedMatrixRow
    ? Object.keys(matchedMatrixRow.selection instanceof Map ? Object.fromEntries(matchedMatrixRow.selection) : (matchedMatrixRow.selection || {}))
    : [];

  if (service.optionGroups && Array.isArray(service.optionGroups)) {
    for (const group of service.optionGroups) {
      if (matchedMatrixKeys.includes(group.key)) {
        continue; // Skip already factored matrix tier group
      }

      const selectedValue = selections[group.key];
      if (!selectedValue) continue;

      if (group.type === 'single' || group.type === 'toggle') {
        const option = group.options?.find(opt => opt.key === selectedValue);
        if (option && option.isActive !== false) {
          if (option.priceDelta) unitPrice += option.priceDelta;
          if (option.mrpDelta) unitMrp += option.mrpDelta;
          if (option.multiplier && option.multiplier > 0) {
            unitPrice = Math.round(unitPrice * option.multiplier);
            unitMrp = Math.round(unitMrp * option.multiplier);
          }
        }
      } else if (group.type === 'multi' && Array.isArray(selectedValue)) {
        for (const key of selectedValue) {
          const option = group.options?.find(opt => opt.key === key);
          if (option && option.isActive !== false) {
            if (option.priceDelta) unitPrice += option.priceDelta;
            if (option.mrpDelta) unitMrp += option.mrpDelta;
          }
        }
      } else if (group.type === 'stepper') {
        const count = Number(selectedValue) || 0;
        const option = group.options?.[0]; // Base stepper config
        if (option && count > 0) {
          if (option.priceDelta) unitPrice += (option.priceDelta * count);
          if (option.mrpDelta) unitMrp += (option.mrpDelta * count);
        }
      }
    }
  }

  // 3. City Override
  if (citySlug && service.cityOverrides && Array.isArray(service.cityOverrides)) {
    const override = service.cityOverrides.find(o => 
      (o.citySlug && o.citySlug.toLowerCase() === citySlug.toLowerCase()) && 
      o.isActive !== false
    );
    if (override) {
      if (typeof override.priceOverride === 'number') unitPrice = override.priceOverride;
      if (typeof override.mrpOverride === 'number') unitMrp = override.mrpOverride;
      if (override.multiplier && override.multiplier > 0) {
        unitPrice = Math.round(unitPrice * override.multiplier);
        unitMrp = Math.round(unitMrp * override.multiplier);
      }
    }
  }

  // Ensure MRP is at least equal to offered price
  if (unitMrp < unitPrice) {
    unitMrp = unitPrice;
  }

  const quantity = Math.max(1, Number(qty) || 1);
  const totalPrice = unitPrice * quantity;
  const totalMrp = unitMrp * quantity;
  const savings = totalMrp - totalPrice;
  const discountPct = unitMrp > 0 ? Math.round(((unitMrp - unitPrice) / unitMrp) * 100) : 0;

  return {
    unitPrice,
    unitMrp,
    qty: quantity,
    totalPrice,
    totalMrp,
    savings,
    discountPct,
    duration,
    matchedMatrixRow
  };
}

/**
 * Calculates complete cart / booking quote
 * @param {Array} items - List of items [{ service, selections, qty }]
 * @param {string} citySlug - Selected city slug
 * @param {Object} coupon - Optional active coupon object
 */
export function calculateQuote(items = [], citySlug = null, coupon = null) {
  let subtotal = 0;
  let mrpTotal = 0;
  const calculatedItems = [];

  for (const item of items) {
    const service = item.service || item;
    const selections = item.selections || {};
    const qty = item.qty || 1;

    const itemCalc = calculateItemPrice(service, selections, citySlug, qty);

    subtotal += itemCalc.totalPrice;
    mrpTotal += itemCalc.totalMrp;

    calculatedItems.push({
      serviceId: service._id || service.id,
      title: service.title,
      slug: service.slug,
      selections,
      duration: itemCalc.duration,
      unitPrice: itemCalc.unitPrice,
      unitMrp: itemCalc.unitMrp,
      qty: itemCalc.qty,
      totalPrice: itemCalc.totalPrice,
      totalMrp: itemCalc.totalMrp,
      savings: itemCalc.savings,
      discountPct: itemCalc.discountPct
    });
  }

  let couponDiscount = 0;
  let couponError = null;

  if (coupon && coupon.isActive !== false) {
    const minAmount = coupon.minBookingAmount || coupon.minOrderValue || 0;
    if (subtotal < minAmount) {
      couponError = `Coupon requires a minimum booking amount of ₹${minAmount}`;
    } else {
      if (coupon.discountType === 'percentage') {
        couponDiscount = Math.round((subtotal * (coupon.discountValue || 0)) / 100);
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'flat') {
        couponDiscount = Math.min(subtotal, coupon.discountValue || 0);
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - couponDiscount);
  const totalSavings = Math.max(0, (mrpTotal - subtotal) + couponDiscount);
  const overallDiscountPct = mrpTotal > 0 ? Math.round((totalSavings / mrpTotal) * 100) : 0;

  return {
    items: calculatedItems,
    totals: {
      subtotal,
      mrpTotal,
      discount: mrpTotal - subtotal,
      couponDiscount,
      total: finalTotal,
      customerSaved: totalSavings,
      overallDiscountPct
    },
    coupon: coupon && !couponError ? {
      code: coupon.code,
      discount: couponDiscount
    } : null,
    couponError
  };
}

export default {
  calculateItemPrice,
  calculateQuote
};
