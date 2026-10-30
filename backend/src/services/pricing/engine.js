/**
 * Deterministic Pricing Engine for Max Housekeeping Service
 * Calculates shown price (MRP), offered price (payable), option deltas,
 * city overrides, and coupon deductions.
 */

export function calculateItemPrice(service, selections = {}, citySlug = null, qty = 1) {
  const isMoradabad = !citySlug || String(citySlug).toLowerCase().trim() === 'moradabad';
  let unitPrice = service.price || 0;
  let unitMrp = service.mrp || service.price || 0;
  let duration = service.duration || '1 hr';
  let matchedMatrixRow = null;

  // Check custom city-specific rates configured for this service (e.g. per sq ft, per ltr, or normal service rates)
  let cityRateMatched = false;
  let cityMatchedRate = null;
  let cityMatchedMrp = null;

  if (service.hasCitySpecificRates && Array.isArray(service.cityRates) && service.cityRates.length > 0 && citySlug) {
    const targetSlug = String(citySlug).toLowerCase().trim();
    const match = service.cityRates.find(cr => (cr.citySlug || '').toLowerCase().trim() === targetSlug);
    if (match && typeof match.rate === 'number' && match.rate > 0) {
      cityRateMatched = true;
      cityMatchedRate = match.rate;
      if (typeof match.mrp === 'number' && match.mrp > 0) {
        cityMatchedMrp = match.mrp;
      }
    }
  }

  // 0. Dynamic Per Sq. Ft. / Per Unit Calculation
  if (service.pricingType === 'unit' || (service.pricingUnit && service.pricingUnit !== 'fixed')) {
    let activeRate = isMoradabad
      ? (typeof service.unitRateMoradabad === 'number' ? service.unitRateMoradabad : service.price)
      : (typeof service.unitRateOther === 'number'
        ? service.unitRateOther
        : (typeof service.unitRateMoradabad === 'number' ? service.unitRateMoradabad : service.price));

    if (cityRateMatched && cityMatchedRate !== null) {
      activeRate = cityMatchedRate;
    }

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
    unitMrp = cityMatchedMrp ? Math.round(cityMatchedMrp * unitCount) : Math.round(unitPrice * mrpFactor);
  } else {
    // Normal flat service (or base tier before variants)
    if (cityRateMatched && cityMatchedRate !== null) {
      unitPrice = cityMatchedRate;
      unitMrp = cityMatchedMrp !== null
        ? cityMatchedMrp
        : ((service.mrp && service.price && service.mrp > service.price)
          ? Math.round(cityMatchedRate * (service.mrp / service.price))
          : Math.round(cityMatchedRate * 1.25));
    }
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
          const targetSlug = citySlug ? String(citySlug).toLowerCase().trim() : '';
          const rowCityMatch = (targetSlug && Array.isArray(row.cityRates) && row.cityRates.length > 0)
            ? row.cityRates.find(cr => (cr.citySlug || '').toLowerCase().trim() === targetSlug && typeof cr.rate === 'number' && cr.rate > 0)
            : null;

          if (rowCityMatch) {
            // 1. Variant-specific city rate (highest priority)
            cityRateMatched = true;
            unitPrice = rowCityMatch.rate;
            const defaultRowMrpRatio = (row.mrp && row.price && row.mrp > row.price) ? (row.mrp / row.price) : 1.25;
            unitMrp = (typeof rowCityMatch.mrp === 'number' && rowCityMatch.mrp > 0)
              ? rowCityMatch.mrp
              : Math.round(rowCityMatch.rate * defaultRowMrpRatio);
          } else if (cityRateMatched && cityMatchedRate !== null && service.price && service.price > 0) {
            // 2. Proportional scaling from service-level city rate relative to base price
            const ratio = cityMatchedRate / service.price;
            unitPrice = Math.round(row.price * ratio);
            const mrpRatio = cityMatchedMrp ? (cityMatchedMrp / (service.mrp || service.price)) : ratio;
            unitMrp = Math.round((row.mrp || row.price) * mrpRatio);
          } else {
            // 3. Base variant price
            unitPrice = row.price;
            unitMrp = row.mrp || row.price;
          }
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

  // 4. Optional Outstation Extra Surcharge (only when explicitly configured > 0 and no city-specific rate was already matched)
  let outstationSurcharge = 0;
  if (!isMoradabad && !cityRateMatched && typeof service.cityExtraCharge === 'number' && service.cityExtraCharge > 0) {
    outstationSurcharge = service.cityExtraCharge;
    unitPrice += outstationSurcharge;
    unitMrp += outstationSurcharge;
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
    outstationSurcharge,
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
 * @param {Object} billingConfig - Dynamic business settings ({ gstEnabled, gstPercentage, platformChargeEnabled, platformChargeType, platformChargeAmount, platformChargeLabel })
 */
export function calculateQuote(items = [], citySlug = null, coupon = null, billingConfig = {}) {
  const isMoradabad = !citySlug || String(citySlug).toLowerCase().trim() === 'moradabad';
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
      outstationSurcharge: itemCalc.outstationSurcharge || 0,
      qty: itemCalc.qty,
      totalPrice: itemCalc.totalPrice,
      totalMrp: itemCalc.totalMrp,
      savings: itemCalc.savings,
      discountPct: itemCalc.discountPct
    });
  }

  const totalOutstationSurcharge = !isMoradabad
    ? calculatedItems.reduce((acc, it) => acc + ((it.outstationSurcharge || 0) * (it.qty || 1)), 0)
    : 0;

  let couponDiscount = 0;
  let couponError = null;

  if (coupon && coupon.isActive !== false) {
    const minAmount = coupon.minBookingAmount || coupon.minOrderValue || 0;

    // Check service-specific restriction
    const applicableServiceIds = (coupon.applicableServices || []).map(s => String(s?._id || s));
    const applicableCategoryIds = (coupon.applicableCategories || []).map(c => String(c?._id || c));

    let eligibleItems = calculatedItems;

    if (applicableServiceIds.length > 0) {
      eligibleItems = calculatedItems.filter(item => applicableServiceIds.includes(String(item.serviceId)));
      if (eligibleItems.length === 0) {
        const allowedTitles = (coupon.applicableServices || [])
          .map(s => (typeof s === 'object' && s?.title ? s.title : null))
          .filter(Boolean);
        couponError = allowedTitles.length > 0
          ? `Coupon is only valid for: ${allowedTitles.join(', ')}`
          : 'This coupon is valid only for specific services that are not in your cart';
      }
    } else if (applicableCategoryIds.length > 0) {
      eligibleItems = calculatedItems.filter(item => {
        const catId = String(item.category?._id || item.category || '');
        return applicableCategoryIds.includes(catId);
      });
      if (eligibleItems.length === 0) {
        couponError = 'This coupon is not applicable to any service in your cart';
      }
    }

    if (!couponError) {
      if (subtotal < minAmount) {
        couponError = `Coupon requires a minimum booking amount of ₹${minAmount}`;
      } else {
        const eligibleSubtotal = eligibleItems.reduce((acc, cur) => acc + cur.totalPrice, 0);

        if (coupon.discountType === 'percentage') {
          couponDiscount = Math.round((eligibleSubtotal * (coupon.discountValue || 0)) / 100);
          if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
            couponDiscount = coupon.maxDiscount;
          }
        } else if (coupon.discountType === 'flat') {
          couponDiscount = Math.min(eligibleSubtotal, coupon.discountValue || 0);
        }
      }
    }
  }

  const discountedServiceSubtotal = Math.max(0, subtotal - couponDiscount);

  // Dynamic Platform Charges (controlled from Admin -> Business Settings)
  const platformChargeEnabled = Boolean(billingConfig?.platformChargeEnabled);
  const platformChargeType = billingConfig?.platformChargeType === 'percentage' ? 'percentage' : 'flat';
  const platformChargeValue = Math.max(0, Number(billingConfig?.platformChargeAmount ?? 0) || 0);
  const platformChargeLabel = String(billingConfig?.platformChargeLabel || 'Platform Charges').trim() || 'Platform Charges';

  let platformChargeAmount = 0;
  if (platformChargeEnabled && subtotal > 0 && platformChargeValue > 0) {
    if (platformChargeType === 'percentage') {
      platformChargeAmount = Math.round((discountedServiceSubtotal * platformChargeValue) / 100);
    } else {
      platformChargeAmount = Math.round(platformChargeValue);
    }
  }

  // Dynamic Separate GST on Overall Service (controlled from Admin -> Business Settings)
  const gstEnabled = Boolean(billingConfig?.gstEnabled);
  const gstPercentage = gstEnabled ? Math.max(0, Number(billingConfig?.gstPercentage ?? 18) || 0) : 0;
  let gstAmount = 0;
  if (gstEnabled && subtotal > 0 && gstPercentage > 0) {
    gstAmount = Math.round((discountedServiceSubtotal * gstPercentage) / 100);
  }

  const finalTotal = Math.max(0, discountedServiceSubtotal + platformChargeAmount + gstAmount);
  const totalSavings = Math.max(0, (mrpTotal - subtotal) + couponDiscount);
  const overallDiscountPct = mrpTotal > 0 ? Math.round((totalSavings / mrpTotal) * 100) : 0;

  return {
    items: calculatedItems,
    totals: {
      subtotal,
      mrpTotal,
      outstationSurcharge: totalOutstationSurcharge,
      discount: mrpTotal - subtotal,
      couponDiscount,
      gstEnabled,
      gstPercentage,
      gstAmount,
      platformChargeEnabled,
      platformChargeType,
      platformChargeValue,
      platformChargeAmount,
      platformChargeLabel,
      total: finalTotal,
      customerSaved: totalSavings,
      overallDiscountPct
    },
    coupon: coupon && !couponError ? {
      code: coupon.code,
      discount: couponDiscount,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    } : null,
    couponError
  };
}

export default {
  calculateItemPrice,
  calculateQuote
};
