import { PerformanceData } from "@/contexts/performance.context";

export type MappingConfig = {
  [backendKey: string]: string | { key: string, transform?: (val: any, backend?: any) => any }
};

// Add a new function specifically for mapping calculation results
export function mapCalculationResultsToPerformanceData(
  calculationResults: any,
  currentData?: Partial<PerformanceData>
): Partial<PerformanceData> {
  const safeNumber = (value: any) => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Initialize the result with current data to preserve user input
  const result: Partial<PerformanceData> = { ...currentData };

  // Map RFQ calculation results (FPM values)
  if (calculationResults.rfq) {
    if (!result.feed) result.feed = {};
    
    if (calculationResults.rfq.average && typeof calculationResults.rfq.average === 'object') {
      if (!result.feed.average) result.feed.average = {};
      result.feed.average.fpm = safeNumber(calculationResults.rfq.average.fpm || calculationResults.rfq.average);
    }
    
    if (calculationResults.rfq.min && typeof calculationResults.rfq.min === 'object') {
      if (!result.feed.min) result.feed.min = {};
      result.feed.min.fpm = safeNumber(calculationResults.rfq.min.fpm || calculationResults.rfq.min);
    }
    
    if (calculationResults.rfq.max && typeof calculationResults.rfq.max === 'object') {
      if (!result.feed.max) result.feed.max = {};
      result.feed.max.fpm = safeNumber(calculationResults.rfq.max.fpm || calculationResults.rfq.max);
    }
  }

  // Map Material Specs calculation results
  if (calculationResults.material_specs) {
    const matSpecs = calculationResults.material_specs;
    
    if (!result.material) result.material = {};
    if (!result.feed) result.feed = {};
    if (!result.reel) result.reel = {};
    
    // Calculated coil OD
    if (matSpecs.coil_od_calculated !== undefined) {
      result.material.calculatedCoilOD = safeNumber(matSpecs.coil_od_calculated);
    }
    
    // Feed model selection
    if (matSpecs.model) {
      result.feed.model = String(matSpecs.model);
    }
    
    // Machine width
    if (matSpecs.machine_width !== undefined) {
      result.feed.machineWidth = safeNumber(matSpecs.machine_width);
    }
    
    // Reel model
    if (matSpecs.reel_model) {
      result.reel.model = String(matSpecs.reel_model);
    }
    
    // Reel width
    if (matSpecs.reel_width !== undefined) {
      result.reel.width = safeNumber(matSpecs.reel_width);
    }
  }

  // Map TDDBHD calculation results
  if (calculationResults.tddbhd) {
    const tddbhd = calculationResults.tddbhd;
    
    if (!result.reel) result.reel = {};
    if (!result.reel.holddown) result.reel.holddown = {};
    if (!result.reel.dragBrake) result.reel.dragBrake = {};
    if (!result.reel.threadingDrive) result.reel.threadingDrive = {};
    
    // Holddown calculations
    if (tddbhd.holddown_force_required !== undefined) {
      if (!result.reel.holddown.force) result.reel.holddown.force = {};
      result.reel.holddown.force.required = safeNumber(tddbhd.holddown_force_required);
    }
    
    if (tddbhd.holddown_force_available !== undefined) {
      if (!result.reel.holddown.force) result.reel.holddown.force = {};
      result.reel.holddown.force.available = safeNumber(tddbhd.holddown_force_available);
    }
    
    // Drag brake calculations
    if (tddbhd.brake_psi_air_required !== undefined) {
      result.reel.dragBrake.psiAirRequired = safeNumber(tddbhd.brake_psi_air_required);
    }
    
    if (tddbhd.brake_holding_force !== undefined) {
      result.reel.dragBrake.holdingForce = safeNumber(tddbhd.brake_holding_force);
    }
    
    // Threading drive selections
    if (tddbhd.threading_drive_hyd !== undefined) {
      result.reel.threadingDrive.hydThreadingDrive = tddbhd.threading_drive_hyd ? "true" : "false";
    }
    
    if (tddbhd.threading_drive_air_clutch !== undefined) {
      result.reel.threadingDrive.airClutch = tddbhd.threading_drive_air_clutch ? "true" : "false";
    }
  }

  // Map Reel Drive calculation results
  if (calculationResults.reel_drive) {
    const reelDrive = calculationResults.reel_drive;
    
    if (!result.reel) result.reel = {};
    if (!result.reel.bearing) result.reel.bearing = {};
    if (!result.reel.bearing.diameter) result.reel.bearing.diameter = {};
    if (!result.reel.mandrel) result.reel.mandrel = {};
    if (!result.reel.backplate) result.reel.backplate = {};
    if (!result.reel.reducer) result.reel.reducer = {};
    if (!result.reel.chain) result.reel.chain = {};
    if (!result.reel.motor) result.reel.motor = {};
    if (!result.reel.motor.rpm) result.reel.motor.rpm = {};
    if (!result.reel.totalReflInertia) result.reel.totalReflInertia = {};
    if (!result.reel.friction) result.reel.friction = {};
    if (!result.reel.friction.bearing) result.reel.friction.bearing = {};
    if (!result.reel.friction.bearing.mandrel) result.reel.friction.bearing.mandrel = {};
    if (!result.reel.friction.bearing.coil) result.reel.friction.bearing.coil = {};
    if (!result.reel.friction.bearing.total) result.reel.friction.bearing.total = {};
    if (!result.reel.friction.bearing.refl) result.reel.friction.bearing.refl = {};
    if (!result.reel.torque) result.reel.torque = {};
    if (!result.reel.torque.empty) result.reel.torque.empty = {};
    if (!result.reel.torque.full) result.reel.torque.full = {};
    if (!result.reel.motorization) result.reel.motorization = {};
    if (!result.reel.webTension) result.reel.webTension = {};
    
    // Bearing diameters
    if (reelDrive.reel_f_brg_dia !== undefined) {
      result.reel.bearing.diameter.front = safeNumber(reelDrive.reel_f_brg_dia);
    }
    if (reelDrive.reel_r_brg_dia !== undefined) {
      result.reel.bearing.diameter.rear = safeNumber(reelDrive.reel_r_brg_dia);
    }
    if (reelDrive.reel_brg_dist !== undefined) {
      result.reel.bearing.distance = safeNumber(reelDrive.reel_brg_dist);
    }
    
    // Mandrel calculations
    if (reelDrive.mandrel_diameter !== undefined) {
      result.reel.mandrel.diameter = safeNumber(reelDrive.mandrel_diameter);
    }
    if (reelDrive.mandrel_length !== undefined) {
      result.reel.mandrel.length = safeNumber(reelDrive.mandrel_length);
    }
    if (reelDrive.mandrel_max_rpm !== undefined) {
      result.reel.mandrel.maxRPM = safeNumber(reelDrive.mandrel_max_rpm);
    }
    if (reelDrive.mandrel_rpm_full !== undefined) {
      result.reel.mandrel.RpmFull = safeNumber(reelDrive.mandrel_rpm_full);
    }
    if (reelDrive.mandrel_weight !== undefined) {
      result.reel.mandrel.weight = safeNumber(reelDrive.mandrel_weight);
    }
    if (reelDrive.mandrel_inertia !== undefined) {
      result.reel.mandrel.inertia = safeNumber(reelDrive.mandrel_inertia);
    }
    if (reelDrive.mandrel_refl_inert !== undefined) {
      result.reel.mandrel.reflInertia = safeNumber(reelDrive.mandrel_refl_inert);
    }
    
    // Backplate calculations
    if (reelDrive.backplate_thickness !== undefined) {
      result.reel.backplate.thickness = safeNumber(reelDrive.backplate_thickness);
    }
    if (reelDrive.backplate_weight !== undefined) {
      result.reel.backplate.weight = safeNumber(reelDrive.backplate_weight);
    }
    if (reelDrive.backplate_inertia !== undefined) {
      result.reel.backplate.inertia = safeNumber(reelDrive.backplate_inertia);
    }
    if (reelDrive.backplate_refl_inert !== undefined) {
      result.reel.backplate.reflInertia = safeNumber(reelDrive.backplate_refl_inert);
    }
    
    // Reducer calculations
    if (reelDrive.reducer_ratio !== undefined) {
      result.reel.reducer.ratio = safeNumber(reelDrive.reducer_ratio);
    }
    if (reelDrive.reducer_efficiency !== undefined) {
      result.reel.reducer.efficiency = safeNumber(reelDrive.reducer_efficiency);
    }
    if (reelDrive.reducer_driving !== undefined) {
      result.reel.reducer.driving = safeNumber(reelDrive.reducer_driving);
    }
    if (reelDrive.reducer_backdriving !== undefined) {
      result.reel.reducer.backdriving = safeNumber(reelDrive.reducer_backdriving);
    }
    if (reelDrive.reducer_inertia !== undefined) {
      result.reel.reducer.inertia = safeNumber(reelDrive.reducer_inertia);
    }
    if (reelDrive.reducer_refl_inert !== undefined) {
      result.reel.reducer.reflInertia = safeNumber(reelDrive.reducer_refl_inert);
    }
    
    // Chain calculations
    if (reelDrive.chain_ratio !== undefined) {
      result.reel.chain.ratio = safeNumber(reelDrive.chain_ratio);
    }
    if (reelDrive.chain_sprkt_od !== undefined) {
      result.reel.chain.sprktOD = safeNumber(reelDrive.chain_sprkt_od);
    }
    if (reelDrive.chain_sprkt_thk !== undefined) {
      result.reel.chain.sprktThickness = safeNumber(reelDrive.chain_sprkt_thk);
    }
    if (reelDrive.chain_weight !== undefined) {
      result.reel.chain.weight = safeNumber(reelDrive.chain_weight);
    }
    if (reelDrive.chain_inertia !== undefined) {
      result.reel.chain.inertia = safeNumber(reelDrive.chain_inertia);
    }
    if (reelDrive.chain_refl_inert !== undefined) {
      result.reel.chain.reflInertia = safeNumber(reelDrive.chain_refl_inert);
    }
    
    // Motor calculations
    if (reelDrive.motor_inertia !== undefined) {
      result.reel.motor.inertia = safeNumber(reelDrive.motor_inertia);
    }
    if (reelDrive.motor_base_rpm !== undefined) {
      result.reel.motor.rpm.base = safeNumber(reelDrive.motor_base_rpm);
    }
    if (reelDrive.motor_rpm_full !== undefined) {
      result.reel.motor.rpm.full = safeNumber(reelDrive.motor_rpm_full);
    }
    
    // Total reflected inertia
    if (reelDrive.total_refl_inertia_empty !== undefined) {
      result.reel.totalReflInertia.empty = safeNumber(reelDrive.total_refl_inertia_empty);
    }
    if (reelDrive.total_refl_inertia_full !== undefined) {
      result.reel.totalReflInertia.full = safeNumber(reelDrive.total_refl_inertia_full);
    }
    
    // Friction calculations
    if (reelDrive.friction_r_brg_mand !== undefined) {
      result.reel.friction.bearing.mandrel.rear = safeNumber(reelDrive.friction_r_brg_mand);
    }
    if (reelDrive.friction_f_brg_mand !== undefined) {
      result.reel.friction.bearing.mandrel.front = safeNumber(reelDrive.friction_f_brg_mand);
    }
    if (reelDrive.friction_f_brg_coil !== undefined) {
      result.reel.friction.bearing.coil.front = safeNumber(reelDrive.friction_f_brg_coil);
    }
    if (reelDrive.friction_total_empty !== undefined) {
      result.reel.friction.bearing.total.empty = safeNumber(reelDrive.friction_total_empty);
    }
    if (reelDrive.friction_total_full !== undefined) {
      result.reel.friction.bearing.total.full = safeNumber(reelDrive.friction_total_full);
    }
    if (reelDrive.friction_refl_empty !== undefined) {
      result.reel.friction.bearing.refl.empty = safeNumber(reelDrive.friction_refl_empty);
    }
    if (reelDrive.friction_refl_full !== undefined) {
      result.reel.friction.bearing.refl.full = safeNumber(reelDrive.friction_refl_full);
    }
    
    // Torque calculations
    if (reelDrive.torque_at_mandrel !== undefined) {
      result.reel.torque.atMandrel = safeNumber(reelDrive.torque_at_mandrel);
    }
    if (reelDrive.rewind_torque !== undefined) {
      result.reel.torque.rewindRequired = safeNumber(reelDrive.rewind_torque);
    }
    if (reelDrive.torque_required !== undefined) {
      result.reel.torque.required = safeNumber(reelDrive.torque_required);
    }
    if (reelDrive.torque_empty !== undefined) {
      result.reel.torque.empty.torque = safeNumber(reelDrive.torque_empty);
    }
    if (reelDrive.hp_reqd_empty !== undefined) {
      result.reel.torque.empty.horsepowerRequired = safeNumber(reelDrive.hp_reqd_empty);
    }
    if (reelDrive.regen_empty !== undefined) {
      result.reel.torque.empty.regen = String(reelDrive.regen_empty);
    }
    if (reelDrive.torque_full !== undefined) {
      result.reel.torque.full.torque = safeNumber(reelDrive.torque_full);
    }
    if (reelDrive.hp_reqd_full !== undefined) {
      result.reel.torque.full.horsepowerRequired = safeNumber(reelDrive.hp_reqd_full);
    }
    if (reelDrive.regen_full !== undefined) {
      result.reel.torque.full.regen = String(reelDrive.regen_full);
    }
    
    // Motorization
    if (reelDrive.drive_horsepower !== undefined) {
      result.reel.motorization.driveHorsepower = safeNumber(reelDrive.drive_horsepower);
    }
    if (reelDrive.speed !== undefined) {
      result.reel.motorization.speed = safeNumber(reelDrive.speed);
    }
    if (reelDrive.accel_rate !== undefined) {
      result.reel.motorization.accelRate = safeNumber(reelDrive.accel_rate);
    }
    if (reelDrive.regen_reqd !== undefined) {
      result.reel.motorization.regenRequired = String(reelDrive.regen_reqd);
    }
    
    // Web tension
    if (reelDrive.web_tension_psi !== undefined) {
      result.reel.webTension.psi = safeNumber(reelDrive.web_tension_psi);
    }
    if (reelDrive.web_tension_lbs !== undefined) {
      result.reel.webTension.lbs = safeNumber(reelDrive.web_tension_lbs);
    }
    
    // Other reel calculations
    if (reelDrive.brake_pad_diameter !== undefined) {
      result.reel.brakePadDiameter = safeNumber(reelDrive.brake_pad_diameter);
    }
    if (reelDrive.cylinder_bore !== undefined) {
      result.reel.cylinderBore = safeNumber(reelDrive.cylinder_bore);
    }
    if (reelDrive.coefficient_friction !== undefined) {
      result.reel.coefficientOfFriction = safeNumber(reelDrive.coefficient_friction);
    }
    if (reelDrive.min_material_width !== undefined) {
      result.reel.minMaterialWidth = safeNumber(reelDrive.min_material_width);
    }
    if (reelDrive.acceleration !== undefined) {
      result.reel.acceleration = safeNumber(reelDrive.acceleration);
    }
    if (reelDrive.speed !== undefined) {
      result.reel.speed = safeNumber(reelDrive.speed);
    }
    if (reelDrive.accel_time !== undefined) {
      result.reel.accelerationTime = safeNumber(reelDrive.accel_time);
    }
    if (reelDrive.coil_weight !== undefined) {
      result.reel.coilWeight = safeNumber(reelDrive.coil_weight);
    }
    if (reelDrive.coil_od !== undefined) {
      result.reel.coilOD = safeNumber(reelDrive.coil_od);
    }
    if (reelDrive.disp_reel_mtr !== undefined) {
      result.reel.dispReelMtr = String(reelDrive.disp_reel_mtr);
    }
    if (reelDrive.reel_drive_ok !== undefined) {
      result.reel.reelDriveOK = String(reelDrive.reel_drive_ok);
    }
  }

  // Map Straightener Utility calculation results
  if (calculationResults.str_utility) {
    const strUtility = calculationResults.str_utility;
    
    if (!result.straightener) result.straightener = {};
    if (!result.straightener.rolls) result.straightener.rolls = {};
    if (!result.straightener.rolls.depth) result.straightener.rolls.depth = {};
    if (!result.straightener.rolls.straightener) result.straightener.rolls.straightener = {};
    if (!result.straightener.rolls.pinch) result.straightener.rolls.pinch = {};
    if (!result.straightener.torque) result.straightener.torque = {};
    if (!result.straightener.required) result.straightener.required = {};
    if (!result.straightener.gear) result.straightener.gear = {};
    if (!result.straightener.gear.straightenerRoll) result.straightener.gear.straightenerRoll = {};
    if (!result.straightener.gear.pinchRoll) result.straightener.gear.pinchRoll = {};
    
    // Roll depth calculations
    if (strUtility.depth_without_material !== undefined) {
      result.straightener.rolls.depth.withoutMaterial = safeNumber(strUtility.depth_without_material);
    }
    if (strUtility.depth_with_material !== undefined) {
      result.straightener.rolls.depth.withMaterial = safeNumber(strUtility.depth_with_material);
    }
    
    // Straightener roll calculations
    if (strUtility.straightener_diameter !== undefined) {
      result.straightener.rolls.straightener.diameter = safeNumber(strUtility.straightener_diameter);
    }
    if (strUtility.straightener_req_gear_torque !== undefined) {
      result.straightener.rolls.straightener.requiredGearTorque = safeNumber(strUtility.straightener_req_gear_torque);
    }
    if (strUtility.straightener_rated_torque !== undefined) {
      result.straightener.rolls.straightener.ratedTorque = safeNumber(strUtility.straightener_rated_torque);
    }
    if (strUtility.straightener_check !== undefined) {
      result.straightener.rolls.straightener.check = String(strUtility.straightener_check);
    }
    
    // Pinch roll calculations
    if (strUtility.pinch_diameter !== undefined) {
      result.straightener.rolls.pinch.diameter = safeNumber(strUtility.pinch_diameter);
    }
    if (strUtility.pinch_req_gear_torque !== undefined) {
      result.straightener.rolls.pinch.requiredGearTorque = safeNumber(strUtility.pinch_req_gear_torque);
    }
    if (strUtility.pinch_rated_torque !== undefined) {
      result.straightener.rolls.pinch.ratedTorque = safeNumber(strUtility.pinch_rated_torque);
    }
    if (strUtility.pinch_check !== undefined) {
      result.straightener.rolls.pinch.check = String(strUtility.pinch_check);
    }
    
    // Other straightener calculations
    if (strUtility.roll_diameter !== undefined) {
      result.straightener.rollDiameter = safeNumber(strUtility.roll_diameter);
    }
    if (strUtility.center_distance !== undefined) {
      result.straightener.centerDistance = safeNumber(strUtility.center_distance);
    }
    if (strUtility.jack_force_available !== undefined) {
      result.straightener.jackForceAvailable = safeNumber(strUtility.jack_force_available);
    }
    if (strUtility.modulus !== undefined) {
      result.straightener.modulus = safeNumber(strUtility.modulus);
    }
    if (strUtility.actual_coil_weight !== undefined) {
      result.straightener.actualCoilWeight = safeNumber(strUtility.actual_coil_weight);
    }
    if (strUtility.coil_od !== undefined) {
      result.straightener.coilOD = safeNumber(strUtility.coil_od);
    }
    if (strUtility.check !== undefined) {
      result.straightener.check = safeNumber(strUtility.check);
    }
    
    // Torque calculations
    if (strUtility.torque_straightener !== undefined) {
      result.straightener.torque.straightener = safeNumber(strUtility.torque_straightener);
    }
    if (strUtility.torque_acceleration !== undefined) {
      result.straightener.torque.acceleration = safeNumber(strUtility.torque_acceleration);
    }
    if (strUtility.torque_brake !== undefined) {
      result.straightener.torque.brake = safeNumber(strUtility.torque_brake);
    }
    
    // Required calculations
    if (strUtility.hp_required !== undefined) {
      result.straightener.required.horsepower = safeNumber(strUtility.hp_required);
    }
    if (strUtility.hp_check !== undefined) {
      result.straightener.required.horsepowerCheck = String(strUtility.hp_check);
    }
    if (strUtility.force_required !== undefined) {
      result.straightener.required.force = safeNumber(strUtility.force_required);
    }
    if (strUtility.rated_force !== undefined) {
      result.straightener.required.ratedForce = safeNumber(strUtility.rated_force);
    }
    if (strUtility.jack_force_check !== undefined) {
      result.straightener.required.jackForceCheck = String(strUtility.jack_force_check);
    }
    if (strUtility.backup_rolls_check !== undefined) {
      result.straightener.required.backupRollsCheck = String(strUtility.backup_rolls_check);
    }
    
    // Gear calculations
    if (strUtility.face_width !== undefined) {
      result.straightener.gear.faceWidth = safeNumber(strUtility.face_width);
    }
    if (strUtility.cont_angle !== undefined) {
      result.straightener.gear.contAngle = safeNumber(strUtility.cont_angle);
    }
    if (strUtility.str_roll_num_teeth !== undefined) {
      result.straightener.gear.straightenerRoll.numberOfTeeth = safeNumber(strUtility.str_roll_num_teeth);
    }
    if (strUtility.str_roll_dp !== undefined) {
      result.straightener.gear.straightenerRoll.dp = safeNumber(strUtility.str_roll_dp);
    }
    if (strUtility.pinch_roll_num_teeth !== undefined) {
      result.straightener.gear.pinchRoll.numberOfTeeth = safeNumber(strUtility.pinch_roll_num_teeth);
    }
    if (strUtility.pinch_roll_dp !== undefined) {
      result.straightener.gear.pinchRoll.dp = safeNumber(strUtility.pinch_roll_dp);
    }
  }

  // Map Roll Straightener Backbend calculation results
  if (calculationResults.roll_str_backbend) {
    const rollStrBackbend = calculationResults.roll_str_backbend;
    
    if (!result.straightener) result.straightener = {};
    if (!result.straightener.rolls) result.straightener.rolls = {};
    if (!result.straightener.rolls.backbend) result.straightener.rolls.backbend = {};
    if (!result.straightener.rolls.backbend.rollers) result.straightener.rolls.backbend.rollers = {};
    if (!result.straightener.rolls.backbend.radius) result.straightener.rolls.backbend.radius = {};
    
    // Backbend calculations
    if (rollStrBackbend.depth_required !== undefined) {
      result.straightener.rolls.backbend.rollers.depthRequired = safeNumber(rollStrBackbend.depth_required);
    }
    if (rollStrBackbend.force_required !== undefined) {
      result.straightener.rolls.backbend.rollers.forceRequired = safeNumber(rollStrBackbend.force_required);
    }
    if (rollStrBackbend.yield_met !== undefined) {
      result.straightener.rolls.backbend.yieldMet = String(rollStrBackbend.yield_met);
    }
    if (rollStrBackbend.radius_coming_off_coil !== undefined) {
      result.straightener.rolls.backbend.radius.comingOffCoil = safeNumber(rollStrBackbend.radius_coming_off_coil);
    }
    if (rollStrBackbend.radius_off_coil_after_springback !== undefined) {
      result.straightener.rolls.backbend.radius.offCoilAfterSpringback = safeNumber(rollStrBackbend.radius_off_coil_after_springback);
    }
    if (rollStrBackbend.radius_required_to_yield_skin !== undefined) {
      result.straightener.rolls.backbend.radius.requiredToYieldSkinOfFlatMaterial = safeNumber(rollStrBackbend.radius_required_to_yield_skin);
    }
    if (rollStrBackbend.bending_moment_to_yield_skin !== undefined) {
      result.straightener.rolls.backbend.bendingMomentToYieldSkin = safeNumber(rollStrBackbend.bending_moment_to_yield_skin);
    }
    
    // Roll details mapping
    const mapRollDetail = (source: any, target: any) => {
      if (source.height !== undefined) target.height = safeNumber(source.height);
      if (source.force_required !== undefined) target.forceRequired = safeNumber(source.force_required);
      if (source.number_of_yield_strains !== undefined) target.numberOfYieldStrainsAtSurface = safeNumber(source.number_of_yield_strains);
      
      if (source.up) {
        if (!target.up) target.up = {};
        if (source.up.resulting_radius !== undefined) target.up.resultingRadius = safeNumber(source.up.resulting_radius);
        if (source.up.curvature_difference !== undefined) target.up.curvatureDifference = safeNumber(source.up.curvature_difference);
        if (source.up.bending_moment !== undefined) target.up.bendingMoment = safeNumber(source.up.bending_moment);
        if (source.up.bending_moment_ratio !== undefined) target.up.bendingMomentRatio = safeNumber(source.up.bending_moment_ratio);
        if (source.up.springback !== undefined) target.up.springback = safeNumber(source.up.springback);
        if (source.up.percent_thickness_yielded !== undefined) target.up.percentOfThicknessYielded = safeNumber(source.up.percent_thickness_yielded);
        if (source.up.radius_after_springback !== undefined) target.up.radiusAfterSpringback = safeNumber(source.up.radius_after_springback);
      }
      
      if (source.down) {
        if (!target.down) target.down = {};
        if (source.down.resulting_radius !== undefined) target.down.resultingRadius = safeNumber(source.down.resulting_radius);
        if (source.down.curvature_difference !== undefined) target.down.curvatureDifference = safeNumber(source.down.curvature_difference);
        if (source.down.bending_moment !== undefined) target.down.bendingMoment = safeNumber(source.down.bending_moment);
        if (source.down.bending_moment_ratio !== undefined) target.down.bendingMomentRatio = safeNumber(source.down.bending_moment_ratio);
        if (source.down.springback !== undefined) target.down.springback = safeNumber(source.down.springback);
        if (source.down.percent_thickness_yielded !== undefined) target.down.percentOfThicknessYielded = safeNumber(source.down.percent_thickness_yielded);
        if (source.down.radius_after_springback !== undefined) target.down.radiusAfterSpringback = safeNumber(source.down.radius_after_springback);
      }
    };
    
    if (rollStrBackbend.first_roll) {
      if (!result.straightener.rolls.backbend.rollers.first) result.straightener.rolls.backbend.rollers.first = {};
      mapRollDetail(rollStrBackbend.first_roll, result.straightener.rolls.backbend.rollers.first);
    }
    
    if (rollStrBackbend.middle_roll) {
      if (!result.straightener.rolls.backbend.rollers.middle) result.straightener.rolls.backbend.rollers.middle = {};
      mapRollDetail(rollStrBackbend.middle_roll, result.straightener.rolls.backbend.rollers.middle);
    }
    
    if (rollStrBackbend.last_roll) {
      if (!result.straightener.rolls.backbend.rollers.last) result.straightener.rolls.backbend.rollers.last = {};
      mapRollDetail(rollStrBackbend.last_roll, result.straightener.rolls.backbend.rollers.last);
    }
  }

  // Map Feed calculation results
  if (calculationResults.feed) {
    const feedCalc = calculationResults.feed;
    
    if (!result.feed) result.feed = {};
    if (!result.feed.torque) result.feed.torque = {};
    if (!result.feed.torque.rms) result.feed.torque.rms = {};
    if (!result.feed.pullThru) result.feed.pullThru = {};
    
    // Feed torque calculations
    if (feedCalc.motor_peak_torque !== undefined) {
      result.feed.torque.motorPeak = safeNumber(feedCalc.motor_peak_torque);
    }
    if (feedCalc.peak_torque !== undefined) {
      result.feed.torque.peak = safeNumber(feedCalc.peak_torque);
    }
    if (feedCalc.frictional_torque !== undefined) {
      result.feed.torque.frictional = safeNumber(feedCalc.frictional_torque);
    }
    if (feedCalc.loop_torque !== undefined) {
      result.feed.torque.loop = safeNumber(feedCalc.loop_torque);
    }
    if (feedCalc.settle_torque !== undefined) {
      result.feed.torque.settle = safeNumber(feedCalc.settle_torque);
    }
    if (feedCalc.rms_motor_torque !== undefined) {
      result.feed.torque.rms.motor = safeNumber(feedCalc.rms_motor_torque);
    }
    if (feedCalc.rms_feed_angle1_torque !== undefined) {
      result.feed.torque.rms.feedAngle1 = safeNumber(feedCalc.rms_feed_angle1_torque);
    }
    if (feedCalc.rms_feed_angle2_torque !== undefined) {
      result.feed.torque.rms.feedAngle2 = safeNumber(feedCalc.rms_feed_angle2_torque);
    }
    if (feedCalc.acceleration_torque !== undefined) {
      result.feed.torque.acceleration = safeNumber(feedCalc.acceleration_torque);
    }
    
    // Feed pull-through calculations
    if (feedCalc.k_constant !== undefined) {
      result.feed.pullThru.kConst = safeNumber(feedCalc.k_constant);
    }
    if (feedCalc.straightener_torque !== undefined) {
      result.feed.pullThru.straightenerTorque = safeNumber(feedCalc.straightener_torque);
    }
    
    // Other feed calculations
    if (feedCalc.motor !== undefined) {
      result.feed.motor = String(feedCalc.motor);
    }
    if (feedCalc.amp !== undefined) {
      result.feed.amp = String(feedCalc.amp);
    }
    if (feedCalc.default_acceleration !== undefined) {
      result.feed.defaultAcceleration = safeNumber(feedCalc.default_acceleration);
    }
    if (feedCalc.chart_min_length !== undefined) {
      result.feed.chartMinLength = safeNumber(feedCalc.chart_min_length);
    }
    if (feedCalc.length_increment !== undefined) {
      result.feed.lengthIncrement = safeNumber(feedCalc.length_increment);
    }
    if (feedCalc.maximum_velocity !== undefined) {
      result.feed.maximumVelocity = safeNumber(feedCalc.maximum_velocity);
    }
    if (feedCalc.acceleration !== undefined) {
      result.feed.acceleration = safeNumber(feedCalc.acceleration);
    }
    if (feedCalc.ratio !== undefined) {
      result.feed.ratio = String(feedCalc.ratio);
    }
    if (feedCalc.match !== undefined) {
      result.feed.match = safeNumber(feedCalc.match);
    }
    if (feedCalc.refl_inertia !== undefined) {
      result.feed.reflInertia = safeNumber(feedCalc.refl_inertia);
    }
    if (feedCalc.regen !== undefined) {
      result.feed.regen = safeNumber(feedCalc.regen);
    }
    
    // Table data mapping
    if (feedCalc.table_data && typeof feedCalc.table_data === 'object') {
      result.feed.tableData = feedCalc.table_data;
    }
  }

  // Map Shear calculation results
  if (calculationResults.shear) {
    const shearCalc = calculationResults.shear;
    
    if (!result.shear) result.shear = {};
    if (!result.shear.blade) result.shear.blade = {};
    if (!result.shear.blade.initialCut) result.shear.blade.initialCut = {};
    if (!result.shear.cylinder) result.shear.cylinder = {};
    if (!result.shear.cylinder.minStroke) result.shear.cylinder.minStroke = {};
    if (!result.shear.hydraulic) result.shear.hydraulic = {};
    if (!result.shear.hydraulic.cylinder) result.shear.hydraulic.cylinder = {};
    if (!result.shear.time) result.shear.time = {};
    if (!result.shear.conclusions) result.shear.conclusions = {};
    if (!result.shear.conclusions.force) result.shear.conclusions.force = {};
    if (!result.shear.conclusions.force.totalApplied) result.shear.conclusions.force.totalApplied = {};
    if (!result.shear.conclusions.perMinute) result.shear.conclusions.perMinute = {};
    if (!result.shear.conclusions.perMinute.gallons) result.shear.conclusions.perMinute.gallons = {};
    
    // Blade calculations
    if (shearCalc.angle_of_blade !== undefined) {
      result.shear.blade.angleOfBlade = safeNumber(shearCalc.angle_of_blade);
    }
    if (shearCalc.initial_cut_length !== undefined) {
      result.shear.blade.initialCut.length = safeNumber(shearCalc.initial_cut_length);
    }
    if (shearCalc.initial_cut_area !== undefined) {
      result.shear.blade.initialCut.area = safeNumber(shearCalc.initial_cut_area);
    }
    
    // Cylinder calculations
    if (shearCalc.min_stroke_for_blade !== undefined) {
      result.shear.cylinder.minStroke.forBlade = safeNumber(shearCalc.min_stroke_for_blade);
    }
    if (shearCalc.min_stroke_required_for_opening !== undefined) {
      result.shear.cylinder.minStroke.requiredForOpening = safeNumber(shearCalc.min_stroke_required_for_opening);
    }
    if (shearCalc.actual_opening_above_max_material !== undefined) {
      result.shear.cylinder.actualOpeningAboveMaxMaterial = safeNumber(shearCalc.actual_opening_above_max_material);
    }
    
    // Hydraulic calculations
    if (shearCalc.cylinder_area !== undefined) {
      result.shear.hydraulic.cylinder.area = safeNumber(shearCalc.cylinder_area);
    }
    if (shearCalc.cylinder_volume !== undefined) {
      result.shear.hydraulic.cylinder.volume = safeNumber(shearCalc.cylinder_volume);
    }
    if (shearCalc.fluid_velocity !== undefined) {
      result.shear.hydraulic.fluidVelocity = safeNumber(shearCalc.fluid_velocity);
    }
    
    // Time calculations
    if (shearCalc.time_for_downward_stroke !== undefined) {
      result.shear.time.forDownwardStroke = safeNumber(shearCalc.time_for_downward_stroke);
    }
    if (shearCalc.dwell_time !== undefined) {
      result.shear.time.dwellTime = safeNumber(shearCalc.dwell_time);
    }
    
    // Conclusions calculations
    if (shearCalc.force_per_cylinder !== undefined) {
      result.shear.conclusions.force.perCylinder = safeNumber(shearCalc.force_per_cylinder);
    }
    if (shearCalc.total_applied_force_lbs !== undefined) {
      result.shear.conclusions.force.totalApplied.lbs = safeNumber(shearCalc.total_applied_force_lbs);
    }
    if (shearCalc.total_applied_force_tons !== undefined) {
      result.shear.conclusions.force.totalApplied.tons = safeNumber(shearCalc.total_applied_force_tons);
    }
    if (shearCalc.force_required_to_shear !== undefined) {
      result.shear.conclusions.force.requiredToShear = safeNumber(shearCalc.force_required_to_shear);
    }
    if (shearCalc.safety_factor !== undefined) {
      result.shear.conclusions.safetyFactor = safeNumber(shearCalc.safety_factor);
    }
    if (shearCalc.gallons_per_minute_instantaneous !== undefined) {
      result.shear.conclusions.perMinute.gallons.instantaneous = safeNumber(shearCalc.gallons_per_minute_instantaneous);
    }
    if (shearCalc.gallons_per_minute_averaged !== undefined) {
      result.shear.conclusions.perMinute.gallons.averaged = safeNumber(shearCalc.gallons_per_minute_averaged);
    }
    if (shearCalc.shear_strokes_per_minute !== undefined) {
      result.shear.conclusions.perMinute.shearStrokes = safeNumber(shearCalc.shear_strokes_per_minute);
    }
    if (shearCalc.parts_per_minute !== undefined) {
      result.shear.conclusions.perMinute.parts = safeNumber(shearCalc.parts_per_minute);
    }
  }

  return result;
}

