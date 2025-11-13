def map_calculation_results_to_data_structure(data, calculation_results):
    """
    Map calculation results from main.py to the proper variables in the data structure.
    
    Args:
        data (dict): The original data structure
        calculation_results (dict): Results from calculations containing rfq, material_specs, etc.
    
    Returns:
        dict: Updated data structure with calculated values mapped to proper fields
    """
    
    # Create a deep copy to avoid modifying the original
    import copy
    updated_data = copy.deepcopy(data)
    
    # Helper function to safely set nested values
    def set_nested_value(obj, path, value):
        keys = path.split('.')
        for key in keys[:-1]:
            if key not in obj:
                obj[key] = {}
            obj = obj[key]
        if value is not None:
            obj[keys[-1]] = value
    
    # Helper function to safely get values from results
    def get_result_value(results_dict, key, default=None):
        if isinstance(results_dict, dict) and key in results_dict:
            return results_dict[key]
        return default
    
    # --- RFQ Mappings ---
    if 'rfq' in calculation_results and isinstance(calculation_results['rfq'], dict):
        rfq_results = calculation_results['rfq']
        
        # Average FPM - direct value from calculation
        if 'average' in rfq_results:
            avg_fpm = get_result_value(rfq_results, 'average', 0)
            set_nested_value(updated_data, 'common.feedRates.average.fpm', avg_fpm)
        
        # Min FPM - direct value from calculation
        if 'min' in rfq_results:
            min_fpm = get_result_value(rfq_results, 'min', 0)
            set_nested_value(updated_data, 'common.feedRates.min.fpm', min_fpm)
        
        # Max FPM - direct value from calculation
        if 'max' in rfq_results:
            max_fpm = get_result_value(rfq_results, 'max', 0)
            set_nested_value(updated_data, 'common.feedRates.max.fpm', max_fpm)
    
    # --- Material Specs Mappings ---
    if 'material_specs' in calculation_results and isinstance(calculation_results['material_specs'], dict):
        mat_results = calculation_results['material_specs']
        
        # Calculated Coil OD
        coil_od_calc = get_result_value(mat_results, 'coil_od_calculated', 0)
        set_nested_value(updated_data, 'materialSpecs.material.calculatedCoilOD', coil_od_calc)
        
        # Min Bend Radius
        min_bend_radius = get_result_value(mat_results, 'min_bend_radius', 0)
        set_nested_value(updated_data, 'materialSpecs.material.minBendRadius', min_bend_radius)
        
        # Min Loop Length
        min_loop_length = get_result_value(mat_results, 'min_loop_length', 0)
        set_nested_value(updated_data, 'materialSpecs.material.minLoopLength', min_loop_length)
        
        # Feed Controls (if calculated)
        feed_controls = get_result_value(mat_results, 'feed_controls', 0)
        if feed_controls:
            set_nested_value(updated_data, 'common.equipment.feed.controls', feed_controls)
        
        # Feed Model (if calculated)
        feed_model = get_result_value(mat_results, 'feed_model', 0)
        if feed_model:
            set_nested_value(updated_data, 'common.equipment.feed.model', feed_model)
    
    # --- TDDBHD Mappings ---
    if 'tddbhd' in calculation_results:
        if isinstance(calculation_results['tddbhd'], dict):
            tddbhd_results = calculation_results['tddbhd']
        else:
            # If calculation failed, set default values
            tddbhd_results = {}
        
        # Coil specifications
        set_nested_value(updated_data, 'tddbhd.coil.coilWeight', get_result_value(tddbhd_results, 'coil_weight', 0))
        set_nested_value(updated_data, 'tddbhd.coil.coilOD', get_result_value(tddbhd_results, 'coil_od', 0))
        
        # Reel specifications
        set_nested_value(updated_data, 'tddbhd.reel.dispReelMtr', get_result_value(tddbhd_results, 'disp_reel_mtr', 0))
        set_nested_value(updated_data, 'tddbhd.reel.brakePadDiameter', get_result_value(tddbhd_results, 'brake_pad_diameter', 0))
        set_nested_value(updated_data, 'tddbhd.reel.cylinderBore', get_result_value(tddbhd_results, 'cylinder_bore', 0))
        set_nested_value(updated_data, 'tddbhd.reel.minMaterialWidth', get_result_value(tddbhd_results, 'min_material_width', 0))
        
        # Web tension
        set_nested_value(updated_data, 'tddbhd.reel.webTension.psi', get_result_value(tddbhd_results, 'web_tension_psi', 0))
        set_nested_value(updated_data, 'tddbhd.reel.webTension.lbs', get_result_value(tddbhd_results, 'web_tension_lbs', 0))
        
        # Torque values
        set_nested_value(updated_data, 'tddbhd.reel.torque.atMandrel', get_result_value(tddbhd_results, 'torque_at_mandrel', 0))
        set_nested_value(updated_data, 'tddbhd.reel.torque.rewindRequired', get_result_value(tddbhd_results, 'rewind_torque_required', 0))
        set_nested_value(updated_data, 'tddbhd.reel.torque.required', get_result_value(tddbhd_results, 'torque_required', 0))
        
        # Hold down force
        set_nested_value(updated_data, 'tddbhd.reel.holddown.force.required', get_result_value(tddbhd_results, 'holddown_force_required', 0))
        set_nested_value(updated_data, 'tddbhd.reel.holddown.force.available', get_result_value(tddbhd_results, 'holddown_force_available', 0))
        
        # Drag brake
        set_nested_value(updated_data, 'tddbhd.reel.dragBrake.psiAirRequired', get_result_value(tddbhd_results, 'brake_psi_air_required', 0))
        set_nested_value(updated_data, 'tddbhd.reel.dragBrake.holdingForce', get_result_value(tddbhd_results, 'brake_holding_force', 0))
        
        # Validation checks
        set_nested_value(updated_data, 'tddbhd.reel.checks.minMaterialWidthCheck', get_result_value(tddbhd_results, 'min_material_width_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.airPressureCheck', get_result_value(tddbhd_results, 'air_pressure_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.rewindTorqueCheck', get_result_value(tddbhd_results, 'rewind_torque_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.holdDownForceCheck', get_result_value(tddbhd_results, 'holddown_force_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.brakePressCheck', get_result_value(tddbhd_results, 'brake_press_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.torqueRequiredCheck', get_result_value(tddbhd_results, 'torque_required_check', 'ERROR'))
        set_nested_value(updated_data, 'tddbhd.reel.checks.tddbhdCheck', get_result_value(tddbhd_results, 'overall_check', 'ERROR'))
    
    # --- Reel Drive Mappings ---
    if 'reel_drive' in calculation_results:
        if isinstance(calculation_results['reel_drive'], dict):
            reel_results = calculation_results['reel_drive']
        else:
            # If calculation failed, set default values
            reel_results = {}
        
        # Reel specifications
        set_nested_value(updated_data, 'reelDrive.reel.size', get_result_value(reel_results, 'reel_size', 0))
        set_nested_value(updated_data, 'reelDrive.reel.maxWidth', get_result_value(reel_results, 'max_width', 0))
        
        # Bearing specifications
        set_nested_value(updated_data, 'reelDrive.reel.bearing.distance', get_result_value(reel_results, 'bearing_distance', 0))
        set_nested_value(updated_data, 'reelDrive.reel.bearing.diameter.front', get_result_value(reel_results, 'front_bearing_diameter', 0))
        set_nested_value(updated_data, 'reelDrive.reel.bearing.diameter.rear', get_result_value(reel_results, 'rear_bearing_diameter', 0))
        
        # Mandrel specifications
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.diameter', get_result_value(reel_results, 'mandrel_diameter', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.length', get_result_value(reel_results, 'mandrel_length', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.maxRPM', get_result_value(reel_results, 'mandrel_max_rpm', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.RpmFull', get_result_value(reel_results, 'mandrel_rpm_full', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.weight', get_result_value(reel_results, 'mandrel_weight', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.inertia', get_result_value(reel_results, 'mandrel_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.reel.mandrel.reflInertia', get_result_value(reel_results, 'mandrel_refl_inertia', 0))
        
        # Backplate specifications
        set_nested_value(updated_data, 'reelDrive.reel.backplate.thickness', get_result_value(reel_results, 'backplate_thickness', 0))
        set_nested_value(updated_data, 'reelDrive.reel.backplate.weight', get_result_value(reel_results, 'backplate_weight', 0))
        set_nested_value(updated_data, 'reelDrive.reel.backplate.inertia', get_result_value(reel_results, 'backplate_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.reel.backplate.reflInertia', get_result_value(reel_results, 'backplate_refl_inertia', 0))
        
        # Coil specifications
        set_nested_value(updated_data, 'reelDrive.coil.density', get_result_value(reel_results, 'coil_density', 0))
        set_nested_value(updated_data, 'reelDrive.coil.width', get_result_value(reel_results, 'coil_width', 0))
        set_nested_value(updated_data, 'reelDrive.coil.weight', get_result_value(reel_results, 'coil_weight', 0))
        set_nested_value(updated_data, 'reelDrive.coil.inertia', get_result_value(reel_results, 'coil_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.coil.reflInertia', get_result_value(reel_results, 'coil_refl_inertia', 0))
        
        # Reducer specifications
        set_nested_value(updated_data, 'reelDrive.reel.reducer.ratio', get_result_value(reel_results, 'reducer_ratio', 0))
        set_nested_value(updated_data, 'reelDrive.reel.reducer.driving', get_result_value(reel_results, 'reducer_driving', 0))
        set_nested_value(updated_data, 'reelDrive.reel.reducer.backdriving', get_result_value(reel_results, 'reducer_backdriving', 0))
        set_nested_value(updated_data, 'reelDrive.reel.reducer.inertia', get_result_value(reel_results, 'reducer_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.reel.reducer.reflInertia', get_result_value(reel_results, 'reducer_refl_inertia', 0))
        
        # Chain specifications
        set_nested_value(updated_data, 'reelDrive.reel.chain.weight', get_result_value(reel_results, 'chain_weight', 0))
        set_nested_value(updated_data, 'reelDrive.reel.chain.inertia', get_result_value(reel_results, 'chain_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.reel.chain.reflInertia', get_result_value(reel_results, 'chain_refl_inertia', 0))
        
        # Total calculations
        set_nested_value(updated_data, 'reelDrive.reel.ratio', get_result_value(reel_results, 'total_ratio', 0))
        set_nested_value(updated_data, 'reelDrive.reel.totalReflInertia.empty', get_result_value(reel_results, 'total_refl_inertia_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.totalReflInertia.full', get_result_value(reel_results, 'total_refl_inertia_full', 0))
        
        # Motor specifications
        set_nested_value(updated_data, 'reelDrive.reel.motor.inertia', get_result_value(reel_results, 'motor_inertia', 0))
        set_nested_value(updated_data, 'reelDrive.reel.motor.rpm.full', get_result_value(reel_results, 'motor_rpm_full', 0))
        
        # Friction calculations
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.mandrel.rear', get_result_value(reel_results, 'friction_rear_bearing_mandrel', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.mandrel.front', get_result_value(reel_results, 'friction_front_bearing_mandrel', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.coil.front', get_result_value(reel_results, 'friction_front_bearing_coil', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.coil.rear', get_result_value(reel_results, 'friction_rear_bearing_coil', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.total.empty', get_result_value(reel_results, 'friction_total_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.total.full', get_result_value(reel_results, 'friction_total_full', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.refl.empty', get_result_value(reel_results, 'friction_refl_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.refl.full', get_result_value(reel_results, 'friction_refl_full', 0))
        
        # Speed and acceleration
        set_nested_value(updated_data, 'reelDrive.reel.speed', get_result_value(reel_results, 'speed', 0))
        set_nested_value(updated_data, 'reelDrive.reel.accelerationRate', get_result_value(reel_results, 'acceleration_rate', 0))
        set_nested_value(updated_data, 'reelDrive.reel.accelerationTime', get_result_value(reel_results, 'acceleration_time', 0))
        
        # Torque calculations
        set_nested_value(updated_data, 'reelDrive.reel.torque.empty.torque', get_result_value(reel_results, 'torque_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.full.torque', get_result_value(reel_results, 'torque_full', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.empty.horsepowerRequired', get_result_value(reel_results, 'hp_required_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.full.horsepowerRequired', get_result_value(reel_results, 'hp_required_full', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.empty.horsepowerCheck', get_result_value(reel_results, 'hp_check_empty', 'ERROR'))
        set_nested_value(updated_data, 'reelDrive.reel.torque.full.horsepowerCheck', get_result_value(reel_results, 'hp_check_full', 'ERROR'))
        
        # Regen calculations
        set_nested_value(updated_data, 'reelDrive.reel.torque.empty.regen', get_result_value(reel_results, 'regen_empty', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.full.regen', get_result_value(reel_results, 'regen_full', 0))
        set_nested_value(updated_data, 'reelDrive.reel.torque.empty.regenCheck', get_result_value(reel_results, 'regen_check_empty', 'ERROR'))
        set_nested_value(updated_data, 'reelDrive.reel.torque.full.regenCheck', get_result_value(reel_results, 'regen_check_full', 'ERROR'))
        
        # Motorization info
        set_nested_value(updated_data, 'reelDrive.reel.motorization.isMotorized', get_result_value(reel_results, 'is_motorized', 0))
        set_nested_value(updated_data, 'reelDrive.reel.motorization.driveHorsepower', get_result_value(reel_results, 'drive_horsepower', 0))
        set_nested_value(updated_data, 'reelDrive.reel.motorization.speed', get_result_value(reel_results, 'motorization_speed', 0))
        set_nested_value(updated_data, 'reelDrive.reel.motorization.accelRate', get_result_value(reel_results, 'motorization_accel_rate', 0))
        set_nested_value(updated_data, 'reelDrive.reel.motorization.regenRequired', get_result_value(reel_results, 'regen_required', 0))
        
        # Overall check
        set_nested_value(updated_data, 'reelDrive.reel.reelDriveOK', get_result_value(reel_results, 'reel_drive_ok', 0))
    
    # --- Str Utility Mappings ---
    if 'str_utility' in calculation_results:
        if isinstance(calculation_results['str_utility'], dict):
            str_results = calculation_results['str_utility']
        else:
            # If calculation failed, set default values
            str_results = {}
        
        # Physical parameters
        set_nested_value(updated_data, 'strUtility.straightener.centerDistance', get_result_value(str_results, 'center_distance', 0))
        set_nested_value(updated_data, 'strUtility.straightener.jackForceAvailable', get_result_value(str_results, 'jack_force_available', 0))
        set_nested_value(updated_data, 'strUtility.straightener.modulus', get_result_value(str_results, 'modulus', 0))
        set_nested_value(updated_data, 'strUtility.straightener.maxRollDepth', get_result_value(str_results, 'max_roll_depth', 0))
        
        # Roll specifications
        set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.diameter', get_result_value(str_results, 'str_roll_diameter', 0))
        set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.diameter', get_result_value(str_results, 'pinch_roll_diameter', 0))
        set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.requiredGearTorque', get_result_value(str_results, 'str_roll_required_gear_torque', 0))
        set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.ratedTorque', get_result_value(str_results, 'str_roll_rated_torque', 0))
        set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.requiredGearTorque', get_result_value(str_results, 'pinch_roll_required_gear_torque', 0))
        set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.ratedTorque', get_result_value(str_results, 'pinch_roll_rated_torque', 0))
        
        # Gear data
        set_nested_value(updated_data, 'strUtility.straightener.gear.faceWidth', get_result_value(str_results, 'gear_face_width', 0))
        set_nested_value(updated_data, 'strUtility.straightener.gear.contAngle', get_result_value(str_results, 'gear_contact_angle', 0))
        set_nested_value(updated_data, 'strUtility.straightener.gear.straightenerRoll.numberOfTeeth', get_result_value(str_results, 'str_gear_num_teeth', 0))
        set_nested_value(updated_data, 'strUtility.straightener.gear.straightenerRoll.dp', get_result_value(str_results, 'str_gear_dp', 0))
        set_nested_value(updated_data, 'strUtility.straightener.gear.pinchRoll.numberOfTeeth', get_result_value(str_results, 'pinch_gear_num_teeth', 0))
        set_nested_value(updated_data, 'strUtility.straightener.gear.pinchRoll.dp', get_result_value(str_results, 'pinch_gear_dp', 0))
        
        # Force calculations
        set_nested_value(updated_data, 'strUtility.straightener.required.force', get_result_value(str_results, 'required_force', 0))
        set_nested_value(updated_data, 'strUtility.straightener.required.horsepower', get_result_value(str_results, 'required_horsepower', 0))
        
        # Additional calculations
        set_nested_value(updated_data, 'strUtility.straightener.actualCoilWeight', get_result_value(str_results, 'actual_coil_weight', 0))
        set_nested_value(updated_data, 'strUtility.straightener.coilOD', get_result_value(str_results, 'coil_od', 0))
        set_nested_value(updated_data, 'strUtility.straightener.torque.straightener', get_result_value(str_results, 'str_torque', 0))
        set_nested_value(updated_data, 'strUtility.straightener.torque.acceleration', get_result_value(str_results, 'accel_torque', 0))
        set_nested_value(updated_data, 'strUtility.straightener.torque.brake', get_result_value(str_results, 'brake_torque', 0))
        
        # Validation checks
        set_nested_value(updated_data, 'strUtility.straightener.required.horsepowerCheck', get_result_value(str_results, 'horsepower_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.jackForceCheck', get_result_value(str_results, 'jack_force_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.backupRollsCheck', get_result_value(str_results, 'backup_rolls_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.feedRateCheck', get_result_value(str_results, 'feed_rate_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.pinchRollCheck', get_result_value(str_results, 'pinch_roll_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.strRollCheck', get_result_value(str_results, 'str_roll_check', 'ERROR'))
        set_nested_value(updated_data, 'strUtility.straightener.required.fpmCheck', get_result_value(str_results, 'fpm_check', 'ERROR'))
    
    # --- Roll Str Backbend Mappings ---
    if 'roll_str_backbend' in calculation_results:
        if isinstance(calculation_results['roll_str_backbend'], dict):
            roll_results = calculation_results['roll_str_backbend']
        else:
            # If calculation failed, set default values
            roll_results = {}
        
        # Roll configuration
        set_nested_value(updated_data, 'rollStrBackbend.rollConfiguration', get_result_value(roll_results, 'roll_configuration', 0))
        
        # Straightener specifications
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rollDiameter', get_result_value(roll_results, 'roll_diameter', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.centerDistance', get_result_value(roll_results, 'center_distance', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.jackForceAvailable', get_result_value(roll_results, 'jack_force_available', 0))
        
        # Roll depth calculations
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.depth.withMaterial', get_result_value(roll_results, 'max_roll_depth_with_material', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.depthRequired', get_result_value(roll_results, 'total_depth_required', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequired', get_result_value(roll_results, 'total_force_required', 0))
        
        # Backbend specifications
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.yieldMet', get_result_value(roll_results, 'yield_requirements_met', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil', get_result_value(roll_results, 'radius_coming_off_coil', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.offCoilAfterSpringback', get_result_value(roll_results, 'radius_off_coil_after_springback', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.bendingMomentToYield', get_result_value(roll_results, 'bending_moment_to_yield', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.oneOffCoil', get_result_value(roll_results, 'one_over_radius_off_coil', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.curveAtYield', get_result_value(roll_results, 'curve_at_yield', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.radiusAtYield', get_result_value(roll_results, 'radius_at_yield', 0))
        
        # First roller calculations
        if 'first_roller' in roll_results:
            first_roller = roll_results['first_roller']
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.height', get_result_value(first_roller, 'height', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.forceRequired', get_result_value(first_roller, 'force_required', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.numberOfYieldStrainsAtSurface', get_result_value(first_roller, 'yield_strains_at_surface', 0))
            
            # First roller up direction
            if 'up' in first_roller:
                up_data = first_roller['up']
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.resultingRadius', get_result_value(up_data, 'resulting_radius', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.curvatureDifference', get_result_value(up_data, 'curvature_difference', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMoment', get_result_value(up_data, 'bending_moment', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMomentRatio', get_result_value(up_data, 'bending_moment_ratio', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.springback', get_result_value(up_data, 'springback', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.percentOfThicknessYielded', get_result_value(up_data, 'percent_thickness_yielded', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.radiusAfterSpringback', get_result_value(up_data, 'radius_after_springback', 0))
            
            # First roller down direction
            if 'down' in first_roller:
                down_data = first_roller['down']
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.resultingRadius', get_result_value(down_data, 'resulting_radius', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.curvatureDifference', get_result_value(down_data, 'curvature_difference', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMoment', get_result_value(down_data, 'bending_moment', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMomentRatio', get_result_value(down_data, 'bending_moment_ratio', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.springback', get_result_value(down_data, 'springback', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.percentOfThicknessYielded', get_result_value(down_data, 'percent_thickness_yielded', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.radiusAfterSpringback', get_result_value(down_data, 'radius_after_springback', 0))
        
        # Middle roller calculations
        if 'middle_roller' in roll_results:
            middle_roller = roll_results['middle_roller']
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.height', get_result_value(middle_roller, 'height', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.forceRequired', get_result_value(middle_roller, 'force_required', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.numberOfYieldStrainsAtSurface', get_result_value(middle_roller, 'yield_strains_at_surface', 0))
            
            # Middle roller up direction
            if 'up' in middle_roller:
                up_data = middle_roller['up']
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.resultingRadius', get_result_value(up_data, 'resulting_radius', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.curvatureDifference', get_result_value(up_data, 'curvature_difference', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.bendingMoment', get_result_value(up_data, 'bending_moment', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.bendingMomentRatio', get_result_value(up_data, 'bending_moment_ratio', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.springback', get_result_value(up_data, 'springback', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.percentOfThicknessYielded', get_result_value(up_data, 'percent_thickness_yielded', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.up.radiusAfterSpringback', get_result_value(up_data, 'radius_after_springback', 0))
            
            # Middle roller down direction
            if 'down' in middle_roller:
                down_data = middle_roller['down']
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.resultingRadius', get_result_value(down_data, 'resulting_radius', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.curvatureDifference', get_result_value(down_data, 'curvature_difference', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.bendingMoment', get_result_value(down_data, 'bending_moment', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.bendingMomentRatio', get_result_value(down_data, 'bending_moment_ratio', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.springback', get_result_value(down_data, 'springback', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.percentOfThicknessYielded', get_result_value(down_data, 'percent_thickness_yielded', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.middle.down.radiusAfterSpringback', get_result_value(down_data, 'radius_after_springback', 0))
        
        # Last roller calculations
        if 'last_roller' in roll_results:
            last_roller = roll_results['last_roller']
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.height', get_result_value(last_roller, 'height', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.forceRequired', get_result_value(last_roller, 'force_required', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.numberOfYieldStrainsAtSurface', get_result_value(last_roller, 'yield_strains_at_surface', 0))
            
            # Last roller up direction
            if 'up' in last_roller:
                up_data = last_roller['up']
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.resultingRadius', get_result_value(up_data, 'resulting_radius', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.curvatureDifference', get_result_value(up_data, 'curvature_difference', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.bendingMoment', get_result_value(up_data, 'bending_moment', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.bendingMomentRatio', get_result_value(up_data, 'bending_moment_ratio', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.springback', get_result_value(up_data, 'springback', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.percentOfThicknessYielded', get_result_value(up_data, 'percent_thickness_yielded', 0))
                set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.last.up.radiusAfterSpringback', get_result_value(up_data, 'radius_after_springback', 0))
        
        # Validation checks
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.depthRequiredCheck', get_result_value(roll_results, 'depth_required_check', 'ERROR'))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequiredCheck', get_result_value(roll_results, 'force_required_check', 'ERROR'))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.percentYieldCheck', get_result_value(roll_results, 'percent_yield_check', 'ERROR'))
    
    # --- Feed Mappings ---
    if 'feed' in calculation_results:
        if isinstance(calculation_results['feed'], dict):
            feed_results = calculation_results['feed']
        else:
            # If calculation failed, set default values
            feed_results = {}
        
        # Motor and drive specifications
        set_nested_value(updated_data, 'feed.feed.motor', get_result_value(feed_results, 'motor', 0))
        set_nested_value(updated_data, 'feed.feed.amp', get_result_value(feed_results, 'amp', 0))
        set_nested_value(updated_data, 'feed.feed.ratio', get_result_value(feed_results, 'ratio', 0))
        set_nested_value(updated_data, 'feed.feed.maxMotorRPM', get_result_value(feed_results, 'max_motor_rpm', 0))
        set_nested_value(updated_data, 'feed.feed.motorInertia', get_result_value(feed_results, 'motor_inertia', 0))
        set_nested_value(updated_data, 'feed.feed.settleTime', get_result_value(feed_results, 'settle_time', 0))
        set_nested_value(updated_data, 'feed.feed.regen', get_result_value(feed_results, 'regen', 0))
        set_nested_value(updated_data, 'feed.feed.reflInertia', get_result_value(feed_results, 'refl_inertia', 0))
        set_nested_value(updated_data, 'feed.feed.match', get_result_value(feed_results, 'match', 0))
        set_nested_value(updated_data, 'feed.feed.materialInLoop', get_result_value(feed_results, 'material_in_loop', 0))
        
        # Torque calculations
        set_nested_value(updated_data, 'feed.feed.torque.motorPeak', get_result_value(feed_results, 'motor_peak_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.peak', get_result_value(feed_results, 'peak_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.frictional', get_result_value(feed_results, 'frictional_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.loop', get_result_value(feed_results, 'loop_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.settle', get_result_value(feed_results, 'settle_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.acceleration', get_result_value(feed_results, 'acceleration_torque', 0))
        
        # RMS torque calculations
        set_nested_value(updated_data, 'feed.feed.torque.rms.motor', get_result_value(feed_results, 'rms_motor_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle1', get_result_value(feed_results, 'rms_feed_angle1_torque', 0))
        set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle2', get_result_value(feed_results, 'rms_feed_angle2_torque', 0))
        
        # Pull-through specific
        set_nested_value(updated_data, 'feed.feed.pullThru.centerDistance', get_result_value(feed_results, 'center_distance', 0))
        set_nested_value(updated_data, 'feed.feed.pullThru.yieldStrength', get_result_value(feed_results, 'yield_strength', 0))
        set_nested_value(updated_data, 'feed.feed.pullThru.kConst', get_result_value(feed_results, 'k_const', 0))
        set_nested_value(updated_data, 'feed.feed.pullThru.straightenerRolls', get_result_value(feed_results, 'straightener_rolls', 0))
        set_nested_value(updated_data, 'feed.feed.pullThru.straightenerTorque', get_result_value(feed_results, 'straightener_torque', 0))
        set_nested_value(updated_data, 'feed.feed.pullThru.payoffMaxSpeed', get_result_value(feed_results, 'payoff_max_speed', 0))
        
        # Validation checks
        set_nested_value(updated_data, 'feed.feed.feedCheck', get_result_value(feed_results, 'feed_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.matchCheck', get_result_value(feed_results, 'match_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.torque.peakCheck', get_result_value(feed_results, 'peak_torque_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.torque.accelerationCheck', get_result_value(feed_results, 'acceleration_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.torque.rms.motorCheck', get_result_value(feed_results, 'motor_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle1Check', get_result_value(feed_results, 'feed_angle1_check', 'ERROR'))
        set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle2Check', get_result_value(feed_results, 'feed_angle2_check', 'ERROR'))
        
        # Table values (performance data)
        table_values = get_result_value(feed_results, 'table_values', 0)
        if table_values:
            set_nested_value(updated_data, 'feed.feed.tableValues', table_values)
    
    # --- Shear Mappings ---
    if 'shear' in calculation_results:
        if isinstance(calculation_results['shear'], dict):
            shear_results = calculation_results['shear']
        else:
            # Handle error case - set all calculated values to 0
            shear_results = {}
        
        # Blade specifications
        set_nested_value(updated_data, 'shear.shear.blade.angleOfBlade', get_result_value(shear_results, 'angle_of_blade', 0))
        set_nested_value(updated_data, 'shear.shear.blade.initialCut.length', get_result_value(shear_results, 'initial_cut_length', 0))
        set_nested_value(updated_data, 'shear.shear.blade.initialCut.area', get_result_value(shear_results, 'initial_cut_area', 0))
        
        # Cylinder specifications
        set_nested_value(updated_data, 'shear.shear.cylinder.minStroke.forBlade', get_result_value(shear_results, 'min_stroke_for_blade', 0))
        set_nested_value(updated_data, 'shear.shear.cylinder.minStroke.requiredForOpening', get_result_value(shear_results, 'min_stroke_required_for_opening', 0))
        set_nested_value(updated_data, 'shear.shear.cylinder.actualOpeningAboveMaxMaterial', get_result_value(shear_results, 'actual_opening_above_max_material', 0))
        
        # Hydraulic specifications
        set_nested_value(updated_data, 'shear.shear.hydraulic.cylinder.area', get_result_value(shear_results, 'hydraulic_cylinder_area', 0))
        set_nested_value(updated_data, 'shear.shear.hydraulic.cylinder.volume', get_result_value(shear_results, 'hydraulic_cylinder_volume', 0))
        set_nested_value(updated_data, 'shear.shear.hydraulic.fluidVelocity', get_result_value(shear_results, 'hydraulic_fluid_velocity', 0))
        
        # Force conclusions
        set_nested_value(updated_data, 'shear.shear.conclusions.force.perCylinder', get_result_value(shear_results, 'force_per_cylinder', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.force.totalApplied.lbs', get_result_value(shear_results, 'total_applied_force_lbs', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.force.totalApplied.tons', get_result_value(shear_results, 'total_applied_force_tons', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.force.requiredToShear', get_result_value(shear_results, 'force_required_to_shear', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.force.requiredToShearCheck', get_result_value(shear_results, 'force_required_to_shear_check', 'ERROR'))
        
        # Safety and performance
        set_nested_value(updated_data, 'shear.shear.conclusions.safetyFactor', get_result_value(shear_results, 'safety_factor', 0))
        
        # Per minute calculations
        set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.gallons.instantaneous', get_result_value(shear_results, 'gallons_per_minute_instantaneous', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.gallons.averaged', get_result_value(shear_results, 'gallons_per_minute_averaged', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.shearStrokes', get_result_value(shear_results, 'shear_strokes_per_minute', 0))
        set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.parts', get_result_value(shear_results, 'parts_per_minute', 0))
        
        # Per hour calculations
        set_nested_value(updated_data, 'shear.shear.conclusions.perHour.parts', get_result_value(shear_results, 'parts_per_hour', 0))
    
    return updated_data


# Example usage function
def process_performance_calculations(data_structure, calculation_results):
    """
    Process and map calculation results to the data structure.
    
    Args:
        data_structure (dict): Original performance sheet data structure
        calculation_results (dict): Results from main.py calculations
    
    Returns:
        dict: Updated data structure with calculated values
    """
    try:
        updated_data = map_calculation_results_to_data_structure(data_structure, calculation_results)
        return updated_data
    except Exception as e:
        print(f"Error mapping calculation results: {e}")
        return data_structure