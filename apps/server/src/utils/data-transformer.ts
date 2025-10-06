/**
 * Backend Data Transformer for Performance Autofill
 * 
 * Transforms frontend form data (strings) to calculation engine format (numbers)
 * This handles the data transformation on the server side before passing to Python scripts
 */

/**
 * Transforms frontend form data for backend Python calculation engine
 * Converts string numbers to actual numbers where expected by calculations
 */
export function transformDataForCalculationEngine(data: any): any {
  if (!data) return data;

  const transformedData = JSON.parse(JSON.stringify(data)); // Deep clone

  // Transform material specs (critical for calculations)
  if (transformedData.common?.material) {
    const material = transformedData.common.material;

    if (material.materialThickness && typeof material.materialThickness === 'string') {
      const parsed = parseFloat(material.materialThickness);
      if (!isNaN(parsed)) material.materialThickness = parsed;
    }

    if (material.maxYieldStrength && typeof material.maxYieldStrength === 'string') {
      const parsed = parseFloat(material.maxYieldStrength);
      if (!isNaN(parsed)) material.maxYieldStrength = parsed;
    }

    if (material.coilWidth && typeof material.coilWidth === 'string') {
      const parsed = parseFloat(material.coilWidth);
      if (!isNaN(parsed)) material.coilWidth = parsed;
    }

    if (material.coilWeight && typeof material.coilWeight === 'string') {
      const parsed = parseFloat(material.coilWeight);
      if (!isNaN(parsed)) material.coilWeight = parsed;
    }

    if (material.maxTensileStrength && typeof material.maxTensileStrength === 'string') {
      const parsed = parseFloat(material.maxTensileStrength);
      if (!isNaN(parsed)) material.maxTensileStrength = parsed;
    }

    if (material.materialDensity && typeof material.materialDensity === 'string') {
      const parsed = parseFloat(material.materialDensity);
      if (!isNaN(parsed)) material.materialDensity = parsed;
    }

    if (material.reqMaxFPM && typeof material.reqMaxFPM === 'string') {
      const parsed = parseFloat(material.reqMaxFPM);
      if (!isNaN(parsed)) material.reqMaxFPM = parsed;
    }
  }

  // Transform coil specs
  if (transformedData.common?.coil) {
    const coil = transformedData.common.coil;

    if (coil.coilID && typeof coil.coilID === 'string') {
      const parsed = parseFloat(coil.coilID);
      if (!isNaN(parsed)) coil.coilID = parsed;
    }

    if (coil.maxCoilOD && typeof coil.maxCoilOD === 'string') {
      const parsed = parseFloat(coil.maxCoilOD);
      if (!isNaN(parsed)) coil.maxCoilOD = parsed;
    }

    if (coil.maxCoilWidth && typeof coil.maxCoilWidth === 'string') {
      const parsed = parseFloat(coil.maxCoilWidth);
      if (!isNaN(parsed)) coil.maxCoilWidth = parsed;
    }

    if (coil.minCoilWidth && typeof coil.minCoilWidth === 'string') {
      const parsed = parseFloat(coil.minCoilWidth);
      if (!isNaN(parsed)) coil.minCoilWidth = parsed;
    }

    if (coil.maxCoilWeight && typeof coil.maxCoilWeight === 'string') {
      const parsed = parseFloat(coil.maxCoilWeight);
      if (!isNaN(parsed)) coil.maxCoilWeight = parsed;
    }
  }

  // Transform equipment specs
  if (transformedData.common?.equipment) {
    const equipment = transformedData.common.equipment;

    // Straightener rolls
    if (equipment.straightener?.numberOfRolls && typeof equipment.straightener.numberOfRolls === 'string') {
      const parsed = parseInt(equipment.straightener.numberOfRolls);
      if (!isNaN(parsed)) equipment.straightener.numberOfRolls = parsed;
    }

    // Equipment passline (keep as string for form compatibility)
    if (equipment.feed?.passline && typeof equipment.feed.passline === 'number') {
      equipment.feed.passline = String(equipment.feed.passline);
    }

    // Non-marking boolean conversion
    if (equipment.feed?.nonMarking === 'true') {
      equipment.feed.nonMarking = true;
    } else if (equipment.feed?.nonMarking === 'false') {
      equipment.feed.nonMarking = false;
    }
  }

  // Transform feed rates (critical for calculations)
  if (transformedData.common?.feedRates) {
    const feedRates = transformedData.common.feedRates;

    ['min', 'max', 'average'].forEach(category => {
      if (feedRates[category]) {
        const rates = feedRates[category];

        if (rates.fpm && typeof rates.fpm === 'string') {
          const parsed = parseFloat(rates.fpm);
          if (!isNaN(parsed)) rates.fpm = parsed;
        }

        if (rates.spm && typeof rates.spm === 'string') {
          const parsed = parseFloat(rates.spm);
          if (!isNaN(parsed)) rates.spm = parsed;
        }

        if (rates.length && typeof rates.length === 'string') {
          const parsed = parseFloat(rates.length);
          if (!isNaN(parsed)) rates.length = parsed;
        }
      }
    });
  }

  // Transform boolean strings to actual booleans for checkboxes
  if (transformedData.rfq?.coil) {
    const coil = transformedData.rfq.coil;

    if (coil.slitEdge === 'true') {
      coil.slitEdge = true;
    } else if (coil.slitEdge === 'false') {
      coil.slitEdge = false;
    }

    if (coil.millEdge === 'true') {
      coil.millEdge = true;
    } else if (coil.millEdge === 'false') {
      coil.millEdge = false;
    }
  }

  if (transformedData.rfq?.dies) {
    const dies = transformedData.rfq.dies;

    if (dies.progressiveDies === 'true') {
      dies.progressiveDies = true;
    } else if (dies.progressiveDies === 'false') {
      dies.progressiveDies = false;
    }

    if (dies.transferDies === 'true') {
      dies.transferDies = true;
    } else if (dies.transferDies === 'false') {
      dies.transferDies = false;
    }

    if (dies.blankingDies === 'true') {
      dies.blankingDies = true;
    } else if (dies.blankingDies === 'false') {
      dies.blankingDies = false;
    }
  }

  return transformedData;
}

/**
 * Debug log to show the transformation results
 */
export function debugTransformation(original: any, transformed: any): void {


  const originalMaterial = original?.common?.material;
  const transformedMaterial = transformed?.common?.material;

  if (originalMaterial && transformedMaterial) {
    // Material transformation logging removed
  }

  const originalFeedRates = original?.common?.feedRates?.average;
  const transformedFeedRates = transformed?.common?.feedRates?.average;

  if (originalFeedRates && transformedFeedRates) {
    // Feed rate transformation logging removed
  }
}