// Function to map PerformanceData to backend format
export function mapPerformanceDataToBackend(performanceData: PerformanceData): any {
  const safeNumber = (value: any) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  const safeString = (value: any) => {
    if (value === undefined || value === null) return null;
    return String(value);
  };

  const safeBool = (value: any) => {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  };

  const result: any = {};

  // Direct field mappings
  if (performanceData.referenceNumber) {
    result.reference_number = safeString(performanceData.referenceNumber);
  }
  if (performanceData.customer) {
    result.customer = safeString(performanceData.customer);
  }

  // Customer Info
  if (performanceData.customerInfo) {
    result.customer_info = {};
    const customerInfo = performanceData.customerInfo;
    if (customerInfo.streetAddress) result.customer_info.street_address = safeString(customerInfo.streetAddress);
    if (customerInfo.city) result.customer_info.city = safeString(customerInfo.city);
    if (customerInfo.state) result.customer_info.state = safeString(customerInfo.state);
    if (customerInfo.zip) result.customer_info.zip = safeNumber(customerInfo.zip);
    if (customerInfo.country) result.customer_info.country = safeString(customerInfo.country);
    if (customerInfo.contactName) result.customer_info.contact_name = safeString(customerInfo.contactName);
    if (customerInfo.position) result.customer_info.position = safeString(customerInfo.position);
    if (customerInfo.phoneNumber) result.customer_info.phone_number = safeString(customerInfo.phoneNumber);
    if (customerInfo.email) result.customer_info.email = safeString(customerInfo.email);
    if (customerInfo.dealerName) result.customer_info.dealer_name = safeString(customerInfo.dealerName);
    if (customerInfo.dealerSalesman) result.customer_info.dealer_salesman = safeString(customerInfo.dealerSalesman);
    if (customerInfo.daysPerWeek) result.customer_info.days_per_week = safeNumber(customerInfo.daysPerWeek);
    if (customerInfo.shiftsPerDay) result.customer_info.shifts_per_day = safeNumber(customerInfo.shiftsPerDay);
  }

  // Dates
  if (performanceData.dates) {
    result.dates = {};
    const dates = performanceData.dates;
    if (dates.date) result.dates.date = safeString(dates.date);
    if (dates.decisionDate) result.dates.decision_date = safeString(dates.decisionDate);
    if (dates.idealDeliveryDate) result.dates.ideal_delivery_date = safeString(dates.idealDeliveryDate);
    if (dates.earliestDeliveryDate) result.dates.earliest_delivery_date = safeString(dates.earliestDeliveryDate);
    if (dates.latestDeliveryDate) result.dates.latest_delivery_date = safeString(dates.latestDeliveryDate);
  }

  // Coil
  if (performanceData.coil) {
    result.coil = {};
    const coil = performanceData.coil;
    if (coil.density) result.coil.density = safeNumber(coil.density);
    if (coil.weight) result.coil.weight = safeNumber(coil.weight);
    if (coil.maxCoilWidth) result.coil.max_coil_width = safeNumber(coil.maxCoilWidth);
    if (coil.minCoilWidth) result.coil.min_coil_width = safeNumber(coil.minCoilWidth);
    if (coil.maxCoilOD) result.coil.max_coil_od = safeNumber(coil.maxCoilOD);
    if (coil.coilID) result.coil.coil_id = safeNumber(coil.coilID);
    if (coil.maxCoilWeight) result.coil.max_coil_weight = safeNumber(coil.maxCoilWeight);
    if (coil.maxCoilHandlingCap) result.coil.max_coil_handling_cap = safeNumber(coil.maxCoilHandlingCap);
    if (coil.slitEdge) result.coil.slit_edge = safeString(coil.slitEdge);
    if (coil.millEdge) result.coil.mill_edge = safeString(coil.millEdge);
    if (coil.requireCoilCar) result.coil.require_coil_car = safeString(coil.requireCoilCar);
    if (coil.runningOffBackplate) result.coil.running_off_backplate = safeString(coil.runningOffBackplate);
    if (coil.requireRewinding) result.coil.require_rewinding = safeString(coil.requireRewinding);
    if (coil.changeTimeConcern) result.coil.change_time_concern = safeString(coil.changeTimeConcern);
    if (coil.timeChangeGoal) result.coil.time_change_goal = safeNumber(coil.timeChangeGoal);
    if (coil.loading) result.coil.loading = safeString(coil.loading);
    if (coil.inertia) result.coil.inertia = safeNumber(coil.inertia);
    if (coil.reflInertia) result.coil.refl_inertia = safeNumber(coil.reflInertia);
  }

  // Material
  if (performanceData.material) {
    result.material = {};
    const material = performanceData.material;
    if (material.materialThickness) result.material.material_thickness = safeNumber(material.materialThickness);
    if (material.materialDensity) result.material.material_density = safeNumber(material.materialDensity);
    if (material.coilWidth) result.material.coil_width = safeNumber(material.coilWidth);
    if (material.materialType) result.material.material_type = safeString(material.materialType);
    if (material.maxYieldStrength) result.material.max_yield_strength = safeNumber(material.maxYieldStrength);
    if (material.maxTensileStrength) result.material.max_tensile_strength = safeNumber(material.maxTensileStrength);
    if (material.minBendRadius) result.material.min_bend_radius = safeNumber(material.minBendRadius);
    if (material.minLoopLength) result.material.min_loop_length = safeNumber(material.minLoopLength);
    if (material.calculatedCoilOD) result.material.calculated_coil_od = safeNumber(material.calculatedCoilOD);
  }

  // Simple fields
  if (performanceData.runningCosmeticMaterial) {
    result.running_cosmetic_material = safeString(performanceData.runningCosmeticMaterial);
  }
  if (performanceData.brandOfFeed) {
    result.brand_of_feed = safeString(performanceData.brandOfFeed);
  }

  // Press
  if (performanceData.press) {
    result.press = {};
    const press = performanceData.press;
    if (press.gapFramePress) result.press.gap_frame_press = safeString(press.gapFramePress);
    if (press.hydraulicPress) result.press.hydraulic_press = safeString(press.hydraulicPress);
    if (press.obi) result.press.obi = safeString(press.obi);
    if (press.servoPress) result.press.servo_press = safeString(press.servoPress);
    if (press.shearDieApplication) result.press.shear_die_application = safeString(press.shearDieApplication);
    if (press.straightSidePress) result.press.straight_side_press = safeString(press.straightSidePress);
    if (press.other) result.press.other = safeString(press.other);
    if (press.tonnageOfPress) result.press.tonnage_of_press = safeNumber(press.tonnageOfPress);
    if (press.strokeLength) result.press.stroke_length = safeNumber(press.strokeLength);
    if (press.maxSPM) result.press.max_spm = safeNumber(press.maxSPM);
    if (press.bedWidth) result.press.bed_width = safeNumber(press.bedWidth);
    if (press.bedLength) result.press.bed_length = safeNumber(press.bedLength);
    if (press.windowSize) result.press.window_size = safeNumber(press.windowSize);
    if (press.cycleTime) result.press.cycle_time = safeNumber(press.cycleTime);
  }

  // Dies
  if (performanceData.dies) {
    result.dies = {};
    const dies = performanceData.dies;
    if (dies.transferDies) result.dies.transfer_dies = safeString(dies.transferDies);
    if (dies.progressiveDies) result.dies.progressive_dies = safeString(dies.progressiveDies);
    if (dies.blankingDies) result.dies.blanking_dies = safeString(dies.blankingDies);
  }

  // Feed
  if (performanceData.feed) {
    result.feed = {};
    const feed = performanceData.feed;
    
    if (feed.application) result.feed.application = safeString(feed.application);
    if (feed.model) result.feed.model = safeString(feed.model);
    if (feed.machineWidth) result.feed.machine_width = safeNumber(feed.machineWidth);
    if (feed.loopPit) result.feed.loop_pit = safeString(feed.loopPit);
    if (feed.fullWidthRolls) result.feed.full_width_rolls = safeString(feed.fullWidthRolls);
    if (feed.motor) result.feed.motor = safeString(feed.motor);
    if (feed.amp) result.feed.amp = safeString(feed.amp);
    if (feed.frictionInDie) result.feed.friction_in_die = safeNumber(feed.frictionInDie);
    if (feed.accelerationRate) result.feed.acceleration_rate = safeNumber(feed.accelerationRate);
    if (feed.defaultAcceleration) result.feed.default_acceleration = safeNumber(feed.defaultAcceleration);
    if (feed.chartMinLength) result.feed.chart_min_length = safeNumber(feed.chartMinLength);
    if (feed.lengthIncrement) result.feed.length_increment = safeNumber(feed.lengthIncrement);
    if (feed.feedAngle1) result.feed.feed_angle1 = safeNumber(feed.feedAngle1);
    if (feed.feedAngle2) result.feed.feed_angle2 = safeNumber(feed.feedAngle2);
    if (feed.maximumVelocity) result.feed.maximum_velocity = safeNumber(feed.maximumVelocity);
    if (feed.acceleration) result.feed.acceleration = safeNumber(feed.acceleration);
    if (feed.ratio) result.feed.ratio = safeString(feed.ratio);
    if (feed.typeOfLine) result.feed.type_of_line = safeString(feed.typeOfLine);
    if (feed.match) result.feed.match = safeNumber(feed.match);
    if (feed.reflInertia) result.feed.refl_inertia = safeNumber(feed.reflInertia);
    if (feed.regen) result.feed.regen = safeNumber(feed.regen);
    if (feed.tableData) result.feed.table_data = feed.tableData;
    if (feed.windowDegrees) result.feed.window_degrees = safeString(feed.windowDegrees);
    if (feed.direction) result.feed.direction = safeString(feed.direction);
    if (feed.controls) result.feed.controls = safeString(feed.controls);
    if (feed.controlsLevel) result.feed.controls_level = safeString(feed.controlsLevel);
    if (feed.passline) result.feed.passline = safeNumber(feed.passline);
    if (feed.lightGuageNonMarking) result.feed.light_guage_non_marking = safeString(feed.lightGuageNonMarking);
    if (feed.nonMarking) result.feed.non_marking = safeString(feed.nonMarking);

    // Feed torque
    if (feed.torque) {
      result.feed.torque = {};
      const torque = feed.torque;
      if (torque.motorPeak) result.feed.torque.motor_peak = safeNumber(torque.motorPeak);
      if (torque.peak) result.feed.torque.peak = safeNumber(torque.peak);
      if (torque.frictional) result.feed.torque.frictional = safeNumber(torque.frictional);
      if (torque.loop) result.feed.torque.loop = safeNumber(torque.loop);
      if (torque.settle) result.feed.torque.settle = safeNumber(torque.settle);
      if (torque.acceleration) result.feed.torque.acceleration = safeNumber(torque.acceleration);

      if (torque.rms) {
        result.feed.torque.rms = {};
        const rms = torque.rms;
        if (rms.motor) result.feed.torque.rms.motor = safeNumber(rms.motor);
        if (rms.feedAngle1) result.feed.torque.rms.feed_angle1 = safeNumber(rms.feedAngle1);
        if (rms.feedAngle2) result.feed.torque.rms.feed_angle2 = safeNumber(rms.feedAngle2);
      }
    }

    // Feed pull through
    if (feed.pullThru) {
      result.feed.pull_thru = {};
      const pullThru = feed.pullThru;
      if (pullThru.isPullThru) result.feed.pull_thru.is_pull_thru = safeString(pullThru.isPullThru);
      if (pullThru.straightenerRolls) result.feed.pull_thru.straightener_rolls = safeNumber(pullThru.straightenerRolls);
      if (pullThru.pinchRolls) result.feed.pull_thru.pinch_rolls = safeString(pullThru.pinchRolls);
      if (pullThru.kConst) result.feed.pull_thru.k_const = safeNumber(pullThru.kConst);
      if (pullThru.straightenerTorque) result.feed.pull_thru.straightener_torque = safeNumber(pullThru.straightenerTorque);
    }

    // Feed performance data
    if (feed.average) {
      result.feed.average = {};
      const average = feed.average;
      if (average.length) result.feed.average.length = safeNumber(average.length);
      if (average.spm) result.feed.average.spm = safeNumber(average.spm);
      if (average.fpm) result.feed.average.fpm = safeNumber(average.fpm);
    }

    if (feed.max) {
      result.feed.max = {};
      const max = feed.max;
      if (max.length) result.feed.max.length = safeNumber(max.length);
      if (max.spm) result.feed.max.spm = safeNumber(max.spm);
      if (max.fpm) result.feed.max.fpm = safeNumber(max.fpm);
    }

    if (feed.min) {
      result.feed.min = {};
      const min = feed.min;
      if (min.length) result.feed.min.length = safeNumber(min.length);
      if (min.spm) result.feed.min.spm = safeNumber(min.spm);
      if (min.fpm) result.feed.min.fpm = safeNumber(min.fpm);
    }
  }

  // Straightener
  if (performanceData.straightener) {
    result.straightener = {};
    const straightener = performanceData.straightener;
    if (straightener.model) result.straightener.model = safeString(straightener.model);
    if (straightener.payoff) result.straightener.payoff = safeString(straightener.payoff);
    if (straightener.width) result.straightener.width = safeNumber(straightener.width);
    if (straightener.feedRate) result.straightener.feed_rate = safeNumber(straightener.feedRate);
    if (straightener.acceleration) result.straightener.acceleration = safeNumber(straightener.acceleration);
    if (straightener.horsepower) result.straightener.horsepower = safeNumber(straightener.horsepower);
    if (straightener.autoBrakeCompensation) result.straightener.auto_brake_compensation = safeString(straightener.autoBrakeCompensation);
    if (straightener.rollDiameter) result.straightener.roll_diameter = safeNumber(straightener.rollDiameter);
    if (straightener.centerDistance) result.straightener.center_distance = safeNumber(straightener.centerDistance);
    if (straightener.jackForceAvailable) result.straightener.jack_force_available = safeNumber(straightener.jackForceAvailable);
    if (straightener.modulus) result.straightener.modulus = safeNumber(straightener.modulus);
    if (straightener.actualCoilWeight) result.straightener.actual_coil_weight = safeNumber(straightener.actualCoilWeight);
    if (straightener.coilOD) result.straightener.coil_od = safeNumber(straightener.coilOD);
    if (straightener.check) result.straightener.check = safeNumber(straightener.check);

    // Straightener rolls
    if (straightener.rolls) {
      result.straightener.rolls = {};
      const rolls = straightener.rolls;
      if (rolls.typeOfRoll) result.straightener.rolls.type_of_roll = safeString(rolls.typeOfRoll);
      if (rolls.straighteningRolls) result.straightener.rolls.straightening_rolls = safeNumber(rolls.straighteningRolls);
      if (rolls.numberOfRolls) result.straightener.rolls.number_of_rolls = safeNumber(rolls.numberOfRolls);
      if (rolls.backupRolls) result.straightener.rolls.backup_rolls = safeNumber(rolls.backupRolls);

      // Roll depth
      if (rolls.depth) {
        result.straightener.rolls.depth = {};
        const depth = rolls.depth;
        if (depth.withoutMaterial) result.straightener.rolls.depth.without_material = safeNumber(depth.withoutMaterial);
        if (depth.withMaterial) result.straightener.rolls.depth.with_material = safeNumber(depth.withMaterial);
      }

      // Straightener roll details
      if (rolls.straightener) {
        result.straightener.rolls.straightener = {};
        const str = rolls.straightener;
        if (str.diameter) result.straightener.rolls.straightener.diameter = safeNumber(str.diameter);
        if (str.requiredGearTorque) result.straightener.rolls.straightener.required_gear_torque = safeNumber(str.requiredGearTorque);
        if (str.ratedTorque) result.straightener.rolls.straightener.rated_torque = safeNumber(str.ratedTorque);
        if (str.check) result.straightener.rolls.straightener.check = safeString(str.check);
      }

      // Pinch roll details
      if (rolls.pinch) {
        result.straightener.rolls.pinch = {};
        const pinch = rolls.pinch;
        if (pinch.diameter) result.straightener.rolls.pinch.diameter = safeNumber(pinch.diameter);
        if (pinch.requiredGearTorque) result.straightener.rolls.pinch.required_gear_torque = safeNumber(pinch.requiredGearTorque);
        if (pinch.ratedTorque) result.straightener.rolls.pinch.rated_torque = safeNumber(pinch.ratedTorque);
        if (pinch.check) result.straightener.rolls.pinch.check = safeString(pinch.check);
      }

      // Backbend data
      if (rolls.backbend) {
        result.straightener.rolls.backbend = {};
        const backbend = rolls.backbend;
        if (backbend.hiddenValue) result.straightener.rolls.backbend.hidden_value = safeNumber(backbend.hiddenValue);
        if (backbend.yieldMet) result.straightener.rolls.backbend.yield_met = safeString(backbend.yieldMet);
        if (backbend.bendingMomentToYieldSkin) result.straightener.rolls.backbend.bending_moment_to_yield_skin = safeNumber(backbend.bendingMomentToYieldSkin);

        if (backbend.radius) {
          result.straightener.rolls.backbend.radius = {};
          const radius = backbend.radius;
          if (radius.comingOffCoil) result.straightener.rolls.backbend.radius.coming_off_coil = safeNumber(radius.comingOffCoil);
          if (radius.offCoilAfterSpringback) result.straightener.rolls.backbend.radius.off_coil_after_springback = safeNumber(radius.offCoilAfterSpringback);
          if (radius.requiredToYieldSkinOfFlatMaterial) result.straightener.rolls.backbend.radius.required_to_yield_skin_of_flat_material = safeNumber(radius.requiredToYieldSkinOfFlatMaterial);
        }

        if (backbend.rollers) {
          result.straightener.rolls.backbend.rollers = {};
          const rollers = backbend.rollers;
          if (rollers.depthRequired) result.straightener.rolls.backbend.rollers.depth_required = safeNumber(rollers.depthRequired);
          if (rollers.forceRequired) result.straightener.rolls.backbend.rollers.force_required = safeNumber(rollers.forceRequired);

          // First roll
          if (rollers.first) {
            result.straightener.rolls.backbend.rollers.first = {};
            const first = rollers.first;
            if (first.height) result.straightener.rolls.backbend.rollers.first.height = safeNumber(first.height);
            if (first.forceRequired) result.straightener.rolls.backbend.rollers.first.force_required = safeNumber(first.forceRequired);
            if (first.numberOfYieldStrainsAtSurface) result.straightener.rolls.backbend.rollers.first.number_of_yield_strains_at_surface = safeNumber(first.numberOfYieldStrainsAtSurface);

            if (first.up) {
              result.straightener.rolls.backbend.rollers.first.up = {};
              const up = first.up;
              if (up.resultingRadius) result.straightener.rolls.backbend.rollers.first.up.resulting_radius = safeNumber(up.resultingRadius);
              if (up.curvatureDifference) result.straightener.rolls.backbend.rollers.first.up.curvature_difference = safeNumber(up.curvatureDifference);
              if (up.bendingMoment) result.straightener.rolls.backbend.rollers.first.up.bending_moment = safeNumber(up.bendingMoment);
              if (up.bendingMomentRatio) result.straightener.rolls.backbend.rollers.first.up.bending_moment_ratio = safeNumber(up.bendingMomentRatio);
              if (up.springback) result.straightener.rolls.backbend.rollers.first.up.springback = safeNumber(up.springback);
              if (up.percentOfThicknessYielded) result.straightener.rolls.backbend.rollers.first.up.percent_of_thickness_yielded = safeNumber(up.percentOfThicknessYielded);
              if (up.radiusAfterSpringback) result.straightener.rolls.backbend.rollers.first.up.radius_after_springback = safeNumber(up.radiusAfterSpringback);
            }

            if (first.down) {
              result.straightener.rolls.backbend.rollers.first.down = {};
              const down = first.down;
              if (down.resultingRadius) result.straightener.rolls.backbend.rollers.first.down.resulting_radius = safeNumber(down.resultingRadius);
              if (down.curvatureDifference) result.straightener.rolls.backbend.rollers.first.down.curvature_difference = safeNumber(down.curvatureDifference);
              if (down.bendingMoment) result.straightener.rolls.backbend.rollers.first.down.bending_moment = safeNumber(down.bendingMoment);
              if (down.bendingMomentRatio) result.straightener.rolls.backbend.rollers.first.down.bending_moment_ratio = safeNumber(down.bendingMomentRatio);
              if (down.springback) result.straightener.rolls.backbend.rollers.first.down.springback = safeNumber(down.springback);
              if (down.percentOfThicknessYielded) result.straightener.rolls.backbend.rollers.first.down.percent_of_thickness_yielded = safeNumber(down.percentOfThicknessYielded);
              if (down.radiusAfterSpringback) result.straightener.rolls.backbend.rollers.first.down.radius_after_springback = safeNumber(down.radiusAfterSpringback);
            }
          }

          // Middle roll
          if (rollers.middle) {
            result.straightener.rolls.backbend.rollers.middle = {};
            const middle = rollers.middle;
            if (middle.height) result.straightener.rolls.backbend.rollers.middle.height = safeNumber(middle.height);
            if (middle.forceRequired) result.straightener.rolls.backbend.rollers.middle.force_required = safeNumber(middle.forceRequired);
            if (middle.numberOfYieldStrainsAtSurface) result.straightener.rolls.backbend.rollers.middle.number_of_yield_strains_at_surface = safeNumber(middle.numberOfYieldStrainsAtSurface);

            if (middle.up) {
              result.straightener.rolls.backbend.rollers.middle.up = {};
              const up = middle.up;
              if (up.resultingRadius) result.straightener.rolls.backbend.rollers.middle.up.resulting_radius = safeNumber(up.resultingRadius);
              if (up.curvatureDifference) result.straightener.rolls.backbend.rollers.middle.up.curvature_difference = safeNumber(up.curvatureDifference);
              if (up.bendingMoment) result.straightener.rolls.backbend.rollers.middle.up.bending_moment = safeNumber(up.bendingMoment);
              if (up.bendingMomentRatio) result.straightener.rolls.backbend.rollers.middle.up.bending_moment_ratio = safeNumber(up.bendingMomentRatio);
              if (up.springback) result.straightener.rolls.backbend.rollers.middle.up.springback = safeNumber(up.springback);
              if (up.percentOfThicknessYielded) result.straightener.rolls.backbend.rollers.middle.up.percent_of_thickness_yielded = safeNumber(up.percentOfThicknessYielded);
              if (up.radiusAfterSpringback) result.straightener.rolls.backbend.rollers.middle.up.radius_after_springback = safeNumber(up.radiusAfterSpringback);
            }

            if (middle.down) {
              result.straightener.rolls.backbend.rollers.middle.down = {};
              const down = middle.down;
              if (down.resultingRadius) result.straightener.rolls.backbend.rollers.middle.down.resulting_radius = safeNumber(down.resultingRadius);
              if (down.curvatureDifference) result.straightener.rolls.backbend.rollers.middle.down.curvature_difference = safeNumber(down.curvatureDifference);
              if (down.bendingMoment) result.straightener.rolls.backbend.rollers.middle.down.bending_moment = safeNumber(down.bendingMoment);
              if (down.bendingMomentRatio) result.straightener.rolls.backbend.rollers.middle.down.bending_moment_ratio = safeNumber(down.bendingMomentRatio);
              if (down.springback) result.straightener.rolls.backbend.rollers.middle.down.springback = safeNumber(down.springback);
              if (down.percentOfThicknessYielded) result.straightener.rolls.backbend.rollers.middle.down.percent_of_thickness_yielded = safeNumber(down.percentOfThicknessYielded);
              if (down.radiusAfterSpringback) result.straightener.rolls.backbend.rollers.middle.down.radius_after_springback = safeNumber(down.radiusAfterSpringback);
            }
          }

          // Last roll
          if (rollers.last) {
            result.straightener.rolls.backbend.rollers.last = {};
            const last = rollers.last;
            if (last.height) result.straightener.rolls.backbend.rollers.last.height = safeNumber(last.height);
            if (last.forceRequired) result.straightener.rolls.backbend.rollers.last.force_required = safeNumber(last.forceRequired);
            if (last.numberOfYieldStrainsAtSurface) result.straightener.rolls.backbend.rollers.last.number_of_yield_strains_at_surface = safeNumber(last.numberOfYieldStrainsAtSurface);

            if (last.up) {
              result.straightener.rolls.backbend.rollers.last.up = {};
              const up = last.up;
              if (up.resultingRadius) result.straightener.rolls.backbend.rollers.last.up.resulting_radius = safeNumber(up.resultingRadius);
              if (up.curvatureDifference) result.straightener.rolls.backbend.rollers.last.up.curvature_difference = safeNumber(up.curvatureDifference);
              if (up.bendingMoment) result.straightener.rolls.backbend.rollers.last.up.bending_moment = safeNumber(up.bendingMoment);
              if (up.bendingMomentRatio) result.straightener.rolls.backbend.rollers.last.up.bending_moment_ratio = safeNumber(up.bendingMomentRatio);
              if (up.springback) result.straightener.rolls.backbend.rollers.last.up.springback = safeNumber(up.springback);
              if (up.percentOfThicknessYielded) result.straightener.rolls.backbend.rollers.last.up.percent_of_thickness_yielded = safeNumber(up.percentOfThicknessYielded);
              if (up.radiusAfterSpringback) result.straightener.rolls.backbend.rollers.last.up.radius_after_springback = safeNumber(up.radiusAfterSpringback);
            }
          }
        }
      }
    }

    // Straightener torque
    if (straightener.torque) {
      result.straightener.torque = {};
      const torque = straightener.torque;
      if (torque.straightener) result.straightener.torque.straightener = safeNumber(torque.straightener);
      if (torque.acceleration) result.straightener.torque.acceleration = safeNumber(torque.acceleration);
      if (torque.brake) result.straightener.torque.brake = safeNumber(torque.brake);
    }

    // Straightener required calculations
    if (straightener.required) {
      result.straightener.required = {};
      const required = straightener.required;
      if (required.horsepower) result.straightener.required.horsepower = safeNumber(required.horsepower);
      if (required.horsepowerCheck) result.straightener.required.horsepower_check = safeString(required.horsepowerCheck);
      if (required.force) result.straightener.required.force = safeNumber(required.force);
      if (required.ratedForce) result.straightener.required.rated_force = safeNumber(required.ratedForce);
      if (required.jackForceCheck) result.straightener.required.jack_force_check = safeString(required.jackForceCheck);
      if (required.backupRollsCheck) result.straightener.required.backup_rolls_check = safeString(required.backupRollsCheck);
    }

    // Straightener gear calculations
    if (straightener.gear) {
      result.straightener.gear = {};
      const gear = straightener.gear;
      if (gear.faceWidth) result.straightener.gear.face_width = safeNumber(gear.faceWidth);
      if (gear.contAngle) result.straightener.gear.cont_angle = safeNumber(gear.contAngle);

      if (gear.straightenerRoll) {
        result.straightener.gear.straightener_roll = {};
        const strRoll = gear.straightenerRoll;
        if (strRoll.numberOfTeeth) result.straightener.gear.straightener_roll.number_of_teeth = safeNumber(strRoll.numberOfTeeth);
        if (strRoll.dp) result.straightener.gear.straightener_roll.dp = safeNumber(strRoll.dp);
      }

      if (gear.pinchRoll) {
        result.straightener.gear.pinch_roll = {};
        const pinchRoll = gear.pinchRoll;
        if (pinchRoll.numberOfTeeth) result.straightener.gear.pinch_roll.number_of_teeth = safeNumber(pinchRoll.numberOfTeeth);
        if (pinchRoll.dp) result.straightener.gear.pinch_roll.dp = safeNumber(pinchRoll.dp);
      }
    }
  }

  // Reel
  if (performanceData.reel) {
    result.reel = {};
    const reel = performanceData.reel;
    if (reel.model) result.reel.model = safeString(reel.model);
    if (reel.horsepower) result.reel.horsepower = safeNumber(reel.horsepower);
    if (reel.width) result.reel.width = safeNumber(reel.width);
    if (reel.ratio) result.reel.ratio = safeString(reel.ratio);
    if (reel.reelDriveOK) result.reel.reel_drive_ok = safeString(reel.reelDriveOK);
    if (reel.style) result.reel.style = safeString(reel.style);
    if (reel.airPressureAvailable) result.reel.air_pressure_available = safeNumber(reel.airPressureAvailable);
    if (reel.requiredDecelRate) result.reel.required_decel_rate = safeNumber(reel.requiredDecelRate);
    if (reel.acceleration) result.reel.acceleration = safeNumber(reel.acceleration);
    if (reel.speed) result.reel.speed = safeNumber(reel.speed);
    if (reel.accelerationTime) result.reel.acceleration_time = safeNumber(reel.accelerationTime);
    if (reel.coilWeight) result.reel.coil_weight = safeNumber(reel.coilWeight);
    if (reel.coilOD) result.reel.coil_od = safeNumber(reel.coilOD);
    if (reel.dispReelMtr) result.reel.disp_reel_mtr = safeString(reel.dispReelMtr);
    if (reel.brakePadDiameter) result.reel.brake_pad_diameter = safeNumber(reel.brakePadDiameter);
    if (reel.cylinderBore) result.reel.cylinder_bore = safeNumber(reel.cylinderBore);
    if (reel.coefficientOfFriction) result.reel.coefficient_of_friction = safeNumber(reel.coefficientOfFriction);
    if (reel.minMaterialWidth) result.reel.min_material_width = safeNumber(reel.minMaterialWidth);

    // Reel bearing
    if (reel.bearing) {
      result.reel.bearing = {};
      const bearing = reel.bearing;
      if (bearing.distance) result.reel.bearing.distance = safeNumber(bearing.distance);

      if (bearing.diameter) {
        result.reel.bearing.diameter = {};
        const diameter = bearing.diameter;
        if (diameter.front) result.reel.bearing.diameter.front = safeNumber(diameter.front);
        if (diameter.rear) result.reel.bearing.diameter.rear = safeNumber(diameter.rear);
      }
    }

    // Reel total reflected inertia
    if (reel.totalReflInertia) {
      result.reel.total_refl_inertia = {};
      const totalReflInertia = reel.totalReflInertia;
      if (totalReflInertia.empty) result.reel.total_refl_inertia.empty = safeNumber(totalReflInertia.empty);
      if (totalReflInertia.full) result.reel.total_refl_inertia.full = safeNumber(totalReflInertia.full);
    }

    // Reel mandrel
    if (reel.mandrel) {
      result.reel.mandrel = {};
      const mandrel = reel.mandrel;
      if (mandrel.diameter) result.reel.mandrel.diameter = safeNumber(mandrel.diameter);
      if (mandrel.length) result.reel.mandrel.length = safeNumber(mandrel.length);
      if (mandrel.maxRPM) result.reel.mandrel.max_rpm = safeNumber(mandrel.maxRPM);
      if (mandrel.RpmFull) result.reel.mandrel.rpm_full = safeNumber(mandrel.RpmFull);
      if (mandrel.weight) result.reel.mandrel.weight = safeNumber(mandrel.weight);
      if (mandrel.inertia) result.reel.mandrel.inertia = safeNumber(mandrel.inertia);
      if (mandrel.reflInertia) result.reel.mandrel.refl_inertia = safeNumber(mandrel.reflInertia);
    }

    // Reel backplate
    if (reel.backplate) {
      result.reel.backplate = {};
      const backplate = reel.backplate;
      if (backplate.type) result.reel.backplate.type = safeString(backplate.type);
      if (backplate.diameter) result.reel.backplate.diameter = safeNumber(backplate.diameter);
      if (backplate.thickness) result.reel.backplate.thickness = safeNumber(backplate.thickness);
      if (backplate.weight) result.reel.backplate.weight = safeNumber(backplate.weight);
      if (backplate.inertia) result.reel.backplate.inertia = safeNumber(backplate.inertia);
      if (backplate.reflInertia) result.reel.backplate.refl_inertia = safeNumber(backplate.reflInertia);
    }

    // Reel reducer
    if (reel.reducer) {
      result.reel.reducer = {};
      const reducer = reel.reducer;
      if (reducer.ratio) result.reel.reducer.ratio = safeNumber(reducer.ratio);
      if (reducer.efficiency) result.reel.reducer.efficiency = safeNumber(reducer.efficiency);
      if (reducer.driving) result.reel.reducer.driving = safeNumber(reducer.driving);
      if (reducer.backdriving) result.reel.reducer.backdriving = safeNumber(reducer.backdriving);
      if (reducer.inertia) result.reel.reducer.inertia = safeNumber(reducer.inertia);
      if (reducer.reflInertia) result.reel.reducer.refl_inertia = safeNumber(reducer.reflInertia);
    }

    // Reel chain
    if (reel.chain) {
      result.reel.chain = {};
      const chain = reel.chain;
      if (chain.ratio) result.reel.chain.ratio = safeNumber(chain.ratio);
      if (chain.sprktOD) result.reel.chain.sprkt_od = safeNumber(chain.sprktOD);
      if (chain.sprktThickness) result.reel.chain.sprkt_thickness = safeNumber(chain.sprktThickness);
      if (chain.weight) result.reel.chain.weight = safeNumber(chain.weight);
      if (chain.inertia) result.reel.chain.inertia = safeNumber(chain.inertia);
      if (chain.reflInertia) result.reel.chain.refl_inertia = safeNumber(chain.reflInertia);
    }

    // Reel motor
    if (reel.motor) {
      result.reel.motor = {};
      const motor = reel.motor;
      if (motor.inertia) result.reel.motor.inertia = safeNumber(motor.inertia);

      if (motor.rpm) {
        result.reel.motor.rpm = {};
        const rpm = motor.rpm;
        if (rpm.base) result.reel.motor.rpm.base = safeNumber(rpm.base);
        if (rpm.full) result.reel.motor.rpm.full = safeNumber(rpm.full);
      }
    }

    // Reel friction
    if (reel.friction) {
      result.reel.friction = {};
      if (reel.friction.bearing) {
        result.reel.friction.bearing = {};
        const bearing = reel.friction.bearing;

        if (bearing.mandrel) {
          result.reel.friction.bearing.mandrel = {};
          const mandrel = bearing.mandrel;
          if (mandrel.rear) result.reel.friction.bearing.mandrel.rear = safeNumber(mandrel.rear);
          if (mandrel.front) result.reel.friction.bearing.mandrel.front = safeNumber(mandrel.front);
        }

        if (bearing.coil) {
          result.reel.friction.bearing.coil = {};
          if (bearing.coil.rear) result.reel.friction.bearing.coil.rear = safeNumber(bearing.coil.rear);
          if (bearing.coil.front) result.reel.friction.bearing.coil.front = safeNumber(bearing.coil.front);
        }

        if (bearing.total) {
          result.reel.friction.bearing.total = {};
          const total = bearing.total;
          if (total.empty) result.reel.friction.bearing.total.empty = safeNumber(total.empty);
          if (total.full) result.reel.friction.bearing.total.full = safeNumber(total.full);
        }

        if (bearing.refl) {
          result.reel.friction.bearing.refl = {};
          const refl = bearing.refl;
          if (refl.empty) result.reel.friction.bearing.refl.empty = safeNumber(refl.empty);
          if (refl.full) result.reel.friction.bearing.refl.full = safeNumber(refl.full);
        }
      }
    }

    // Reel motorization
    if (reel.motorization) {
      result.reel.motorization = {};
      const motorization = reel.motorization;
      if (motorization.isMotorized) result.reel.motorization.is_motorized = safeString(motorization.isMotorized);
      if (motorization.driveHorsepower) result.reel.motorization.drive_horsepower = safeNumber(motorization.driveHorsepower);
      if (motorization.speed) result.reel.motorization.speed = safeNumber(motorization.speed);
      if (motorization.accelRate) result.reel.motorization.accel_rate = safeNumber(motorization.accelRate);
      if (motorization.regenRequired) result.reel.motorization.regen_required = safeString(motorization.regenRequired);
    }

    // Reel threading drive
    if (reel.threadingDrive) {
      result.reel.threading_drive = {};
      const threadingDrive = reel.threadingDrive;
      if (threadingDrive.airClutch) result.reel.threading_drive.air_clutch = safeString(threadingDrive.airClutch);
      if (threadingDrive.hydThreadingDrive) result.reel.threading_drive.hyd_threading_drive = safeString(threadingDrive.hydThreadingDrive);
    }

    // Reel holddown
    if (reel.holddown) {
      result.reel.holddown = {};
      const holddown = reel.holddown;
      if (holddown.assy) result.reel.holddown.assy = safeString(holddown.assy);
      if (holddown.cylinder) result.reel.holddown.cylinder = safeString(holddown.cylinder);
      if (holddown.cylinderPressure) result.reel.holddown.cylinder_pressure = safeNumber(holddown.cylinderPressure);

      if (holddown.force) {
        result.reel.holddown.force = {};
        const force = holddown.force;
        if (force.required) result.reel.holddown.force.required = safeNumber(force.required);
        if (force.available) result.reel.holddown.force.available = safeNumber(force.available);
      }
    }

    // Reel drag brake
    if (reel.dragBrake) {
      result.reel.drag_brake = {};
      const dragBrake = reel.dragBrake;
      if (dragBrake.model) result.reel.drag_brake.model = safeString(dragBrake.model);
      if (dragBrake.quantity) result.reel.drag_brake.quantity = safeString(dragBrake.quantity);
      if (dragBrake.psiAirRequired) result.reel.drag_brake.psi_air_required = safeNumber(dragBrake.psiAirRequired);
      if (dragBrake.holdingForce) result.reel.drag_brake.holding_force = safeNumber(dragBrake.holdingForce);
    }

    // Reel web tension
    if (reel.webTension) {
      result.reel.web_tension = {};
      const webTension = reel.webTension;
      if (webTension.psi) result.reel.web_tension.psi = safeNumber(webTension.psi);
      if (webTension.lbs) result.reel.web_tension.lbs = safeNumber(webTension.lbs);
    }

    // Reel torque
    if (reel.torque) {
      result.reel.torque = {};
      const torque = reel.torque;
      if (torque.atMandrel) result.reel.torque.at_mandrel = safeNumber(torque.atMandrel);
      if (torque.rewindRequired) result.reel.torque.rewind_required = safeNumber(torque.rewindRequired);
      if (torque.required) result.reel.torque.required = safeNumber(torque.required);

      if (torque.empty) {
        result.reel.torque.empty = {};
        const empty = torque.empty;
        if (empty.torque) result.reel.torque.empty.torque = safeNumber(empty.torque);
        if (empty.horsepowerRequired) result.reel.torque.empty.horsepower_required = safeNumber(empty.horsepowerRequired);
        if (empty.horsepowerCheck) result.reel.torque.empty.horsepower_check = safeString(empty.horsepowerCheck);
        if (empty.regen) result.reel.torque.empty.regen = safeString(empty.regen);
        if (empty.regenCheck) result.reel.torque.empty.regen_check = safeString(empty.regenCheck);
      }

      if (torque.full) {
        result.reel.torque.full = {};
        const full = torque.full;
        if (full.torque) result.reel.torque.full.torque = safeNumber(full.torque);
        if (full.horsepowerRequired) result.reel.torque.full.horsepower_required = safeNumber(full.horsepowerRequired);
        if (full.horsepowerCheck) result.reel.torque.full.horsepower_check = safeString(full.horsepowerCheck);
        if (full.regen) result.reel.torque.full.regen = safeString(full.regen);
        if (full.regenCheck) result.reel.torque.full.regen_check = safeString(full.regenCheck);
      }
    }
  }

  // Shear
  if (performanceData.shear) {
    result.shear = {};
    const shear = performanceData.shear;
    if (shear.model) result.shear.model = safeString(shear.model);
    if (shear.strength) result.shear.strength = safeNumber(shear.strength);

    // Shear blade
    if (shear.blade) {
      result.shear.blade = {};
      const blade = shear.blade;
      if (blade.rakeOfBladePerFoot) result.shear.blade.rake_of_blade_per_foot = safeNumber(blade.rakeOfBladePerFoot);
      if (blade.overlap) result.shear.blade.overlap = safeNumber(blade.overlap);
      if (blade.bladeOpening) result.shear.blade.blade_opening = safeNumber(blade.bladeOpening);
      if (blade.percentOfPenetration) result.shear.blade.percent_of_penetration = safeNumber(blade.percentOfPenetration);
      if (blade.angleOfBlade) result.shear.blade.angle_of_blade = safeNumber(blade.angleOfBlade);

      if (blade.initialCut) {
        result.shear.blade.initial_cut = {};
        const initialCut = blade.initialCut;
        if (initialCut.length) result.shear.blade.initial_cut.length = safeNumber(initialCut.length);
        if (initialCut.area) result.shear.blade.initial_cut.area = safeNumber(initialCut.area);
      }
    }

    // Shear cylinder
    if (shear.cylinder) {
      result.shear.cylinder = {};
      const cylinder = shear.cylinder;
      if (cylinder.boreSize) result.shear.cylinder.bore_size = safeNumber(cylinder.boreSize);
      if (cylinder.rodDiameter) result.shear.cylinder.rod_diameter = safeNumber(cylinder.rodDiameter);
      if (cylinder.stroke) result.shear.cylinder.stroke = safeNumber(cylinder.stroke);
      if (cylinder.actualOpeningAboveMaxMaterial) result.shear.cylinder.actual_opening_above_max_material = safeNumber(cylinder.actualOpeningAboveMaxMaterial);

      if (cylinder.minStroke) {
        result.shear.cylinder.min_stroke = {};
        const minStroke = cylinder.minStroke;
        if (minStroke.forBlade) result.shear.cylinder.min_stroke.for_blade = safeNumber(minStroke.forBlade);
        if (minStroke.requiredForOpening) result.shear.cylinder.min_stroke.required_for_opening = safeNumber(minStroke.requiredForOpening);
      }
    }

    // Shear hydraulic
    if (shear.hydraulic) {
      result.shear.hydraulic = {};
      const hydraulic = shear.hydraulic;
      if (hydraulic.pressure) result.shear.hydraulic.pressure = safeNumber(hydraulic.pressure);
      if (hydraulic.fluidVelocity) result.shear.hydraulic.fluid_velocity = safeNumber(hydraulic.fluidVelocity);

      if (hydraulic.cylinder) {
        result.shear.hydraulic.cylinder = {};
        const cylinder = hydraulic.cylinder;
        if (cylinder.area) result.shear.hydraulic.cylinder.area = safeNumber(cylinder.area);
        if (cylinder.volume) result.shear.hydraulic.cylinder.volume = safeNumber(cylinder.volume);
      }
    }

    // Shear time
    if (shear.time) {
      result.shear.time = {};
      const time = shear.time;
      if (time.forDownwardStroke) result.shear.time.for_downward_stroke = safeNumber(time.forDownwardStroke);
      if (time.dwellTime) result.shear.time.dwell_time = safeNumber(time.dwellTime);
    }

    // Shear conclusions
    if (shear.conclusions) {
      result.shear.conclusions = {};
      const conclusions = shear.conclusions;
      if (conclusions.safetyFactor) result.shear.conclusions.safety_factor = safeNumber(conclusions.safetyFactor);

      if (conclusions.force) {
        result.shear.conclusions.force = {};
        const force = conclusions.force;
        if (force.perCylinder) result.shear.conclusions.force.per_cylinder = safeNumber(force.perCylinder);
        if (force.requiredToShear) result.shear.conclusions.force.required_to_shear = safeNumber(force.requiredToShear);

        if (force.totalApplied) {
          result.shear.conclusions.force.total_applied = {};
          const totalApplied = force.totalApplied;
          if (totalApplied.lbs) result.shear.conclusions.force.total_applied.lbs = safeNumber(totalApplied.lbs);
          if (totalApplied.tons) result.shear.conclusions.force.total_applied.tons = safeNumber(totalApplied.tons);
        }
      }

      if (conclusions.perMinute) {
        result.shear.conclusions.per_minute = {};
        const perMinute = conclusions.perMinute;
        if (perMinute.shearStrokes) result.shear.conclusions.per_minute.shear_strokes = safeNumber(perMinute.shearStrokes);
        if (perMinute.parts) result.shear.conclusions.per_minute.parts = safeNumber(perMinute.parts);

        if (perMinute.gallons) {
          result.shear.conclusions.per_minute.gallons = {};
          const gallons = perMinute.gallons;
          if (gallons.instantaneous) result.shear.conclusions.per_minute.gallons.instantaneous = safeNumber(gallons.instantaneous);
          if (gallons.averaged) result.shear.conclusions.per_minute.gallons.averaged = safeNumber(gallons.averaged);
        }
      }
    }
  }

  // Equipment Information
  if (performanceData.voltageRequired) {
    result.voltage_required = safeNumber(performanceData.voltageRequired);
  }
  if (performanceData.equipmentSpaceLength) {
    result.equipment_space_length = safeNumber(performanceData.equipmentSpaceLength);
  }
  if (performanceData.equipmentSpaceWidth) {
    result.equipment_space_width = safeNumber(performanceData.equipmentSpaceWidth);
  }
  if (performanceData.obstructions) {
    result.obstructions = safeString(performanceData.obstructions);
  }

  // Mounting Information
  if (performanceData.mount) {
    result.mount = {};
    const mount = performanceData.mount;
    if (mount.feederMountedToPress) result.mount.feeder_mounted_to_press = safeString(mount.feederMountedToPress);
    if (mount.adequateSupport) result.mount.adequate_support = safeString(mount.adequateSupport);
    if (mount.customMounting) result.mount.custom_mounting = safeString(mount.customMounting);
  }

  // Other fields
  if (performanceData.loopPit) {
    result.loop_pit = safeString(performanceData.loopPit);
  }
  if (performanceData.requireGuarding) {
    result.require_guarding = safeString(performanceData.requireGuarding);
  }
  if (performanceData.specialConsiderations) {
    result.special_considerations = safeString(performanceData.specialConsiderations);
  }

  return result;
}

