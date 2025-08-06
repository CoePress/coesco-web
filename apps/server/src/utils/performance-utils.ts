/**
 * Updates the original results object with calculated values from the parsed data
 * @param originalResults - The original data structure from the client
 * @param parsedData - The calculated results from the Python script
 * @returns Updated results object with calculated values merged in
 */
export function updateResultsWithParsedData(originalResults: any, parsedData: any): any {
  // Create a deep copy of the original results to avoid mutation
  const updatedResults = JSON.parse(JSON.stringify(originalResults));
  
  if (!parsedData || typeof parsedData !== 'object') {
    return updatedResults;
  }
  
  // Helper function to safely set nested values
  const setNestedValue = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  };
  
  // Helper function to safely get nested values from parsed data
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };
  
  // Update RFQ results (FPM calculations)
  if (parsedData.rfq) {
    // Map rfq_result.average to feed.average.fpm
    if (parsedData.rfq.average !== undefined) {
      setNestedValue(updatedResults, 'feed.average.fpm', parsedData.rfq.average);
    }
    
    // Map rfq_result.min to feed.min.fpm
    if (parsedData.rfq.min !== undefined) {
      setNestedValue(updatedResults, 'feed.min.fpm', parsedData.rfq.min);
    }
    
    // Map rfq_result.max to feed.max.fpm
    if (parsedData.rfq.max !== undefined) {
      setNestedValue(updatedResults, 'feed.max.fpm', parsedData.rfq.max);
    }
  }
  
  // Update Material Specs results
  if (parsedData.material_specs) {
    const materialSpecs = parsedData.material_specs;
    
    // Map calculated coil OD
    if (materialSpecs.coil_od_calculated !== undefined) {
      setNestedValue(updatedResults, 'material.calculatedCoilOD', materialSpecs.coil_od_calculated);
    }
    
    // Map min bend radius
    if (materialSpecs.min_bend_radius !== undefined) {
      setNestedValue(updatedResults, 'material.minBendRadius', materialSpecs.min_bend_radius);
    }
    
    // Map min loop length
    if (materialSpecs.min_loop_length !== undefined) {
      setNestedValue(updatedResults, 'material.minLoopLength', materialSpecs.min_loop_length);
    }
  }
  
  // Update Feed results
  if (parsedData.feed) {
    const feedResults = parsedData.feed;
    
    // Map motor calculations
    if (feedResults.max_motor_rpm !== undefined) {
      setNestedValue(updatedResults, 'feed.motor.rpm.max', feedResults.max_motor_rpm);
    }
    
    if (feedResults.motor_inertia !== undefined) {
      setNestedValue(updatedResults, 'feed.motor.inertia', feedResults.motor_inertia);
    }
    
    if (feedResults.max_vel !== undefined) {
      setNestedValue(updatedResults, 'feed.maximunVelocity', feedResults.max_vel);
    }
    
    if (feedResults.settle_time !== undefined) {
      setNestedValue(updatedResults, 'feed.settleTime', feedResults.settle_time);
    }
    
    if (feedResults.ratio !== undefined) {
      setNestedValue(updatedResults, 'feed.ratio', feedResults.ratio);
    }
  }
  
  // Update Reel Drive results
  if (parsedData.reel_drive && typeof parsedData.reel_drive === 'object') {
    const reelDriveResults = parsedData.reel_drive;
    
    // Map reel calculations
    if (reelDriveResults.reel) {
      Object.keys(reelDriveResults.reel).forEach(key => {
        setNestedValue(updatedResults, `reel.${key}`, reelDriveResults.reel[key]);
      });
    }
    
    // Map mandrel calculations
    if (reelDriveResults.mandrel) {
      Object.keys(reelDriveResults.mandrel).forEach(key => {
        setNestedValue(updatedResults, `reel.mandrel.${key}`, reelDriveResults.mandrel[key]);
      });
    }
    
    // Map backplate calculations
    if (reelDriveResults.backplate) {
      Object.keys(reelDriveResults.backplate).forEach(key => {
        setNestedValue(updatedResults, `reel.backplate.${key}`, reelDriveResults.backplate[key]);
      });
    }
    
    // Map coil calculations
    if (reelDriveResults.coil) {
      Object.keys(reelDriveResults.coil).forEach(key => {
        setNestedValue(updatedResults, `reel.coil.${key}`, reelDriveResults.coil[key]);
      });
    }
    
    // Map reducer calculations
    if (reelDriveResults.reducer) {
      Object.keys(reelDriveResults.reducer).forEach(key => {
        setNestedValue(updatedResults, `reel.reducer.${key}`, reelDriveResults.reducer[key]);
      });
    }
  }
  
  // Update Roll Straightener Backbend results
  if (parsedData.roll_str_backbend && typeof parsedData.roll_str_backbend === 'object') {
    const rollStrResults = parsedData.roll_str_backbend;
    
    if (rollStrResults.roll_diameter !== undefined) {
      setNestedValue(updatedResults, 'straightener.rollDiameter', rollStrResults.roll_diameter);
    }
    
    if (rollStrResults.center_distance !== undefined) {
      setNestedValue(updatedResults, 'straightener.centerDistance', rollStrResults.center_distance);
    }
    
    if (rollStrResults.modules !== undefined) {
      setNestedValue(updatedResults, 'straightener.modulus', rollStrResults.modules);
    }
    
    if (rollStrResults.jack_force_available !== undefined) {
      setNestedValue(updatedResults, 'straightener.jackForceAvailable', rollStrResults.jack_force_available);
    }
    
    if (rollStrResults.max_roll_depth_without_material !== undefined) {
      setNestedValue(updatedResults, 'straightener.rolls.depth.withoutMaterial', rollStrResults.max_roll_depth_without_material);
    }
  }
  
  // Handle error cases for str_utility and tddbhd
  if (typeof parsedData.str_utility === 'string' && parsedData.str_utility.startsWith('ERROR:')) {
    // Log error or handle as needed
    console.warn('Straightener Utility Error:', parsedData.str_utility);
  }
  
  if (typeof parsedData.tddbhd === 'string' && parsedData.tddbhd.startsWith('ERROR:')) {
    // Log error or handle as needed
    console.warn('TDDBHD Error:', parsedData.tddbhd);
  }
  
  return updatedResults;
}