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

  if (parsedData.tddbhd && typeof parsedData.tddbhd === 'object') {
    const tddbhdResults = parsedData.tddbhd;
    
    // Map web tension calculations
    if (tddbhdResults.web_tension_psi !== undefined) {
      setNestedValue(updatedResults, 'reel.webTension.psi', tddbhdResults.web_tension_psi);
    }
    if (tddbhdResults.web_tension_lbs !== undefined) {
      setNestedValue(updatedResults, 'reel.webTension.lbs', tddbhdResults.web_tension_lbs);
    }
    
    // Map torque calculations
    if (tddbhdResults.torque_at_mandrel !== undefined) {
      setNestedValue(updatedResults, 'reel.torque.atMandrel', tddbhdResults.torque_at_mandrel);
    }
    if (tddbhdResults.rewind_torque !== undefined) {
      setNestedValue(updatedResults, 'reel.torque.rewindRequired', tddbhdResults.rewind_torque);
    }
    if (tddbhdResults.torque_required !== undefined) {
      setNestedValue(updatedResults, 'reel.torque.required', tddbhdResults.torque_required);
    }
    
    // Map holddown calculations
    if (tddbhdResults.hold_down_force_required !== undefined) {
      setNestedValue(updatedResults, 'reel.holddown.force.required', tddbhdResults.hold_down_force_required);
    }
    if (tddbhdResults.hold_down_force_available !== undefined) {
      setNestedValue(updatedResults, 'reel.holddown.force.available', tddbhdResults.hold_down_force_available);
    }
    
    // Map brake calculations
    if (tddbhdResults.failsafe_required !== undefined) {
      setNestedValue(updatedResults, 'reel.dragBrake.psiAirRequired', tddbhdResults.failsafe_required);
    }
    if (tddbhdResults.failsafe_holding_force !== undefined) {
      setNestedValue(updatedResults, 'reel.dragBrake.holdingForce', tddbhdResults.failsafe_holding_force);
    }
  }
  
  // Update Reel Drive results
  if (parsedData.reel_drive && typeof parsedData.reel_drive === 'object') {
    const reelDriveResults = parsedData.reel_drive;
    
    // Map reel specifications
    if (reelDriveResults.reel) {
      setNestedValue(updatedResults, 'reel.size', reelDriveResults.reel.size);
      setNestedValue(updatedResults, 'reel.bearing.distance', reelDriveResults.reel.brg_dist);
      setNestedValue(updatedResults, 'reel.bearing.diameter.front', reelDriveResults.reel.f_brg_dia);
      setNestedValue(updatedResults, 'reel.bearing.diameter.rear', reelDriveResults.reel.r_brg_dia);
    }

    // Map mandrel calculations
    if (reelDriveResults.mandrel) {
      setNestedValue(updatedResults, 'reel.mandrel.diameter', reelDriveResults.mandrel.diameter);
      setNestedValue(updatedResults, 'reel.mandrel.length', reelDriveResults.mandrel.length);
      setNestedValue(updatedResults, 'reel.mandrel.maxRPM', reelDriveResults.mandrel.max_rpm);
      setNestedValue(updatedResults, 'reel.mandrel.RpmFull', reelDriveResults.mandrel.rpm_full);
      setNestedValue(updatedResults, 'reel.mandrel.weight', reelDriveResults.mandrel.weight);
      setNestedValue(updatedResults, 'reel.mandrel.inertia', reelDriveResults.mandrel.inertia);
      setNestedValue(updatedResults, 'reel.mandrel.reflInertia', reelDriveResults.mandrel.refl_inert);
    }

    // Map backplate calculations
    if (reelDriveResults.backplate) {
      setNestedValue(updatedResults, 'reel.backplate.thickness', reelDriveResults.backplate.thickness);
      setNestedValue(updatedResults, 'reel.backplate.weight', reelDriveResults.backplate.weight);
      setNestedValue(updatedResults, 'reel.backplate.inertia', reelDriveResults.backplate.inertia);
      setNestedValue(updatedResults, 'reel.backplate.reflInertia', reelDriveResults.backplate.refl_inert);
    }

    // Map coil calculations
    if (reelDriveResults.coil) {
      setNestedValue(updatedResults, 'coil.density', reelDriveResults.coil.density);
      setNestedValue(updatedResults, 'material.coilWidth', reelDriveResults.coil.width);
      setNestedValue(updatedResults, 'coil.inertia', reelDriveResults.coil.inertia);
      setNestedValue(updatedResults, 'coil.reflInertia', reelDriveResults.coil.refl_inert);
    }

    // Map reducer calculations
    if (reelDriveResults.reducer) {
      setNestedValue(updatedResults, 'reel.reducer.ratio', reelDriveResults.reducer.ratio);
      setNestedValue(updatedResults, 'reel.reducer.driving', reelDriveResults.reducer.driving);
      setNestedValue(updatedResults, 'reel.reducer.backdriving', reelDriveResults.reducer.backdriving);
      setNestedValue(updatedResults, 'reel.reducer.inertia', reelDriveResults.reducer.inertia);
      setNestedValue(updatedResults, 'reel.reducer.reflInertia', reelDriveResults.reducer.refl_inert);
    }

    // Map chain calculations
    if (reelDriveResults.chain) {
      setNestedValue(updatedResults, 'reel.chain.ratio', reelDriveResults.chain.ratio);
      setNestedValue(updatedResults, 'reel.chain.sprktOD', reelDriveResults.chain.sprkt_od);
      setNestedValue(updatedResults, 'reel.chain.sprktThickness', reelDriveResults.chain.sprkt_thk);
      setNestedValue(updatedResults, 'reel.chain.weight', reelDriveResults.chain.weight);
      setNestedValue(updatedResults, 'reel.chain.inertia', reelDriveResults.chain.inertia);
      setNestedValue(updatedResults, 'reel.chain.reflInertia', reelDriveResults.chain.refl_inert);
    }

    // Map total calculations
    if (reelDriveResults.total) {
      setNestedValue(updatedResults, 'reel.ratio', reelDriveResults.total.ratio);
      setNestedValue(updatedResults, 'reel.totalReflInertia.empty', reelDriveResults.total.total_refl_inert_empty);
      setNestedValue(updatedResults, 'reel.totalReflInertia.full', reelDriveResults.total.total_refl_inert_full);
    }

    // Map motor calculations
    if (reelDriveResults.motor) {
      setNestedValue(updatedResults, 'reel.motor.inertia', reelDriveResults.motor.inertia);
      setNestedValue(updatedResults, 'reel.motor.rpm.base', reelDriveResults.motor.base_rpm);
      setNestedValue(updatedResults, 'reel.motor.rpm.full', reelDriveResults.motor.rpm_full);
    }

    // Map friction calculations
    if (reelDriveResults.friction) {
      setNestedValue(updatedResults, 'reel.friction.bearing.mandrel.rear', reelDriveResults.friction.r_brg_mand);
      setNestedValue(updatedResults, 'reel.friction.bearing.mandrel.front', reelDriveResults.friction.f_brg_mand);
      setNestedValue(updatedResults, 'reel.friction.bearing.coil.front', reelDriveResults.friction.f_brg_coil);
      setNestedValue(updatedResults, 'reel.friction.bearing.coil.rear', reelDriveResults.friction.r_brg_coil);
      setNestedValue(updatedResults, 'reel.friction.bearing.total.empty', reelDriveResults.friction.total_empty);
      setNestedValue(updatedResults, 'reel.friction.bearing.total.full', reelDriveResults.friction.total_full);
      setNestedValue(updatedResults, 'reel.friction.bearing.refl.empty', reelDriveResults.friction.refl_empty);
      setNestedValue(updatedResults, 'reel.friction.bearing.refl.full', reelDriveResults.friction.refl_full);
    }

    // Map speed calculations
    if (reelDriveResults.speed) {
      setNestedValue(updatedResults, 'reel.speed', reelDriveResults.speed.speed);
      setNestedValue(updatedResults, 'reel.motorization.accelRate', reelDriveResults.speed.accel_rate);
      setNestedValue(updatedResults, 'reel.accelerationTime', reelDriveResults.speed.accel_time);
    }

    // Map torque calculations
    if (reelDriveResults.torque) {
      setNestedValue(updatedResults, 'reel.torque.empty.torque', reelDriveResults.torque.empty);
      setNestedValue(updatedResults, 'reel.torque.full.torque', reelDriveResults.torque.full);
    }

    // Map horsepower requirements
    if (reelDriveResults.hp_req) {
      setNestedValue(updatedResults, 'reel.torque.empty.horsepowerRequired', reelDriveResults.hp_req.empty);
      setNestedValue(updatedResults, 'reel.torque.full.horsepowerRequired', reelDriveResults.hp_req.full);
      setNestedValue(updatedResults, 'reel.torque.empty.status', reelDriveResults.hp_req.status_empty);
      setNestedValue(updatedResults, 'reel.torque.full.status', reelDriveResults.hp_req.status_full);
    }

    // Map regenerative power
    if (reelDriveResults.regen) {
      setNestedValue(updatedResults, 'reel.torque.empty.regen', reelDriveResults.regen.empty);
      setNestedValue(updatedResults, 'reel.torque.full.regen', reelDriveResults.regen.full);
    }

    // Map pulloff recommendation
    if (reelDriveResults.use_pulloff !== undefined) {
      setNestedValue(updatedResults, 'reel.usePulloff', reelDriveResults.use_pulloff);
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