// Update the universal mapper to handle calculation result fields
export function mapBackendToPerformanceData(
  backendData: any,
  currentPerformanceData?: Partial<PerformanceData>
): Partial<PerformanceData> {
  const safeTransform = (value: any) => {
    if (value === undefined || value === null) return "";
    return String(value);
  };

  const safeNumber = (value: any) => {
    if (value === undefined || value === null) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const boolTransform = (value: any) => {
    if (typeof value === 'boolean') return value ? "true" : "false";
    if (typeof value === 'string') return value.toLowerCase() === 'true' ? "true" : "false";
    return value ? "true" : "false";
  };

  return {
    // Basic Information
    referenceNumber: backendData.reference || backendData.referenceNumber || currentPerformanceData?.referenceNumber || "",
    customer: backendData.customer || currentPerformanceData?.customer || "",
    
    // Customer Info
    customerInfo: {
      ...currentPerformanceData?.customerInfo,
      streetAddress: backendData.street_address || currentPerformanceData?.customerInfo?.streetAddress || "",
      city: backendData.city || currentPerformanceData?.customerInfo?.city || "",
      state: backendData.state_province || backendData.state || currentPerformanceData?.customerInfo?.state || "",
      zip: safeNumber(backendData.zip_code ?? backendData.zip ?? currentPerformanceData?.customerInfo?.zip),
      country: backendData.country || currentPerformanceData?.customerInfo?.country || "",
      contactName: backendData.contact_name || currentPerformanceData?.customerInfo?.contactName || "",
      position: backendData.contact_position || currentPerformanceData?.customerInfo?.position || "",
      phoneNumber: backendData.contact_phone_number || backendData.phone || currentPerformanceData?.customerInfo?.phoneNumber || "",
      email: backendData.contact_email || backendData.email || currentPerformanceData?.customerInfo?.email || "",
      dealerName: backendData.dealer_name || currentPerformanceData?.customerInfo?.dealerName || "",
      dealerSalesman: backendData.dealer_salesman || currentPerformanceData?.customerInfo?.dealerSalesman || "",
      daysPerWeek: safeNumber(backendData.days_per_week_running || backendData.days_per_week || currentPerformanceData?.customerInfo?.daysPerWeek),
      shiftsPerDay: safeNumber(backendData.shifts_per_day || currentPerformanceData?.customerInfo?.shiftsPerDay),
    },
    
    // Dates
    dates: {
      ...currentPerformanceData?.dates,
      date: backendData.date || currentPerformanceData?.dates?.date || "",
      decisionDate: backendData.decision_date || currentPerformanceData?.dates?.decisionDate || "",
      idealDeliveryDate: backendData.ideal_delivery_date || currentPerformanceData?.dates?.idealDeliveryDate || "",
      earliestDeliveryDate: backendData.earliest_delivery_date || currentPerformanceData?.dates?.earliestDeliveryDate || "",
      latestDeliveryDate: backendData.latest_delivery_date || currentPerformanceData?.dates?.latestDeliveryDate || "",
    },
    
    // Coil Information
    coil: {
      ...currentPerformanceData?.coil,
      density: safeNumber(backendData.coil_density || currentPerformanceData?.coil?.density),
      weight: safeNumber(backendData.coil_weight || currentPerformanceData?.coil?.weight),
      maxCoilWidth: safeNumber(backendData.coil_width_max || backendData.max_coil_width || currentPerformanceData?.coil?.maxCoilWidth),
      minCoilWidth: safeNumber(backendData.coil_width_min || backendData.min_coil_width || currentPerformanceData?.coil?.minCoilWidth),
      maxCoilOD: safeNumber(backendData.max_coil_od || backendData.coil_od || currentPerformanceData?.coil?.maxCoilOD),
      coilID: safeNumber(backendData.coil_id || currentPerformanceData?.coil?.coilID),
      maxCoilWeight: safeNumber(backendData.coil_weight_max || backendData.max_coil_weight || backendData.coil_weight || currentPerformanceData?.coil?.maxCoilWeight),
      maxCoilHandlingCap: safeNumber(backendData.coil_handling_cap_max || currentPerformanceData?.coil?.maxCoilHandlingCap),
      slitEdge: boolTransform(backendData.slit_edge || currentPerformanceData?.coil?.slitEdge),
      millEdge: boolTransform(backendData.mill_edge || currentPerformanceData?.coil?.millEdge),
      requireCoilCar: backendData.require_coil_car || currentPerformanceData?.coil?.requireCoilCar || "",
      runningOffBackplate: backendData.running_off_backplate || currentPerformanceData?.coil?.runningOffBackplate || "",
      requireRewinding: backendData.require_rewinding || currentPerformanceData?.coil?.requireRewinding || "",
      changeTimeConcern: backendData.change_time_concern || currentPerformanceData?.coil?.changeTimeConcern || "",
      timeChangeGoal: safeTransform(backendData.time_change_goal || currentPerformanceData?.coil?.timeChangeGoal),
      loading: backendData.coil_loading || backendData.loading || currentPerformanceData?.coil?.loading || "",
    },
    
    // Material Information
    material: {
      ...currentPerformanceData?.material,
      materialThickness: safeNumber(
        backendData.material_thickness || 
        backendData.max_material_thickness || 
        currentPerformanceData?.material?.materialThickness
      ),
      materialDensity: safeNumber(backendData.material_density || currentPerformanceData?.material?.materialDensity),
      coilWidth: safeNumber(
        backendData.material_width || 
        backendData.max_material_width || 
        backendData.coil_width ||
        currentPerformanceData?.material?.coilWidth
      ),
      materialType: backendData.material_type || backendData.max_material_type || currentPerformanceData?.material?.materialType || "",
      maxYieldStrength: safeNumber(
        backendData.yield_strength || 
        backendData.max_yield_strength || 
        currentPerformanceData?.material?.maxYieldStrength
      ),
      maxTensileStrength: safeNumber(
        backendData.tensile_strength || 
        backendData.max_tensile_strength || 
        currentPerformanceData?.material?.maxTensileStrength
      ),
      minBendRadius: safeNumber(backendData.min_bend_rad || currentPerformanceData?.material?.minBendRadius),
      minLoopLength: safeNumber(backendData.min_loop_length || currentPerformanceData?.material?.minLoopLength),
      calculatedCoilOD: safeNumber(backendData.coil_od_calculated || currentPerformanceData?.material?.calculatedCoilOD),
    },
    
    // Running Cosmetic Material
    runningCosmeticMaterial: backendData.running_cosmetic_material || backendData.cosmetic_material || currentPerformanceData?.runningCosmeticMaterial || "",
    brandOfFeed: backendData.brand_of_feed || backendData.current_brand_feed || currentPerformanceData?.brandOfFeed || "",
    
    // Press Information
    press: {
      ...currentPerformanceData?.press,
      gapFramePress: boolTransform(backendData.gap_frame_press || currentPerformanceData?.press?.gapFramePress),
      hydraulicPress: boolTransform(backendData.hydraulic_press || currentPerformanceData?.press?.hydraulicPress),
      obi: boolTransform(backendData.obi || currentPerformanceData?.press?.obi),
      servoPress: boolTransform(backendData.servo_press || currentPerformanceData?.press?.servoPress),
      shearDieApplication: boolTransform(backendData.shear_die_application || currentPerformanceData?.press?.shearDieApplication),
      straightSidePress: boolTransform(backendData.straight_side_press || currentPerformanceData?.press?.straightSidePress),
      other: boolTransform(backendData.press_other || currentPerformanceData?.press?.other),
      tonnageOfPress: safeTransform(backendData.tonnage_of_press || currentPerformanceData?.press?.tonnageOfPress),
      strokeLength: safeTransform(backendData.stroke_length || currentPerformanceData?.press?.strokeLength),
      maxSPM: safeTransform(backendData.max_spm || currentPerformanceData?.press?.maxSPM),
      bedWidth: safeTransform(backendData.bed_width || currentPerformanceData?.press?.bedWidth),
      bedLength: safeTransform(backendData.bed_length || currentPerformanceData?.press?.bedLength),
      windowSize: safeTransform(backendData.window_size || currentPerformanceData?.press?.windowSize),
      cycleTime: safeTransform(backendData.cycle_time || currentPerformanceData?.press?.cycleTime),
    },
    
    // Dies Information
    dies: {
      ...currentPerformanceData?.dies,
      transferDies: boolTransform(backendData.transfer_dies || currentPerformanceData?.dies?.transferDies),
      progressiveDies: boolTransform(backendData.progressive_dies || currentPerformanceData?.dies?.progressiveDies),
      blankingDies: boolTransform(backendData.blanking_dies || currentPerformanceData?.dies?.blankingDies),
    },
    
    // Feed Information
    feed: {
      ...currentPerformanceData?.feed,
      application: backendData.line_application || backendData.application || currentPerformanceData?.feed?.application || "",
      model: backendData.model || currentPerformanceData?.feed?.model || "",
      machineWidth: safeNumber(backendData.machine_width || currentPerformanceData?.feed?.machineWidth),
      loopPit: backendData.loop_pit || currentPerformanceData?.feed?.loopPit || "",
      fullWidthRolls: backendData.full_width_rolls || currentPerformanceData?.feed?.fullWidthRolls || "",
      motor: safeTransform(backendData.motor || currentPerformanceData?.feed?.motor),
      amp: safeTransform(backendData.amp || currentPerformanceData?.feed?.amp),
      frictionInDie: safeNumber(backendData.friction_in_die || currentPerformanceData?.feed?.frictionInDie),
      accelerationRate: safeNumber(backendData.acceleration_rate || currentPerformanceData?.feed?.accelerationRate),
      defaultAcceleration: safeNumber(backendData.default_acceleration || currentPerformanceData?.feed?.defaultAcceleration),
      feedAngle1: safeNumber(backendData.feed_angle1 || currentPerformanceData?.feed?.feedAngle1),
      feedAngle2: safeNumber(backendData.feed_angle2 || currentPerformanceData?.feed?.feedAngle2),
      maximumVelocity: safeNumber(backendData.maximum_velocity || currentPerformanceData?.feed?.maximumVelocity),
      acceleration: safeNumber(backendData.acceleration || currentPerformanceData?.feed?.acceleration),
      ratio: safeTransform(backendData.ratio || currentPerformanceData?.feed?.ratio),
      typeOfLine: backendData.type_of_line || currentPerformanceData?.feed?.typeOfLine || "",
      direction: backendData.feed_direction || currentPerformanceData?.feed?.direction || "",
      controls: backendData.feed_controls || currentPerformanceData?.feed?.controls || "",
      controlsLevel: backendData.controls_level || currentPerformanceData?.feed?.controlsLevel || "",
      passline: safeTransform(backendData.passline || backendData.passline_height || currentPerformanceData?.feed?.passline),
      lightGuageNonMarking: boolTransform(backendData.light_guage || backendData.light_gauge || currentPerformanceData?.feed?.lightGuageNonMarking),
      nonMarking: boolTransform(backendData.non_marking || currentPerformanceData?.feed?.nonMarking),
      pullThru: {
        ...currentPerformanceData?.feed?.pullThru,
        isPullThru: backendData.pull_thru || backendData.pull_through || currentPerformanceData?.feed?.pullThru?.isPullThru || "",
        straightenerRolls: safeNumber(backendData.pull_thru_straightener_rolls || currentPerformanceData?.feed?.pullThru?.straightenerRolls),
        pinchRolls: safeTransform(backendData.pull_thru_pinch_rolls || currentPerformanceData?.feed?.pullThru?.pinchRolls),
      },
      average: {
        ...currentPerformanceData?.feed?.average,
        length: safeNumber(backendData.avg_feed_length || currentPerformanceData?.feed?.average?.length),
        spm: safeNumber(backendData.avg_feed_spm || currentPerformanceData?.feed?.average?.spm),
        fpm: safeNumber(backendData.avg_fpm || currentPerformanceData?.feed?.average?.fpm),
      },
      max: {
        ...currentPerformanceData?.feed?.max,
        length: safeNumber(backendData.max_feed_length || currentPerformanceData?.feed?.max?.length),
        spm: safeNumber(backendData.max_feed_spm || currentPerformanceData?.feed?.max?.spm),
        fpm: safeNumber(backendData.max_fpm || currentPerformanceData?.feed?.max?.fpm),
      },
      min: {
        ...currentPerformanceData?.feed?.min,
        length: safeNumber(backendData.min_feed_length || currentPerformanceData?.feed?.min?.length),
        spm: safeNumber(backendData.min_feed_spm || currentPerformanceData?.feed?.min?.spm),
        fpm: safeNumber(backendData.min_fpm || currentPerformanceData?.feed?.min?.fpm),
      },
    },
    
    // Straightener Information
    straightener: {
      ...currentPerformanceData?.straightener,
      model: backendData.straightener_model || currentPerformanceData?.straightener?.model || "",
      rolls: {
        ...currentPerformanceData?.straightener?.rolls,
        typeOfRoll: backendData.selected_roll || backendData.type_of_roll || currentPerformanceData?.straightener?.rolls?.typeOfRoll || "",
        straighteningRolls: safeNumber(backendData.straightening_rolls || currentPerformanceData?.straightener?.rolls?.straighteningRolls),
        numberOfRolls: safeNumber(backendData.number_of_rolls || currentPerformanceData?.straightener?.rolls?.numberOfRolls),
        backupRolls: safeTransform(backendData.backup_rolls || currentPerformanceData?.straightener?.rolls?.backupRolls),
      },
      payoff: backendData.payoff || currentPerformanceData?.straightener?.payoff || "",
      width: safeNumber(backendData.straightener_width || currentPerformanceData?.straightener?.width),
      feedRate: safeNumber(backendData.feed_rate || currentPerformanceData?.straightener?.feedRate),
      acceleration: safeNumber(backendData.straightener_acceleration || currentPerformanceData?.straightener?.acceleration),
      horsepower: safeNumber(backendData.horsepower || currentPerformanceData?.straightener?.horsepower),
    },
    
    // Reel Information
    reel: {
      ...currentPerformanceData?.reel,
      model: backendData.reel_model || currentPerformanceData?.reel?.model || "",
      horsepower: safeNumber(backendData.hp || backendData.reel_hp || currentPerformanceData?.reel?.horsepower),
      width: safeNumber(backendData.reel_width || backendData.reel_max_width || currentPerformanceData?.reel?.width),
      ratio: safeTransform(backendData.reel_ratio || currentPerformanceData?.reel?.ratio),
      style: backendData.reel_style || currentPerformanceData?.reel?.style || "",
      bearing: {
        ...currentPerformanceData?.reel?.bearing,
        diameter: {
          ...currentPerformanceData?.reel?.bearing?.diameter,
          front: safeNumber(backendData.reel_f_brg_dia || currentPerformanceData?.reel?.bearing?.diameter?.front),
          rear: safeNumber(backendData.reel_r_brg_dia || currentPerformanceData?.reel?.bearing?.diameter?.rear),
        },
        distance: safeNumber(backendData.reel_brg_dist || currentPerformanceData?.reel?.bearing?.distance),
      },
      mandrel: {
        ...currentPerformanceData?.reel?.mandrel,
        diameter: safeNumber(backendData.mandrel_diameter || currentPerformanceData?.reel?.mandrel?.diameter),
        length: safeNumber(backendData.mandrel_length || currentPerformanceData?.reel?.mandrel?.length),
        maxRPM: safeNumber(backendData.mandrel_max_rpm || currentPerformanceData?.reel?.mandrel?.maxRPM),
        RpmFull: safeNumber(backendData.mandrel_rpm_full || currentPerformanceData?.reel?.mandrel?.RpmFull),
        weight: safeNumber(backendData.mandrel_weight || currentPerformanceData?.reel?.mandrel?.weight),
        inertia: safeNumber(backendData.mandrel_inertia || currentPerformanceData?.reel?.mandrel?.inertia),
        reflInertia: safeNumber(backendData.mandrel_refl_inert || currentPerformanceData?.reel?.mandrel?.reflInertia),
      },
      backplate: {
        ...currentPerformanceData?.reel?.backplate,
        type: backendData.reel_backplate || currentPerformanceData?.reel?.backplate?.type || "",
        diameter: safeNumber(backendData.backplate_diameter || currentPerformanceData?.reel?.backplate?.diameter),
        thickness: safeNumber(backendData.backplate_thickness || currentPerformanceData?.reel?.backplate?.thickness),
        weight: safeNumber(backendData.backplate_weight || currentPerformanceData?.reel?.backplate?.weight),
        inertia: safeNumber(backendData.backplate_inertia || currentPerformanceData?.reel?.backplate?.inertia),
        reflInertia: safeNumber(backendData.backplate_refl_inert || currentPerformanceData?.reel?.backplate?.reflInertia),
      },
      reducer: {
        ...currentPerformanceData?.reel?.reducer,
        ratio: safeNumber(backendData.reducer_ratio || currentPerformanceData?.reel?.reducer?.ratio),
        efficiency: safeNumber(backendData.reducer_efficiency || currentPerformanceData?.reel?.reducer?.efficiency),
        driving: safeNumber(backendData.reducer_driving || currentPerformanceData?.reel?.reducer?.driving),
        backdriving: safeNumber(backendData.reducer_backdriving || currentPerformanceData?.reel?.reducer?.backdriving),
        inertia: safeNumber(backendData.reducer_inertia || currentPerformanceData?.reel?.reducer?.inertia),
        reflInertia: safeNumber(backendData.reducer_refl_inert || currentPerformanceData?.reel?.reducer?.reflInertia),
      },
      chain: {
        ...currentPerformanceData?.reel?.chain,
        ratio: safeNumber(backendData.chain_ratio || currentPerformanceData?.reel?.chain?.ratio),
        sprktOD: safeNumber(backendData.chain_sprkt_od || currentPerformanceData?.reel?.chain?.sprktOD),
        sprktThickness: safeNumber(backendData.chain_sprkt_thk || currentPerformanceData?.reel?.chain?.sprktThickness),
        weight: safeNumber(backendData.chain_weight || currentPerformanceData?.reel?.chain?.weight),
        inertia: safeNumber(backendData.chain_inertia || currentPerformanceData?.reel?.chain?.inertia),
        reflInertia: safeNumber(backendData.chain_refl_inert || currentPerformanceData?.reel?.chain?.reflInertia),
      },
      motor: {
        ...currentPerformanceData?.reel?.motor,
        inertia: safeNumber(backendData.motor_inertia || currentPerformanceData?.reel?.motor?.inertia),
        rpm: {
          ...currentPerformanceData?.reel?.motor?.rpm,
          base: safeNumber(backendData.motor_base_rpm || currentPerformanceData?.reel?.motor?.rpm?.base),
          full: safeNumber(backendData.motor_rpm_full || currentPerformanceData?.reel?.motor?.rpm?.full),
        },
      },
      totalReflInertia: {
        ...currentPerformanceData?.reel?.totalReflInertia,
        empty: safeNumber(backendData.total_refl_inertia_empty || currentPerformanceData?.reel?.totalReflInertia?.empty),
        full: safeNumber(backendData.total_refl_inertia_full || currentPerformanceData?.reel?.totalReflInertia?.full),
      },
      friction: {
        ...currentPerformanceData?.reel?.friction,
        bearing: {
          ...currentPerformanceData?.reel?.friction?.bearing,
          mandrel: {
            ...currentPerformanceData?.reel?.friction?.bearing?.mandrel,
            rear: safeNumber(backendData.friction_r_brg_mand || currentPerformanceData?.reel?.friction?.bearing?.mandrel?.rear),
            front: safeNumber(backendData.friction_f_brg_mand || currentPerformanceData?.reel?.friction?.bearing?.mandrel?.front),
          },
          coil: {
            ...currentPerformanceData?.reel?.friction?.bearing?.coil,
            front: safeNumber(backendData.friction_f_brg_coil || currentPerformanceData?.reel?.friction?.bearing?.coil?.front),
          },
          total: {
            ...currentPerformanceData?.reel?.friction?.bearing?.total,
            empty: safeNumber(backendData.friction_total_empty || currentPerformanceData?.reel?.friction?.bearing?.total?.empty),
            full: safeNumber(backendData.friction_total_full || currentPerformanceData?.reel?.friction?.bearing?.total?.full),
          },
          refl: {
            ...currentPerformanceData?.reel?.friction?.bearing?.refl,
            empty: safeNumber(backendData.friction_refl_empty || currentPerformanceData?.reel?.friction?.bearing?.refl?.empty),
            full: safeNumber(backendData.friction_refl_full || currentPerformanceData?.reel?.friction?.bearing?.refl?.full),
          },
        },
      },
      motorization: {
        ...currentPerformanceData?.reel?.motorization,
        isMotorized: backendData.reel_motorization || currentPerformanceData?.reel?.motorization?.isMotorized || "",
        driveHorsepower: safeNumber(backendData.drive_horsepower || currentPerformanceData?.reel?.motorization?.driveHorsepower),
        speed: safeNumber(backendData.speed || currentPerformanceData?.reel?.motorization?.speed),
        accelRate: safeNumber(backendData.accel_rate || currentPerformanceData?.reel?.motorization?.accelRate),
        regenRequired: backendData.regen_reqd || currentPerformanceData?.reel?.motorization?.regenRequired || "",
      },
      threadingDrive: {
        ...currentPerformanceData?.reel?.threadingDrive,
        airClutch: backendData.air_clutch || currentPerformanceData?.reel?.threadingDrive?.airClutch || "",
        hydThreadingDrive: backendData.hyd_threading_drive || currentPerformanceData?.reel?.threadingDrive?.hydThreadingDrive || "",
      },
      holddown: {
        ...currentPerformanceData?.reel?.holddown,
        assy: backendData.hold_down_assy || currentPerformanceData?.reel?.holddown?.assy || "",
        cylinder: backendData.hold_down_cylinder || currentPerformanceData?.reel?.holddown?.cylinder || "",
        cylinderPressure: safeNumber(backendData.holddown_pressure || currentPerformanceData?.reel?.holddown?.cylinderPressure),
      },
      dragBrake: {
        ...currentPerformanceData?.reel?.dragBrake,
        model: backendData.brake_model || currentPerformanceData?.reel?.dragBrake?.model || "",
        quantity: backendData.brake_quantity || currentPerformanceData?.reel?.dragBrake?.quantity || "",
      },
      airPressureAvailable: safeNumber(backendData.air_pressure || currentPerformanceData?.reel?.airPressureAvailable),
      requiredDecelRate: safeNumber(backendData.decel_rate || currentPerformanceData?.reel?.requiredDecelRate),
      acceleration: safeNumber(backendData.reel_acceleration || currentPerformanceData?.reel?.acceleration),
      speed: safeNumber(backendData.reel_speed || currentPerformanceData?.reel?.speed),
      accelerationTime: safeNumber(backendData.accel_time || currentPerformanceData?.reel?.accelerationTime),
      coilWeight: safeNumber(backendData.coil_weight || currentPerformanceData?.reel?.coilWeight),
      coilOD: safeNumber(backendData.coil_od || currentPerformanceData?.reel?.coilOD),
      dispReelMtr: backendData.disp_reel_mtr || currentPerformanceData?.reel?.dispReelMtr || "",
      webTension: {
        ...currentPerformanceData?.reel?.webTension,
        psi: safeNumber(backendData.web_tension_psi || currentPerformanceData?.reel?.webTension?.psi),
        lbs: safeNumber(backendData.web_tension_lbs || currentPerformanceData?.reel?.webTension?.lbs),
      },
      brakePadDiameter: safeNumber(backendData.brake_pad_diameter || currentPerformanceData?.reel?.brakePadDiameter),
      cylinderBore: safeNumber(backendData.cylinder_bore || currentPerformanceData?.reel?.cylinderBore),
      coefficientOfFriction: safeNumber(backendData.coefficient_friction || currentPerformanceData?.reel?.coefficientOfFriction),
      minMaterialWidth: safeNumber(backendData.min_material_width || currentPerformanceData?.reel?.minMaterialWidth),
      torque: {
        ...currentPerformanceData?.reel?.torque,
        atMandrel: safeNumber(backendData.torque_at_mandrel || currentPerformanceData?.reel?.torque?.atMandrel),
        rewindRequired: safeNumber(backendData.rewind_torque || currentPerformanceData?.reel?.torque?.rewindRequired),
        required: safeNumber(backendData.torque_required || currentPerformanceData?.reel?.torque?.required),
        empty: {
          ...currentPerformanceData?.reel?.torque?.empty,
          torque: safeNumber(backendData.torque_empty || currentPerformanceData?.reel?.torque?.empty?.torque),
          horsepowerRequired: safeNumber(backendData.hp_reqd_empty || currentPerformanceData?.reel?.torque?.empty?.horsepowerRequired),
          regen: safeTransform(backendData.regen_empty || currentPerformanceData?.reel?.torque?.empty?.regen),
        },
        full: {
          ...currentPerformanceData?.reel?.torque?.full,
          torque: safeNumber(backendData.torque_full || currentPerformanceData?.reel?.torque?.full?.torque),
          horsepowerRequired: safeNumber(backendData.hp_reqd_full || currentPerformanceData?.reel?.torque?.full?.horsepowerRequired),
          regen: safeTransform(backendData.regen_full || currentPerformanceData?.reel?.torque?.full?.regen),
        },
      },
    },
    
    // Equipment Information
    voltageRequired: safeNumber(backendData.voltage_required || backendData.voltage || currentPerformanceData?.voltageRequired),
    equipmentSpaceLength: safeNumber(backendData.equipment_space_length || backendData.space_length || currentPerformanceData?.equipmentSpaceLength),
    equipmentSpaceWidth: safeNumber(backendData.equipment_space_width || backendData.space_width || currentPerformanceData?.equipmentSpaceWidth),
    obstructions: backendData.obstructions || currentPerformanceData?.obstructions || "",
    
    // Mounting Information
    mount: {
      ...currentPerformanceData?.mount,
      feederMountedToPress: backendData.feeder_mounted_to_press || currentPerformanceData?.mount?.feederMountedToPress || "",
      adequateSupport: backendData.adequate_support || currentPerformanceData?.mount?.adequateSupport || "",
      customMounting: backendData.custom_mounting || currentPerformanceData?.mount?.customMounting || "",
    },
    
    loopPit: backendData.loop_pit || currentPerformanceData?.loopPit || "",
    requireGuarding: backendData.require_guarding || currentPerformanceData?.requireGuarding || "",
    specialConsiderations: backendData.special_considerations || currentPerformanceData?.specialConsiderations || "",
  };
}

// Page-specific mapping functions that use the universal mapper
export function mapBackendToRFQ(backendData: any, currentData?: Partial<PerformanceData>) {
  return mapBackendToPerformanceData(backendData, currentData);
}

export function mapBackendToMaterialSpecs(backendData: any, currentData?: Partial<PerformanceData>) {
  return mapBackendToPerformanceData(backendData, currentData);
}

export function mapBackendToTDDBHD(backendData: any, currentData?: Partial<PerformanceData>) {
  return mapBackendToPerformanceData(backendData, currentData);
}

export function mapBackendToSummaryReport(backendData: any, currentData?: Partial<PerformanceData>) {
  return mapBackendToPerformanceData(backendData, currentData);
}

export function mapBackendToReelDrive(backendData: any, currentData?: Partial<PerformanceData>) {
  return mapBackendToPerformanceData(backendData, currentData);
}