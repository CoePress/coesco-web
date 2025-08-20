import { set } from "date-fns";
import { update } from "lodash";

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

    // Map density
    if (materialSpecs.material_density !== undefined) {
      setNestedValue(updatedResults, 'common.material.materialDensity', materialSpecs.material_density);
    }
  }

  // Update TDDBHD results
  if (parsedData.tddbhd && typeof parsedData.tddbhd === 'object') {
    const tddbhdResults = parsedData.tddbhd;
    
    // Map coefficient of friction
    if (tddbhdResults.friction !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.coefficientOfFriction', tddbhdResults.friction);
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
    if (tddbhdResults.disp_reel_mtr !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.dispReelMtr', tddbhdResults.disp_reel_mtr);
    }
    
    // Map torque calculations
    if (tddbhdResults.torque_at_mandrel !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.atMandrel', tddbhdResults.torque_at_mandrel);
    }
    if (tddbhdResults.rewind_torque !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.rewindRequired', tddbhdResults.rewind_torque);
    }
    if (tddbhdResults.torque_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.torque.required', tddbhdResults.torque_required);
    }
    
    // Map holddown calculations
    if (tddbhdResults.hold_down_force_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.holddown.force.required', tddbhdResults.hold_down_force_required);
    }
    if (tddbhdResults.hold_down_force_available !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.holddown.force.available', tddbhdResults.hold_down_force_available);
    }
    if (tddbhdResults.holddown_pressure !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.holddown.cylinderPressure', tddbhdResults.holddown_pressure);
    }
    if (tddbhdResults.cylinder_bore !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.cylinderBore', tddbhdResults.cylinder_bore);
    }
    
    // Map brake calculations
    if (tddbhdResults.failsafe_required !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.dragBrake.psiAirRequired', tddbhdResults.failsafe_required);
    }
    if (tddbhdResults.failsafe_holding_force !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.reel.dragBrake.holdingForce', tddbhdResults.failsafe_holding_force);
    }

    // Map coil calculations
    if (tddbhdResults.calculated_coil_weight !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.coil.coilWeight', tddbhdResults.calculated_coil_weight);
    }
    if (tddbhdResults.coil_od !== undefined) {
      setNestedValue(updatedResults, 'tddbhd.coil.coilOD', tddbhdResults.coil_od);
    }
  }
  
  // Update Reel Drive results
  if (parsedData.reel_drive && typeof parsedData.reel_drive === 'object') {
    const reelDriveResults = parsedData.reel_drive;
    
    // Map reel calculations
    if (reelDriveResults.reel.size !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.size', reelDriveResults.reel.size);
    }
    if (reelDriveResults.reel.max_width !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.maxWidth', reelDriveResults.reel.max_width);
    }
    if (reelDriveResults.reel.brg_dist !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.bearing.distance', reelDriveResults.reel.brg_dist);
    }
    if (reelDriveResults.reel.f_brg_dia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.bearing.diameter.front', reelDriveResults.reel.f_brg_dia);
    }
    if (reelDriveResults.reel.r_brg_dia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.bearing.diameter.rear', reelDriveResults.reel.r_brg_dia);
    }

    // Map mandrel calculations
    if (reelDriveResults.mandrel.diameter !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.diameter', reelDriveResults.mandrel.diameter);
    }
    if (reelDriveResults.mandrel.length !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.length', reelDriveResults.mandrel.length);
    }
    if (reelDriveResults.mandrel.max_rpm !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.maxRPM', reelDriveResults.mandrel.max_rpm);
    }
    if (reelDriveResults.mandrel.rpm_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.RpmFull', reelDriveResults.mandrel.rpm_full);
    }
    if (reelDriveResults.mandrel.weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.weight', reelDriveResults.mandrel.weight);
    }
    if (reelDriveResults.mandrel.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.inertia', reelDriveResults.mandrel.inertia);
    }
    if (reelDriveResults.mandrel.refl_inert !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.mandrel.reflInertia', reelDriveResults.mandrel.refl_inert);
    }

    // Map backplate calculations
    if (reelDriveResults.backplate.diameter !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.diameter', reelDriveResults.backplate.diameter);
    }
    if (reelDriveResults.backplate.thickness !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.thickness', reelDriveResults.backplate.thickness);
    }
    if (reelDriveResults.backplate.weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.weight', reelDriveResults.backplate.weight);
    }
    if (reelDriveResults.backplate.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.inertia', reelDriveResults.backplate.inertia);
    }
    if (reelDriveResults.backplate.refl_inert !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.backplate.reflInertia', reelDriveResults.backplate.refl_inert);
    }

    // Map coil calculations
    if (reelDriveResults.coil.density !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.density', reelDriveResults.coil.density);
    }
    if (reelDriveResults.coil.od !== undefined) {
      setNestedValue(updatedResults, 'common.coil.od', reelDriveResults.coil.od);
    }
    if (reelDriveResults.coil.id !== undefined) {
      setNestedValue(updatedResults, 'common.coil.id', reelDriveResults.coil.id);
    }
    if (reelDriveResults.coil.width !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.width', reelDriveResults.coil.width);
    }
    if (reelDriveResults.coil.weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.weight', reelDriveResults.coil.weight);
    }
    if (reelDriveResults.coil.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.inertia', reelDriveResults.coil.inertia);
    }
    if (reelDriveResults.coil.refl_inert !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.coil.reflInertia', reelDriveResults.coil.refl_inert);
    }

    // Map reducer calculations
    if (reelDriveResults.reducer.ratio !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.ratio', reelDriveResults.reducer.ratio);
    }
    if (reelDriveResults.reducer.driving !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.driving', reelDriveResults.reducer.driving);
    }
    if (reelDriveResults.reducer.backdriving !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.backdriving', reelDriveResults.reducer.backdriving);
    }
    if (reelDriveResults.reducer.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.inertia', reelDriveResults.reducer.inertia);
    }
    if (reelDriveResults.reducer.refl_inert !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reducer.reflInertia', reelDriveResults.reducer.refl_inert);
    }

    // Map chain calculations
    if (reelDriveResults.chain.ratio !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.ratio', reelDriveResults.chain.ratio);
    }
    if (reelDriveResults.chain.sprkt_od !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.sprktOD', reelDriveResults.chain.sprkt_od);
    }
    if (reelDriveResults.chain.sprkt_thk !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.sprktThickness', reelDriveResults.chain.sprkt_thk);
    }
    if (reelDriveResults.chain.weight !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.weight', reelDriveResults.chain.weight);
    }
    if (reelDriveResults.chain.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.inertia', reelDriveResults.chain.inertia);
    }
    if (reelDriveResults.chain.refl_inert !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.chain.reflInertia', reelDriveResults.chain.refl_inert);
    }

    // Map ratio
    if (reelDriveResults.total.ratio !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.ratio', reelDriveResults.total.ratio);
    }

    // Map total reflected inertia
    if (reelDriveResults.total.total_refl_inertia_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.totalReflInertia.empty', reelDriveResults.total.total_refl_inertia_empty);
    }
    if (reelDriveResults.total.total_refl_inertia_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.totalReflInertia.full', reelDriveResults.total.total_refl_inertia_full);
    }

    // Map motor calculations
    if (reelDriveResults.motor.hp !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.motor.hp', reelDriveResults.motor.hp);
    }
    if (reelDriveResults.motor.inertia !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.motor.inertia', reelDriveResults.motor.inertia);
    }
    if (reelDriveResults.motor.rpm_base !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.motor.rpm.base', reelDriveResults.motor.rpm_base);
    }
    if (reelDriveResults.motor.rpm_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.motor.rpm.full', reelDriveResults.motor.rpm_full);
    }

    // Map friction calculations
    if (reelDriveResults.friction.r_brg_mand !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.mandrel.rear', reelDriveResults.friction.r_brg_mand);
    }
    if (reelDriveResults.friction.f_brg_mand !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.mandrel.front', reelDriveResults.f_brg_mand);
    }
    if (reelDriveResults.friction.r_brg_coil !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.coil.front', reelDriveResults.friction.r_brg_coil);
    }
    if (reelDriveResults.friction.f_brg_coil !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.coil.rear', reelDriveResults.friction.f_brg_coil);
    }
    if (reelDriveResults.friction.total_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.total.empty', reelDriveResults.friction.total_empty);
    }
    if (reelDriveResults.friction.total_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.total.full', reelDriveResults.friction.total_full);
    }
    if (reelDriveResults.friction.refl_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.refl.empty', reelDriveResults.friction.refl_empty);
    }
    if (reelDriveResults.friction.refl_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.friction.bearing.refl.full', reelDriveResults.friction.refl_full);
    }

    // Map acceleration time
    if (reelDriveResults.speed.speed !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.speed', reelDriveResults.speed.speed);
    }
    if (reelDriveResults.speed.accel_rate !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.accelerationRate', reelDriveResults.speed.accel_rate);
    }
    if (reelDriveResults.speed.accel_time !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.accelerationTime', reelDriveResults.speed.accel_time);
    }

    // Map torque calculations
    if (reelDriveResults.torque.empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.torque', reelDriveResults.torque.empty);
    }
    if (reelDriveResults.torque.full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.torque', reelDriveResults.torque.full);
    }

    // Map horsepower requirements
    if (reelDriveResults.hp_req.empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.horsepowerRequired', reelDriveResults.hp_req.empty);
    }
    if (reelDriveResults.hp_req.full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.horsepowerRequired', reelDriveResults.hp_req.full);
    }
    if (reelDriveResults.hp_req.status_empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.horsepowerCheck', reelDriveResults.hp_req.status_empty);
    }
    if (reelDriveResults.hp_req.status_full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.horsepowerCheck', reelDriveResults.hp_req.status_full);
    }

    // Map regenerative power
    if (reelDriveResults.regen.empty !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.empty.regen', reelDriveResults.regen.empty);
    }
    if (reelDriveResults.regen.full !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.torque.full.regen', reelDriveResults.regen.full);
    }

    // Map reel drive OK status
    if (reelDriveResults.use_pulloff !== undefined) {
      setNestedValue(updatedResults, 'reelDrive.reel.reelDriveOK', reelDriveResults.use_pulloff);
    }
  }

  // Update Straightener Utility results
  if (parsedData.str_utility && typeof parsedData.str_utility === 'object') {
    const strUtilityResults = parsedData.str_utility;
    
    // Map straightener torque calculations
    if (strUtilityResults.str_roll_dia !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.straightener.diameter', strUtilityResults.str_roll_dia);
    }
    if (strUtilityResults.str_roll_req_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.straightener.requiredGearTorque', strUtilityResults.str_roll_req_torque);
    }
    if (strUtilityResults.str_roll_rated_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.straightener.ratedTorque', strUtilityResults.str_roll_rated_torque);
    }

    // Map pinch torque calculations
    if (strUtilityResults.pinch_roll_dia !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.pinch.diameter', strUtilityResults.pinch_roll_dia);
    }
    if (strUtilityResults.pinch_roll_req_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.pinch.requiredGearTorque', strUtilityResults.pinch_roll_req_torque);
    }
    if (strUtilityResults.pinch_roll_rated_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.pinch.ratedTorque', strUtilityResults.pinch_roll_rated_torque);
    }

    // Map coil calculations
    if (strUtilityResults.actual_coil_weight !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.actualCoilWeight', strUtilityResults.actual_coil_weight);
    }
    if (strUtilityResults.coil_od !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.coilOD', strUtilityResults.coil_od);
    }

    // Map other calculations
    if (strUtilityResults.center_dist !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.centerDistance', strUtilityResults.center_dist);
    }
    if (strUtilityResults.jack_force_available !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.jackForceAvailable', strUtilityResults.jack_force_available);
    }
    if (strUtilityResults.max_roll_depth !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.rolls.depth.withoutMaterial', strUtilityResults.max_roll_depth);
    }
    if (strUtilityResults.modulus !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.modulus', strUtilityResults.modulus);
    }
    if (strUtilityResults.pinch_roll_teeth !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.pinchRoll.numberOfTeeth', strUtilityResults.pinch_roll_teeth);
    }
    if (strUtilityResults.pinch_roll_dp !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.pinchRoll.dp', strUtilityResults.pinch_roll_dp);
    }
    if (strUtilityResults.str_roll_teeth !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.straightenerRoll.numberOfTeeth', strUtilityResults.str_roll_teeth);
    }
    if (strUtilityResults.str_roll_dp !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.straightenerRoll.dp', strUtilityResults.str_roll_dp);
    }
    if (strUtilityResults.cont_angle !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.contAngle', strUtilityResults.cont_angle);
    }
    if (strUtilityResults.face_width !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.gear.faceWidth', strUtilityResults.face_width);
    }
    if (strUtilityResults.feed_rate_check !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.feedRateCheck', strUtilityResults.feed_rate_check);
    }

    // Map required calculations
    if (strUtilityResults.required_force !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.force', strUtilityResults.required_force);
    }
    if (strUtilityResults.horsepower_required !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.required.horsepower', strUtilityResults.horsepower_required);
    }

    // Map torque calculations
    if (strUtilityResults.str_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.straightener', strUtilityResults.str_torque);
    }
    if (strUtilityResults.acceleration_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.acceleration', strUtilityResults.acceleration_torque);
    }
    if (strUtilityResults.brake_torque !== undefined) {
      setNestedValue(updatedResults, 'strUtility.straightener.torque.brake', strUtilityResults.brake_torque);
    }
  }
  
  // Update Roll Straightener Backbend results
  if (parsedData.roll_str_backbend && typeof parsedData.roll_str_backbend === 'object') {
    const rollStrResults = parsedData.roll_str_backbend;
    
    // Map basic roll parameters
    if (rollStrResults.roll_diameter !== undefined) {
      setNestedValue(updatedResults, 'common.equipment.straightener.rollDiameter', rollStrResults.roll_diameter);
    }
    if (rollStrResults.center_distance !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.centerDistance', rollStrResults.center_distance);
    }
    if (rollStrResults.modulus !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.modulus', rollStrResults.modulus);
    }
    if (rollStrResults.jack_force_available !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.jackForceAvailable', rollStrResults.jack_force_available);
    }
    
    // Map roll depth calculations
    if (rollStrResults.max_roll_depth_without_material !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.depth.withoutMaterial', rollStrResults.max_roll_depth_without_material);
    }
    if (rollStrResults.max_roll_depth_with_material !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.depth.withMaterial', rollStrResults.max_roll_depth_with_material);
    }
    
    // Map radius calculations
    if (rollStrResults.radius_off_coil !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil', rollStrResults.radius_off_coil);
    }
    if (rollStrResults.radius_off_coil_after_springback !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.offCoilAfterSpringback', rollStrResults.radius_off_coil_after_springback);
    }
    if (rollStrResults.one_radius_off_coil !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.oneOffCoil', rollStrResults.one_radius_off_coil);
    }
    if (rollStrResults.curve_at_yield !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.curveAtYield', rollStrResults.curve_at_yield);
    }
    if (rollStrResults.radius_at_yield !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.radiusAtYield', rollStrResults.radius_at_yield);
    }
    if (rollStrResults.bending_moment_to_yield !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.radius.bendingMomentToYield', rollStrResults.bending_moment_to_yield);
    }
    if (rollStrResults.hidden_const !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.hiddenValue', rollStrResults.hidden_const);
    }

    // Map overall backbend calculations
    if (rollStrResults.roller_depth_required !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.depthRequired', rollStrResults.roller_depth_required);
    }
    if (rollStrResults.roller_depth_required_check !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.yieldMet', rollStrResults.roller_depth_required_check === "OK" ? "Yes" : "No");
    }
    if (rollStrResults.roller_force_required !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequired', rollStrResults.roller_force_required);
    }
    if (rollStrResults.roller_force_required_check !== undefined) {
      setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequiredCheck', rollStrResults.roller_force_required_check === "OK" ? "Yes" : "No");
    }
    
    // Map first roller calculations - UP direction
    if (rollStrResults.first_up) {
      const firstUp = rollStrResults.first_up;
      if (firstUp.roll_height_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.height', firstUp.roll_height_first_up);
      }
      if (firstUp.res_rad_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.resultingRadius', firstUp.res_rad_first_up);
      }
      if (firstUp.r_ri_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.curvatureDifference', firstUp.r_ri_first_up);
      }
      if (firstUp.mb_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMoment', firstUp.mb_first_up);
      }
      if (firstUp.mb_my_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMomentRatio', firstUp.mb_my_first_up);
      }
      if (firstUp.springback_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.springback', firstUp.springback_first_up);
      }
      if (firstUp.radius_after_springback_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.radiusAfterSpringback', firstUp.radius_after_springback_first_up);
      }
      if (firstUp.force_required_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.forceRequired', firstUp.force_required_first_up);
      }
      if (firstUp.percent_yield_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.percentOfThicknessYielded', firstUp.percent_yield_first_up === "NONE" ? 0 : firstUp.percent_yield_first_up);
      }
      if (firstUp.number_of_yield_strains_first_up !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.numberOfYieldStrainsAtSurface', firstUp.number_of_yield_strains_first_up);
      }
    }
    
    // Map first roller calculations - DOWN direction
    if (rollStrResults.first_down) {
      const firstDown = rollStrResults.first_down;
      if (firstDown.res_rad_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.resultingRadius', firstDown.res_rad_first_down);
      }
      if (firstDown.r_ri_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.curvatureDifference', firstDown.r_ri_first_down);
      }
      if (firstDown.mb_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMoment', firstDown.mb_first_down);
      }
      if (firstDown.mb_my_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMomentRatio', firstDown.mb_my_first_down);
      }
      if (firstDown.springback_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.springback', firstDown.springback_first_down);
      }
      if (firstDown.radius_after_springback_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.radiusAfterSpringback', firstDown.radius_after_springback_first_down);
      }
      if (firstDown.percent_yield_first_down !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.percentOfThicknessYielded', firstDown.percent_yield_first_down === "NONE" ? 0 : firstDown.percent_yield_first_down);
      }
    }
    
    // Determine number of straightener rolls to handle middle rollers appropriately
    const numRolls = rollStrResults.num_str_rolls || 7; // Default to 7 if not specified
    let numMiddleRollers = 0;
    
    if (numRolls === 7) {
      numMiddleRollers = 1; // One middle roller
    } else if (numRolls === 9) {
      numMiddleRollers = 2; // Two middle rollers
    } else if (numRolls === 11) {
      numMiddleRollers = 3; // Three middle rollers
    }
    
    // Map middle roller calculations based on number of rolls
    for (let i = 1; i <= numMiddleRollers; i++) {
      // Map middle roller UP direction
      const midUpKey = `mid_up_${i}`;
      if (rollStrResults[midUpKey]) {
        const midUp = rollStrResults[midUpKey];
        const rollerPath = numMiddleRollers === 1 ? 'middle' : `middle${i}`;
        
        if (midUp.roll_height_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.height`, midUp.roll_height_mid_up);
        }
        if (midUp.res_rad_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.resultingRadius`, midUp.res_rad_mid_up);
        }
        if (midUp.r_ri_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.curvatureDifference`, midUp.r_ri_mid_up);
        }
        if (midUp.mb_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.bendingMoment`, midUp.mb_mid_up);
        }
        if (midUp.mb_my_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.bendingMomentRatio`, midUp.mb_my_mid_up);
        }
        if (midUp.springback_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.springback`, midUp.springback_mid_up);
        }
        if (midUp.radius_after_springback_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.radiusAfterSpringback`, midUp.radius_after_springback_mid_up);
        }
        if (midUp.force_required_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.forceRequired`, midUp.force_required_mid_up);
        }
        if (midUp.percent_yield_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.up.percentOfThicknessYielded`, midUp.percent_yield_mid_up === "NONE" ? 0 : midUp.percent_yield_mid_up);
        }
        if (midUp.number_of_yield_strains_mid_up !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.numberOfYieldStrainsAtSurface`, midUp.number_of_yield_strains_mid_up);
        }
      }
      
      // Map middle roller DOWN direction
      const midDownKey = `mid_down_${i}`;
      if (rollStrResults[midDownKey]) {
        const midDown = rollStrResults[midDownKey];
        const rollerPath = numMiddleRollers === 1 ? 'middle' : `middle${i}`;
        
        if (midDown.res_rad_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.resultingRadius`, midDown.res_rad_mid_down);
        }
        if (midDown.r_ri_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.curvatureDifference`, midDown.r_ri_mid_down);
        }
        if (midDown.mb_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.bendingMoment`, midDown.mb_mid_down);
        }
        if (midDown.mb_my_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.bendingMomentRatio`, midDown.mb_my_mid_down);
        }
        if (midDown.springback_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.springback`, midDown.springback_mid_down);
        }
        if (midDown.radius_after_springback_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.radiusAfterSpringback`, midDown.radius_after_springback_mid_down);
        }
        if (midDown.percent_yield_mid_down !== undefined) {
          setNestedValue(updatedResults, `rollStrBackbend.straightener.rolls.backbend.rollers.${rollerPath}.down.percentOfThicknessYielded`, midDown.percent_yield_mid_down === "NONE" ? 0 : midDown.percent_yield_mid_down);
        }
      }
    }
    
    // Map last roller calculations
    if (rollStrResults.last) {
      const last = rollStrResults.last;
      if (last.roll_height_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.height', last.roll_height_last);
      }
      if (last.res_rad_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.resultingRadius', last.res_rad_last);
      }
      if (last.r_ri_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.curvatureDifference', last.r_ri_last);
      }
      if (last.mb_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.bendingMoment', last.mb_last);
      }
      if (last.mb_my_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.bendingMomentRatio', last.mb_my_last);
      }
      if (last.springback_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.springback', last.springback_last);
      }
      if (last.radius_after_springback_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.radiusAfterSpringback', last.radius_after_springback_last);
      }
      if (last.force_required_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.forceRequired', last.force_required_last);
      }
      if (last.percent_yield_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.percentOfThicknessYielded', last.percent_yield_last === "NONE" ? 0 : last.percent_yield_last);
      }
      if (last.number_of_yield_strains_last !== undefined) {
        setNestedValue(updatedResults, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.numberOfYieldStrainsAtSurface', last.number_of_yield_strains_last);
      }
    }
  }

  // Update Feed results
  if (parsedData.feed && typeof parsedData.feed === 'object') {
    const feedResults = parsedData.feed;
    
    // Map basic feed motor calculations (common to all feed types)
    if (feedResults.max_motor_rpm !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.maxMotorRPM', feedResults.max_motor_rpm);
    }
    if (feedResults.motor_inertia !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.motorInertia', feedResults.motor_inertia);
    }
    if (feedResults.max_vel !== undefined) {
      setNestedValue(updatedResults, 'common.equipment.feed.maximumVelocity', feedResults.max_vel);
    }
    if (feedResults.settle_time !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.settleTime', feedResults.settle_time);
    }
    if (feedResults.ratio !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.ratio', feedResults.ratio);
    }
    
    // Map torque calculations
    if (feedResults.motor_peak_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.motorPeak', feedResults.motor_peak_torque);
    }
    if (feedResults.motor_rms_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.rms.motor', feedResults.motor_rms_torque);
    }
    if (feedResults.frictiaonal_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.frictional', feedResults.frictiaonal_torque);
    }
    if (feedResults.loop_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.loop', feedResults.loop_torque);
    }
    if (feedResults.settle_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.settle', feedResults.settle_torque);
    }
    if (feedResults.peak_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.peak', feedResults.peak_torque);
    }
    if (feedResults.acceleration_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.acceleration', feedResults.acceleration_torque);
    }
    if (feedResults.rms_torque_fa1 !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.rms.feedAngle1', feedResults.rms_torque_fa1);
    }
    if (feedResults.rms_torque_fa2 !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.torque.rms.feedAngle2', feedResults.rms_torque_fa2);
    }
    
    // Map inertia and match calculations
    if (feedResults.refl_inertia !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.reflInertia', feedResults.refl_inertia);
    }
    if (feedResults.match !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.match', feedResults.match);
    }
    
    // Map regenerative power
    if (feedResults.regen !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.regen', feedResults.regen);
    }
    
    // Map table values for performance results
    if (feedResults.table_values && Array.isArray(feedResults.table_values)) {
      setNestedValue(updatedResults, 'feed.feed.tableValues', feedResults.table_values);
    }
    
    // Handle Sigma 5 Pull-Through specific calculations
    if (feedResults.pinch_rolls !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.pullThru.pinchRolls', feedResults.pinch_rolls);
    }
    if (feedResults.straightner_torque !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.pullThru.straightenerTorque', feedResults.straightner_torque);
    }
    if (feedResults.payoff_max_speed !== undefined) {
      setNestedValue(updatedResults, 'feed.feed.pullThru.payoffMaxSpeed', feedResults.payoff_max_speed);
    }
    
    // Calculate material in loop (this appears to be calculated on frontend)
    const materialThickness = getNestedValue(updatedResults, 'common.material.materialThickness') || 0;
    const loopPit = getNestedValue(updatedResults, 'common.equipment.feed.loopPit') || "";
    let materialInLoop = 0;
    
    if (materialThickness > 0) {
      if (loopPit.toLowerCase() === "y" || loopPit.toLowerCase() === "yes") {
        materialInLoop = materialThickness * 360 * Math.PI * 2;
      } else {
        materialInLoop = materialThickness * 360 * Math.PI;
      }
      setNestedValue(updatedResults, 'feed.feed.materialInLoop', materialInLoop);
    }
    
    // Map any additional Allen Bradley specific calculations
    // (Currently Allen Bradley uses the same calculation as Sigma 5, but this allows for future expansion)
    if (feedResults.allen_bradley_specific_field !== undefined) {
      // Add Allen Bradley specific mappings here when needed
    }
  }

  // Update Shear results
  if (parsedData.shear && typeof parsedData.shear === 'object') {
    const shearResults = parsedData.shear;
    
    // Map material and blade calculations
    if (shearResults.shear_strength !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.strength', shearResults.shear_strength);
    }
    if (shearResults.angle_of_blade !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.blade.angleOfBlade', shearResults.angle_of_blade);
    }
    if (shearResults.length_of_init_cut !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.blade.initialCut.length', shearResults.length_of_init_cut);
    }
    if (shearResults.area_of_cut !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.blade.initialCut.area', shearResults.area_of_cut);
    }
    
    // Map stroke calculations
    if (shearResults.min_stroke_for_blade !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.cylinder.minStroke.forBlade', shearResults.min_stroke_for_blade);
    }
    if (shearResults.min_stroke_req_for_opening !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.cylinder.minStroke.requiredForOpening', shearResults.min_stroke_req_for_opening);
    }
    if (shearResults.actual_opening_above_max_material !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.cylinder.actualOpeningAboveMaxMaterial', shearResults.actual_opening_above_max_material);
    }
    
    // Map hydraulic calculations
    if (shearResults.cylinder_area !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.hydraulic.cylinder.area', shearResults.cylinder_area);
    }
    if (shearResults.cylinder_volume !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.hydraulic.cylinder.volume', shearResults.cylinder_volume);
    }
    if (shearResults.fluid_velocity !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.hydraulic.fluidVelocity', shearResults.fluid_velocity);
    }
    
    // Map force calculations (conclusions)
    if (shearResults.force_per_cylinder !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.force.perCylinder', shearResults.force_per_cylinder);
    }
    if (shearResults.total_force_applied_lbs !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.force.totalApplied.lbs', shearResults.total_force_applied_lbs);
    }
    if (shearResults.force_req_to_shear !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.force.requiredToShear', shearResults.force_req_to_shear);
    }
    if (shearResults.total_force_applied_tons !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.force.totalApplied.tons', shearResults.total_force_applied_tons);
    }
    if (shearResults.safety_factor !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.safetyFactor', shearResults.safety_factor);
    }
    
    // Map performance calculations (conclusions)
    if (shearResults.instant_gallons_per_minute_req !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.perMinute.gallons.instantaneous', shearResults.instant_gallons_per_minute_req);
    }
    if (shearResults.averaged_gallons_per_minute_req !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.perMinute.gallons.averaged', shearResults.averaged_gallons_per_minute_req);
    }
    if (shearResults.shear_strokes_per_minute !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.perMinute.shearStrokes', shearResults.shear_strokes_per_minute);
    }
    if (shearResults.parts_per_minute !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.perMinute.parts', shearResults.parts_per_minute);
    }
    if (shearResults.parts_per_hour !== undefined) {
      setNestedValue(updatedResults, 'shear.shear.conclusions.perHour.parts', shearResults.parts_per_hour);
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