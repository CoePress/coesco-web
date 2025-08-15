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
  
  // Update RFQ results (FPM calculations) - Map to common.feedRates
  if (parsedData.rfq) {
    // Map rfq_result.average to common.feedRates.average.fpm
    if (parsedData.rfq.average !== undefined) {
      setNestedValue(updatedResults, 'common.feedRates.average.fpm', parsedData.rfq.average);
    }
    
    // Map rfq_result.min to common.feedRates.min.fpm
    if (parsedData.rfq.min !== undefined) {
      setNestedValue(updatedResults, 'common.feedRates.min.fpm', parsedData.rfq.min);
    }
    
    // Map rfq_result.max to common.feedRates.max.fpm
    if (parsedData.rfq.max !== undefined) {
      setNestedValue(updatedResults, 'common.feedRates.max.fpm', parsedData.rfq.max);
    }
  }
  
  // Update Material Specs results
  if (parsedData.material_specs) {
    const materialSpecs = parsedData.material_specs;
    
    // Map calculated coil OD
    if (materialSpecs.coil_od_calculated !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.material.calculatedCoilOD', materialSpecs.coil_od_calculated);
    }
    
    // Map min bend radius
    if (materialSpecs.min_bend_radius !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.material.minBendRadius', materialSpecs.min_bend_radius);
    }
    
    // Map min loop length
    if (materialSpecs.min_loop_length !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.material.minLoopLength', materialSpecs.min_loop_length);
    }

    // Map feed controls
    if (materialSpecs.feed_controls !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.feed.controls', materialSpecs.feed_controls);
    }

    // Map type of roll
    if (materialSpecs.type_of_roll !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.straightener.rolls.typeOfRoll', materialSpecs.type_of_roll);
    }

    // Map backplate type
    if (materialSpecs.backplate_type !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.reel.backplate.type', materialSpecs.backplate_type);
    }

    // Map reel style
    if (materialSpecs.reel_style !== undefined) {
      setNestedValue(updatedResults, 'materialSpecs.reel.style', materialSpecs.reel_style);
    }
  }

  // Update TDDBHD results
  if (parsedData.tddbhd && typeof parsedData.tddbhd === 'object') {
    const tddbhdResults = parsedData.tddbhd;
    
    // Map coefficient of friction
    if (tddbhdResults.coefficient_of_friction !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.coefficientOfFriction', tddbhdResults.coefficient_of_friction);
    }

    // Map minimum material width
    if (tddbhdResults.min_material_width !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.minMaterialWidth', tddbhdResults.min_material_width);
    }
    
    // Map web tension calculations
    if (tddbhdResults.web_tension_psi !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.webTension.psi', tddbhdResults.web_tension_psi);
    }
    if (tddbhdResults.web_tension_lbs !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.webTension.lbs', tddbhdResults.web_tension_lbs);
    }
    
    // Map torque calculations
    if (tddbhdResults.torque_at_mandrel !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.atMandrel', tddbhdResults.torque_at_mandrel);
    }
    if (tddbhdResults.torque_rewind_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.rewindRequired', tddbhdResults.torque_rewind_required);
    }
    if (tddbhdResults.torque_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.required', tddbhdResults.torque_required);
    }
    
    // Map holddown calculations
    if (tddbhdResults.holddown_force_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.holddown.force.required', tddbhdResults.holddown_force_required);
    }
    if (tddbhdResults.holddown_force_available !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.holddown.force.available', tddbhdResults.holddown_force_available);
    }
    
    // Map brake calculations
    if (tddbhdResults.drag_brake_psi_air_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.dragBrake.psiAirRequired', tddbhdResults.drag_brake_psi_air_required);
    }
    if (tddbhdResults.drag_brake_holding_force !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.dragBrake.holdingForce', tddbhdResults.drag_brake_holding_force);
    }

    // Map coil calculations
    if (tddbhdResults.coil_weight !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.coil.coilWeight', tddbhdResults.coil_weight);
    }
    if (tddbhdResults.coil_od !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.coil.coilOD', tddbhdResults.coil_od);
    }
  }
  
  // Update Reel Drive results
  if (parsedData.reel_drive && typeof parsedData.reel_drive === 'object') {
    const reelDriveResults = parsedData.reel_drive;
    
    // Map mandrel calculations
    if (reelDriveResults.mandrel_max_rpm !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.maxRPM', reelDriveResults.mandrel_max_rpm);
    }
    if (reelDriveResults.mandrel_rpm_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.RpmFull', reelDriveResults.mandrel_rpm_full);
    }
    if (reelDriveResults.mandrel_weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.weight', reelDriveResults.mandrel_weight);
    }
    if (reelDriveResults.mandrel_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.inertia', reelDriveResults.mandrel_inertia);
    }
    if (reelDriveResults.mandrel_refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.reflInertia', reelDriveResults.mandrel_refl_inertia);
    }

    // Map backplate calculations
    if (reelDriveResults.backplate_weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.weight', reelDriveResults.backplate_weight);
    }
    if (reelDriveResults.backplate_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.inertia', reelDriveResults.backplate_inertia);
    }
    if (reelDriveResults.backplate_refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.reflInertia', reelDriveResults.backplate_refl_inertia);
    }

    // Map coil calculations
    if (reelDriveResults.coil_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.inertia', reelDriveResults.coil_inertia);
    }
    if (reelDriveResults.coil_refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.reflInertia', reelDriveResults.coil_refl_inertia);
    }

    // Map reducer calculations
    if (reelDriveResults.reducer_refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.reflInertia', reelDriveResults.reducer_refl_inertia);
    }

    // Map chain calculations
    if (reelDriveResults.chain_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.inertia', reelDriveResults.chain_inertia);
    }
    if (reelDriveResults.chain_refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.reflInertia', reelDriveResults.chain_refl_inertia);
    }

    // Map ratio
    if (reelDriveResults.ratio !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.ratio', reelDriveResults.ratio);
    }

    // Map total reflected inertia
    if (reelDriveResults.total_refl_inertia_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.totalReflInertia.empty', reelDriveResults.total_refl_inertia_empty);
    }
    if (reelDriveResults.total_refl_inertia_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.totalReflInertia.full', reelDriveResults.total_refl_inertia_full);
    }

    // Map friction calculations
    if (reelDriveResults.friction_bearing_mandrel_rear !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.mandrel.rear', reelDriveResults.friction_bearing_mandrel_rear);
    }
    if (reelDriveResults.friction_bearing_mandrel_front !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.mandrel.front', reelDriveResults.friction_bearing_mandrel_front);
    }
    if (reelDriveResults.friction_bearing_coil_front !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.coil.front', reelDriveResults.friction_bearing_coil_front);
    }
    if (reelDriveResults.friction_bearing_total_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.total.empty', reelDriveResults.friction_bearing_total_empty);
    }
    if (reelDriveResults.friction_bearing_total_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.total.full', reelDriveResults.friction_bearing_total_full);
    }
    if (reelDriveResults.friction_bearing_refl_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.refl.empty', reelDriveResults.friction_bearing_refl_empty);
    }
    if (reelDriveResults.friction_bearing_refl_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.refl.full', reelDriveResults.friction_bearing_refl_full);
    }

    // Map acceleration time
    if (reelDriveResults.acceleration_time !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.accelerationTime', reelDriveResults.acceleration_time);
    }

    // Map torque calculations
    if (reelDriveResults.torque_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.torque', reelDriveResults.torque_empty);
    }
    if (reelDriveResults.torque_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.torque', reelDriveResults.torque_full);
    }

    // Map horsepower requirements
    if (reelDriveResults.horsepower_required_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.horsepowerRequired', reelDriveResults.horsepower_required_empty);
    }
    if (reelDriveResults.horsepower_required_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.horsepowerRequired', reelDriveResults.horsepower_required_full);
    }
    if (reelDriveResults.horsepower_check_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.horsepowerCheck', reelDriveResults.horsepower_check_empty);
    }
    if (reelDriveResults.horsepower_check_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.horsepowerCheck', reelDriveResults.horsepower_check_full);
    }

    // Map regenerative power
    if (reelDriveResults.regen_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.regen', reelDriveResults.regen_empty);
    }
    if (reelDriveResults.regen_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.regen', reelDriveResults.regen_full);
    }
    if (reelDriveResults.regen_check_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.regenCheck', reelDriveResults.regen_check_empty);
    }
    if (reelDriveResults.regen_check_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.regenCheck', reelDriveResults.regen_check_full);
    }

    // Map reel drive OK status
    if (reelDriveResults.reel_drive_ok !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reelDriveOK', reelDriveResults.reel_drive_ok);
    }
  }

  // Update Straightener Utility results
  if (parsedData.str_utility && typeof parsedData.str_utility === 'object') {
    const strUtilityResults = parsedData.str_utility;
    
    // Map straightener torque calculations
    if (strUtilityResults.straightener_required_gear_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.straightener.requiredGearTorque', strUtilityResults.straightener_required_gear_torque);
    }
    if (strUtilityResults.straightener_rated_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.straightener.ratedTorque', strUtilityResults.straightener_rated_torque);
    }

    // Map pinch torque calculations
    if (strUtilityResults.pinch_required_gear_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.pinch.requiredGearTorque', strUtilityResults.pinch_required_gear_torque);
    }
    if (strUtilityResults.pinch_rated_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.pinch.ratedTorque', strUtilityResults.pinch_rated_torque);
    }

    // Map coil calculations
    if (strUtilityResults.actual_coil_weight !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.actualCoilWeight', strUtilityResults.actual_coil_weight);
    }
    if (strUtilityResults.coil_od !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.coilOD', strUtilityResults.coil_od);
    }

    // Map required calculations
    if (strUtilityResults.required_force !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.force', strUtilityResults.required_force);
    }
    if (strUtilityResults.rated_force !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.ratedForce', strUtilityResults.rated_force);
    }
    if (strUtilityResults.required_horsepower !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.horsepower', strUtilityResults.required_horsepower);
    }
    if (strUtilityResults.horsepower_check !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.horsepowerCheck', strUtilityResults.horsepower_check);
    }
    if (strUtilityResults.jack_force_check !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.jackForceCheck', strUtilityResults.jack_force_check);
    }
    if (strUtilityResults.backup_rolls_check !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.backupRollsCheck', strUtilityResults.backup_rolls_check);
    }

    // Map torque calculations
    if (strUtilityResults.torque_straightener !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.straightener', strUtilityResults.torque_straightener);
    }
    if (strUtilityResults.torque_acceleration !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.acceleration', strUtilityResults.torque_acceleration);
    }
    if (strUtilityResults.torque_brake !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.brake', strUtilityResults.torque_brake);
    }
  }
  
  // Update Roll Straightener Backbend results
  if (parsedData.roll_str_backbend && typeof parsedData.roll_str_backbend === 'object') {
    const rollStrResults = parsedData.roll_str_backbend;
    
    // Map roll calculations
    if (rollStrResults.roll_calculations !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.roll.calculations', rollStrResults.roll_calculations);
    }
    
    // Map entry calculations
    if (rollStrResults.entry_calculations !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.entry.calculations', rollStrResults.entry_calculations);
    }
    
    // Map exit calculations
    if (rollStrResults.exit_calculations !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.exit.calculations', rollStrResults.exit_calculations);
    }
    
    // Map work calculations
    if (rollStrResults.work_calculations !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.work.calculations', rollStrResults.work_calculations);
    }
    
    // Map backup calculations
    if (rollStrResults.backup_calculations !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.backup.calculations', rollStrResults.backup_calculations);
    }
  }

  // Update Feed results
  if (parsedData.feed && typeof parsedData.feed === 'object') {
    const feedResults = parsedData.feed;
    
    // Map feed calculations based on PerformanceData structure
    if (feedResults.motor_calculations !== undefined) {
      setNestedValue(updatedResults, 'feed.motor.calculations', feedResults.motor_calculations);
    }
    
    if (feedResults.straightener_calculations !== undefined) {
      setNestedValue(updatedResults, 'feed.straightener.calculations', feedResults.straightener_calculations);
    }
    
    if (feedResults.roll_calculations !== undefined) {
      setNestedValue(updatedResults, 'feed.roll.calculations', feedResults.roll_calculations);
    }
  }

  // Update Shear results
  if (parsedData.shear && typeof parsedData.shear === 'object') {
    const shearResults = parsedData.shear;
    
    // Map shear calculations based on PerformanceData structure
    if (shearResults.shear_calculations !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.calculations', shearResults.shear_calculations);
    }
    
    if (shearResults.scrap_calculations !== undefined) {
      setNestedValue(updatedResults, 'shear.scrap.calculations', shearResults.scrap_calculations);
    }
  }
  
  // Handle error cases
  if (typeof parsedData.str_utility === 'string' && parsedData.str_utility.startsWith('ERROR:')) {
    console.warn('Straightener Utility Error:', parsedData.str_utility);
  }
  
  if (typeof parsedData.tddbhd === 'string' && parsedData.tddbhd.startsWith('ERROR:')) {
    console.warn('TDDBHD Error:', parsedData.tddbhd);
  }
  
  return updatedResults;
}