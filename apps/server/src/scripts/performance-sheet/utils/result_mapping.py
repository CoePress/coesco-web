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
    # RFQ section is mostly input data that should be preserved, only FPM calculations are updated
    if 'rfq' in calculation_results and isinstance(calculation_results['rfq'], dict):
        rfq_results = calculation_results['rfq']
        
        # Only update calculated FPM values, preserve all other RFQ input data
        if 'average' in rfq_results:
            avg_fpm = get_result_value(rfq_results, 'average', 0)
            set_nested_value(updated_data, 'common.feedRates.average.fpm', avg_fpm)
        
        if 'min' in rfq_results:
            min_fpm = get_result_value(rfq_results, 'min', 0)
            set_nested_value(updated_data, 'common.feedRates.min.fpm', min_fpm)
        
        if 'max' in rfq_results:
            max_fpm = get_result_value(rfq_results, 'max', 0)
            set_nested_value(updated_data, 'common.feedRates.max.fpm', max_fpm)
    # Note: All other RFQ fields are preserved automatically since we use deepcopy
    
    # --- Material Specs Mappings ---
    # Material specs contains both calculated and input values, only update calculated ones
    if 'material_specs' in calculation_results and isinstance(calculation_results['material_specs'], dict):
        mat_results = calculation_results['material_specs']
        
        # Only update calculated values, preserve input material specifications
        coil_od_calc = get_result_value(mat_results, 'coil_od_calculated', 0)
        if coil_od_calc:
            set_nested_value(updated_data, 'materialSpecs.material.calculatedCoilOD', coil_od_calc)
        
        min_bend_radius = get_result_value(mat_results, 'min_bend_radius', 0)
        if min_bend_radius:
            set_nested_value(updated_data, 'materialSpecs.material.minBendRadius', min_bend_radius)
        
        min_loop_length = get_result_value(mat_results, 'min_loop_length', 0)
        if min_loop_length:
            set_nested_value(updated_data, 'materialSpecs.material.minLoopLength', min_loop_length)
        
        # Material density calculation
        material_density = get_result_value(mat_results, 'material_density', 0)
        if material_density:
            set_nested_value(updated_data, 'common.material.materialDensity', material_density)
    
    # Note: All other common section fields (customer info, material inputs, etc.) are preserved automatically
    
    # --- TDDBHD Mappings ---
    if 'tddbhd' in calculation_results:
        tddbhd_results = calculation_results['tddbhd']
        
        # Only map calculated values if we have valid results (not error)
        if isinstance(tddbhd_results, dict) and 'error' not in tddbhd_results:
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
            
            # Hold down force and pressure
            set_nested_value(updated_data, 'tddbhd.reel.holddown.force.required', get_result_value(tddbhd_results, 'holddown_force_required', 0))
            set_nested_value(updated_data, 'tddbhd.reel.holddown.force.available', get_result_value(tddbhd_results, 'holddown_force_available', 0))
            set_nested_value(updated_data, 'tddbhd.reel.holddown.cylinderPressure', get_result_value(tddbhd_results, 'holddown_pressure', 0))
            
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
        else:
            # Calculation failed - preserve original values and log error
            print(f"TDDBHD calculation failed, preserving original values: {tddbhd_results}")
    
    # --- Reel Drive Mappings ---
    if 'reel_drive' in calculation_results:
        reel_results = calculation_results['reel_drive']
        
        # Only map calculated values if we have valid results (not error)
        if isinstance(reel_results, dict) and 'error' not in reel_results:
            # Reel specifications
            if 'reel' in reel_results:
                reel_data = reel_results['reel']
                set_nested_value(updated_data, 'reelDrive.reel.size', get_result_value(reel_data, 'size', 0))
                set_nested_value(updated_data, 'reelDrive.reel.maxWidth', get_result_value(reel_data, 'max_width', 0))
                set_nested_value(updated_data, 'reelDrive.reel.bearing.distance', get_result_value(reel_data, 'brg_dist', 0))
                set_nested_value(updated_data, 'reelDrive.reel.bearing.diameter.front', get_result_value(reel_data, 'f_brg_dia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.bearing.diameter.rear', get_result_value(reel_data, 'r_brg_dia', 0))
            # Mandrel specifications
            if 'mandrel' in reel_results:
                mandrel_data = reel_results['mandrel']
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.diameter', get_result_value(mandrel_data, 'diameter', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.length', get_result_value(mandrel_data, 'length', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.maxRPM', get_result_value(mandrel_data, 'max_rpm', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.RpmFull', get_result_value(mandrel_data, 'rpm_full', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.weight', get_result_value(mandrel_data, 'weight', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.inertia', get_result_value(mandrel_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.mandrel.reflInertia', get_result_value(mandrel_data, 'refl_inert', 0))
            # Backplate specifications  
            if 'backplate' in reel_results:
                backplate_data = reel_results['backplate']
                set_nested_value(updated_data, 'reelDrive.reel.backplate.thickness', get_result_value(backplate_data, 'thickness', 0))
                set_nested_value(updated_data, 'reelDrive.reel.backplate.weight', get_result_value(backplate_data, 'weight', 0))
                set_nested_value(updated_data, 'reelDrive.reel.backplate.inertia', get_result_value(backplate_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.backplate.reflInertia', get_result_value(backplate_data, 'refl_inert', 0))
            # Coil specifications
            if 'coil' in reel_results:
                coil_data = reel_results['coil']
                set_nested_value(updated_data, 'reelDrive.coil.density', get_result_value(coil_data, 'density', 0))
                set_nested_value(updated_data, 'reelDrive.coil.width', get_result_value(coil_data, 'width', 0))
                set_nested_value(updated_data, 'reelDrive.coil.weight', get_result_value(coil_data, 'weight', 0))
                set_nested_value(updated_data, 'reelDrive.coil.inertia', get_result_value(coil_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.coil.reflInertia', get_result_value(coil_data, 'refl_inert', 0))
            # Reducer specifications
            if 'reducer' in reel_results:
                reducer_data = reel_results['reducer']
                set_nested_value(updated_data, 'reelDrive.reel.reducer.ratio', get_result_value(reducer_data, 'ratio', 0))
                set_nested_value(updated_data, 'reelDrive.reel.reducer.driving', get_result_value(reducer_data, 'driving', 0))
                set_nested_value(updated_data, 'reelDrive.reel.reducer.backdriving', get_result_value(reducer_data, 'backdriving', 0))
                set_nested_value(updated_data, 'reelDrive.reel.reducer.inertia', get_result_value(reducer_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.reducer.reflInertia', get_result_value(reducer_data, 'refl_inert', 0))
            # Chain specifications
            if 'chain' in reel_results:
                chain_data = reel_results['chain']
                set_nested_value(updated_data, 'reelDrive.reel.chain.ratio', get_result_value(chain_data, 'ratio', 0))
                set_nested_value(updated_data, 'reelDrive.reel.chain.sprktOD', get_result_value(chain_data, 'sprkt_od', 0))
                set_nested_value(updated_data, 'reelDrive.reel.chain.sprktThickness', get_result_value(chain_data, 'sprkt_thk', 0))
                set_nested_value(updated_data, 'reelDrive.reel.chain.weight', get_result_value(chain_data, 'weight', 0))
                set_nested_value(updated_data, 'reelDrive.reel.chain.inertia', get_result_value(chain_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.chain.reflInertia', get_result_value(chain_data, 'refl_inert', 0))
            # Total calculations
            if 'total' in reel_results:
                total_data = reel_results['total']
                set_nested_value(updated_data, 'reelDrive.reel.ratio', get_result_value(total_data, 'ratio', 0))
                set_nested_value(updated_data, 'reelDrive.reel.totalReflInertia.empty', get_result_value(total_data, 'total_refl_inert_empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.totalReflInertia.full', get_result_value(total_data, 'total_refl_inert_full', 0))
            
            # Motor specifications
            if 'motor' in reel_results:
                motor_data = reel_results['motor']
                set_nested_value(updated_data, 'reelDrive.reel.motor.hp', get_result_value(motor_data, 'hp', 0))
                set_nested_value(updated_data, 'reelDrive.reel.motor.inertia', get_result_value(motor_data, 'inertia', 0))
                set_nested_value(updated_data, 'reelDrive.reel.motor.rpm.base', get_result_value(motor_data, 'base_rpm', 0))
                set_nested_value(updated_data, 'reelDrive.reel.motor.rpm.full', get_result_value(motor_data, 'rpm_full', 0))
            # Friction calculations
            if 'friction' in reel_results:
                friction_data = reel_results['friction']
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.mandrel.rear', get_result_value(friction_data, 'r_brg_mand', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.mandrel.front', get_result_value(friction_data, 'f_brg_mand', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.coil.rear', get_result_value(friction_data, 'r_brg_coil', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.coil.front', get_result_value(friction_data, 'f_brg_coil', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.total.empty', get_result_value(friction_data, 'total_empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.total.full', get_result_value(friction_data, 'total_full', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.refl.empty', get_result_value(friction_data, 'refl_empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.friction.bearing.refl.full', get_result_value(friction_data, 'refl_full', 0))
            # Speed and acceleration
            if 'speed' in reel_results:
                speed_data = reel_results['speed']
                set_nested_value(updated_data, 'reelDrive.reel.speed', get_result_value(speed_data, 'speed', 0))
                set_nested_value(updated_data, 'reelDrive.reel.accelerationRate', get_result_value(speed_data, 'accel_rate', 0))
                set_nested_value(updated_data, 'reelDrive.reel.accelerationTime', get_result_value(speed_data, 'accel_time', 0))
            
            # Torque calculations
            if 'torque' in reel_results:
                torque_data = reel_results['torque']
                set_nested_value(updated_data, 'reelDrive.reel.torque.empty.torque', get_result_value(torque_data, 'empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.torque.full.torque', get_result_value(torque_data, 'full', 0))
            # HP requirements 
            if 'hp_req' in reel_results:
                hp_req_data = reel_results['hp_req']
                set_nested_value(updated_data, 'reelDrive.reel.torque.empty.horsepowerRequired', get_result_value(hp_req_data, 'empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.torque.full.horsepowerRequired', get_result_value(hp_req_data, 'full', 0))
                set_nested_value(updated_data, 'reelDrive.reel.torque.empty.horsepowerCheck', get_result_value(hp_req_data, 'status_empty', 'ERROR'))
                set_nested_value(updated_data, 'reelDrive.reel.torque.full.horsepowerCheck', get_result_value(hp_req_data, 'status_full', 'ERROR'))
            
            # Regen calculations
            if 'regen' in reel_results:
                regen_data = reel_results['regen']
                set_nested_value(updated_data, 'reelDrive.reel.torque.empty.regen', get_result_value(regen_data, 'empty', 0))
                set_nested_value(updated_data, 'reelDrive.reel.torque.full.regen', get_result_value(regen_data, 'full', 0))
                # Note: regen checks may need to be calculated separately
            # Overall check
            set_nested_value(updated_data, 'reelDrive.reel.reelDriveOK', get_result_value(reel_results, 'use_pulloff', 'ERROR'))
        else:
            # Calculation failed - preserve original values and log error
            print(f"Reel Drive calculation failed, preserving original values: {reel_results}")
    
    # --- Str Utility Mappings ---
    if 'str_utility' in calculation_results:
        str_results = calculation_results['str_utility']
        
        # CRITICAL: Preserve user input values that should not be overwritten by calculations
        # These are input values that the user enters, not calculated outputs
        original_feedRate = None
        original_horsepower = None
        original_acceleration = None
        original_payoff = None
        original_autoBrakeCompensation = None
        if 'strUtility' in data and 'straightener' in data['strUtility']:
            original_straightener = data['strUtility']['straightener']
            original_feedRate = original_straightener.get('feedRate')
            original_horsepower = original_straightener.get('horsepower') 
            original_acceleration = original_straightener.get('acceleration')
            original_payoff = original_straightener.get('payoff')
            original_autoBrakeCompensation = original_straightener.get('autoBrakeCompensation')
        
        # Only map calculated values if we have valid results (not error)
        if isinstance(str_results, dict) and 'error' not in str_results:
            # Physical parameters
            set_nested_value(updated_data, 'strUtility.straightener.centerDistance', get_result_value(str_results, 'center_dist', 0))
            set_nested_value(updated_data, 'strUtility.straightener.jackForceAvailable', get_result_value(str_results, 'jack_force_available', 0))
            set_nested_value(updated_data, 'strUtility.straightener.modulus', get_result_value(str_results, 'modulus', 0))
            set_nested_value(updated_data, 'strUtility.straightener.maxRollDepth', get_result_value(str_results, 'max_roll_depth', 0))
            
            # Roll specifications
            set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.diameter', get_result_value(str_results, 'str_roll_dia', 0))
            set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.diameter', get_result_value(str_results, 'pinch_roll_dia', 0))
            set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.requiredGearTorque', get_result_value(str_results, 'str_roll_req_torque', 0))
            set_nested_value(updated_data, 'strUtility.straightener.rolls.straightener.ratedTorque', get_result_value(str_results, 'str_roll_rated_torque', 0))
            set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.requiredGearTorque', get_result_value(str_results, 'pinch_roll_req_torque', 0))
            set_nested_value(updated_data, 'strUtility.straightener.rolls.pinch.ratedTorque', get_result_value(str_results, 'pinch_roll_rated_torque', 0))
            
            # Gear data
            set_nested_value(updated_data, 'strUtility.straightener.gear.faceWidth', get_result_value(str_results, 'face_width', 0))
            set_nested_value(updated_data, 'strUtility.straightener.gear.contAngle', get_result_value(str_results, 'cont_angle', 0))
            set_nested_value(updated_data, 'strUtility.straightener.gear.straightenerRoll.numberOfTeeth', get_result_value(str_results, 'str_roll_teeth', 0))
            set_nested_value(updated_data, 'strUtility.straightener.gear.straightenerRoll.dp', get_result_value(str_results, 'str_roll_dp', 0))
            set_nested_value(updated_data, 'strUtility.straightener.gear.pinchRoll.numberOfTeeth', get_result_value(str_results, 'pinch_roll_teeth', 0))
            set_nested_value(updated_data, 'strUtility.straightener.gear.pinchRoll.dp', get_result_value(str_results, 'pinch_roll_dp', 0))
            
            # Force calculations
            set_nested_value(updated_data, 'strUtility.straightener.required.force', get_result_value(str_results, 'required_force', 0))
            set_nested_value(updated_data, 'strUtility.straightener.required.horsepower', get_result_value(str_results, 'horsepower_required', 0))
            
            # Additional calculations
            set_nested_value(updated_data, 'strUtility.straightener.actualCoilWeight', get_result_value(str_results, 'actual_coil_weight', 0))
            set_nested_value(updated_data, 'strUtility.straightener.coilOD', get_result_value(str_results, 'coil_od', 0))
            set_nested_value(updated_data, 'strUtility.straightener.torque.straightener', get_result_value(str_results, 'str_torque', 0))
            set_nested_value(updated_data, 'strUtility.straightener.torque.acceleration', get_result_value(str_results, 'acceleration_torque', 0))
            set_nested_value(updated_data, 'strUtility.straightener.torque.brake', get_result_value(str_results, 'brake_torque', 0))
            
            # Validation checks
            set_nested_value(updated_data, 'strUtility.straightener.required.horsepowerCheck', get_result_value(str_results, 'horsepower_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.jackForceCheck', get_result_value(str_results, 'jack_force_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.backupRollsCheck', get_result_value(str_results, 'backup_rolls_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.feedRateCheck', get_result_value(str_results, 'feed_rate_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.pinchRollCheck', get_result_value(str_results, 'pinch_roll_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.strRollCheck', get_result_value(str_results, 'str_roll_check', 'ERROR'))
            set_nested_value(updated_data, 'strUtility.straightener.required.fpmCheck', get_result_value(str_results, 'fpm_check', 'ERROR'))
        else:
            # Calculation failed - preserve original values and log error
            print(f"STR calculation failed, preserving original values: {str_results}")
            
        # CRITICAL: Always restore original user input values regardless of calculation success
        # These are input fields that the user enters, not calculated output values
        if original_feedRate is not None:
            set_nested_value(updated_data, 'strUtility.straightener.feedRate', original_feedRate)
        if original_horsepower is not None:
            set_nested_value(updated_data, 'strUtility.straightener.horsepower', original_horsepower)
        if original_acceleration is not None:
            set_nested_value(updated_data, 'strUtility.straightener.acceleration', original_acceleration)
        if original_payoff is not None:
            set_nested_value(updated_data, 'strUtility.straightener.payoff', original_payoff)
        if original_autoBrakeCompensation is not None:
            set_nested_value(updated_data, 'strUtility.straightener.autoBrakeCompensation', original_autoBrakeCompensation)
    
    # --- Roll Str Backbend Mappings ---
    if 'roll_str_backbend' in calculation_results:
        if isinstance(calculation_results['roll_str_backbend'], dict):
            roll_results = calculation_results['roll_str_backbend']
        else:
            # If calculation failed, set default values
            roll_results = {}
        
        # Roll configuration
        set_nested_value(updated_data, 'rollStrBackbend.rollConfiguration', get_result_value(roll_results, 'num_str_rolls', 0))
        
        # Straightener specifications
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rollDiameter', get_result_value(roll_results, 'roll_diameter', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.centerDistance', get_result_value(roll_results, 'center_distance', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.jackForceAvailable', get_result_value(roll_results, 'jack_force_available', 0))
        
        # Roll depth calculations
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.depth.withMaterial', get_result_value(roll_results, 'max_roll_depth_with_material', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.depthRequired', get_result_value(roll_results, 'roller_depth_required', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.forceRequired', get_result_value(roll_results, 'roller_force_required', 0))
        
        # Backbend specifications
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.yieldMet', get_result_value(roll_results, 'percent_yield_check', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil', get_result_value(roll_results, 'radius_off_coil', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.offCoilAfterSpringback', get_result_value(roll_results, 'radius_off_coil_after_springback', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.bendingMomentToYield', get_result_value(roll_results, 'bending_moment_to_yield', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.oneOffCoil', get_result_value(roll_results, 'one_radius_off_coil', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.curveAtYield', get_result_value(roll_results, 'curve_at_yield', 0))
        set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.radius.radiusAtYield', get_result_value(roll_results, 'radius_at_yield', 0))
        
        # First roller calculations
        if 'first_up' in roll_results:
            first_up = roll_results['first_up']
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.height', get_result_value(first_up, 'roll_height_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.forceRequired', get_result_value(first_up, 'force_required_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.numberOfYieldStrainsAtSurface', get_result_value(first_up, 'number_of_yield_strains_first_up', 0))
            
            # First roller up direction
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.resultingRadius', get_result_value(first_up, 'res_rad_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.curvatureDifference', get_result_value(first_up, 'r_ri_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMoment', get_result_value(first_up, 'mb_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.bendingMomentRatio', get_result_value(first_up, 'mb_my_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.springback', get_result_value(first_up, 'springback_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.percentOfThicknessYielded', get_result_value(first_up, 'percent_yield_first_up', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.up.radiusAfterSpringback', get_result_value(first_up, 'radius_after_springback_first_up', 0))
        
        # First roller down direction
        if 'first_down' in roll_results:
            first_down = roll_results['first_down']
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.resultingRadius', get_result_value(first_down, 'res_rad_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.curvatureDifference', get_result_value(first_down, 'r_ri_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMoment', get_result_value(first_down, 'mb_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.bendingMomentRatio', get_result_value(first_down, 'mb_my_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.springback', get_result_value(first_down, 'springback_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.percentOfThicknessYielded', get_result_value(first_down, 'percent_yield_first_down', 0))
            set_nested_value(updated_data, 'rollStrBackbend.straightener.rolls.backbend.rollers.first.down.radiusAfterSpringback', get_result_value(first_down, 'radius_after_springback_first_down', 0))
        
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
        feed_results = calculation_results['feed']
        
        # Only map calculated values if we have valid results (not error)
        if isinstance(feed_results, dict) and 'error' not in feed_results:
            # Motor and drive specifications - only update calculated values
            set_nested_value(updated_data, 'feed.feed.ratio', get_result_value(feed_results, 'ratio', 0))
            set_nested_value(updated_data, 'feed.feed.maxMotorRPM', get_result_value(feed_results, 'max_motor_rpm', 0))
            set_nested_value(updated_data, 'feed.feed.motorInertia', get_result_value(feed_results, 'motor_inertia', 0))
            set_nested_value(updated_data, 'feed.feed.settleTime', get_result_value(feed_results, 'settle_time', 0))
            set_nested_value(updated_data, 'feed.feed.regen', get_result_value(feed_results, 'regen', 0))
            set_nested_value(updated_data, 'feed.feed.reflInertia', get_result_value(feed_results, 'refl_inertia', 0))
            set_nested_value(updated_data, 'feed.feed.match', get_result_value(feed_results, 'match', 0))
            set_nested_value(updated_data, 'feed.feed.maxVel', get_result_value(feed_results, 'max_vel', 0))
            
            # Torque calculations
            set_nested_value(updated_data, 'feed.feed.torque.motorPeak', get_result_value(feed_results, 'motor_peak_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.peak', get_result_value(feed_results, 'peak_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.frictional', get_result_value(feed_results, 'frictional_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.loop', get_result_value(feed_results, 'loop_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.settle', get_result_value(feed_results, 'settle_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.acceleration', get_result_value(feed_results, 'acceleration_torque', 0))
            
            # RMS torque calculations
            set_nested_value(updated_data, 'feed.feed.torque.rms.motor', get_result_value(feed_results, 'motor_rms_torque', 0))
            set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle1', get_result_value(feed_results, 'rms_torque_fa1', 0))
            set_nested_value(updated_data, 'feed.feed.torque.rms.feedAngle2', get_result_value(feed_results, 'rms_torque_fa2', 0))
            
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
        else:
            # Calculation failed - preserve original values and log error
            print(f"Feed calculation failed, preserving original values: {feed_results}")
    
    # --- Shear Mappings ---
    if 'shear' in calculation_results:
        shear_results = calculation_results['shear']
        
        # Only map calculated values if we have valid results (not error)
        if isinstance(shear_results, dict) and 'error' not in shear_results:
            # Blade specifications
            set_nested_value(updated_data, 'shear.shear.blade.angleOfBlade', get_result_value(shear_results, 'angle_of_blade', 0))
            set_nested_value(updated_data, 'shear.shear.blade.initialCut.length', get_result_value(shear_results, 'length_of_init_cut', 0))
            set_nested_value(updated_data, 'shear.shear.blade.initialCut.area', get_result_value(shear_results, 'area_of_cut', 0))
            
            # Cylinder specifications
            set_nested_value(updated_data, 'shear.shear.cylinder.minStroke.forBlade', get_result_value(shear_results, 'min_stroke_for_blade', 0))
            set_nested_value(updated_data, 'shear.shear.cylinder.minStroke.requiredForOpening', get_result_value(shear_results, 'min_stroke_req_for_opening', 0))
            set_nested_value(updated_data, 'shear.shear.cylinder.actualOpeningAboveMaxMaterial', get_result_value(shear_results, 'actual_opening_above_max_material', 0))
            
            # Hydraulic specifications
            set_nested_value(updated_data, 'shear.shear.hydraulic.cylinder.area', get_result_value(shear_results, 'cylinder_area', 0))
            set_nested_value(updated_data, 'shear.shear.hydraulic.cylinder.volume', get_result_value(shear_results, 'cylinder_volume', 0))
            set_nested_value(updated_data, 'shear.shear.hydraulic.fluidVelocity', get_result_value(shear_results, 'fluid_velocity', 0))
            
            # Force conclusions
            set_nested_value(updated_data, 'shear.shear.conclusions.force.perCylinder', get_result_value(shear_results, 'force_per_cylinder', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.force.totalApplied.lbs', get_result_value(shear_results, 'total_force_applied_lbs', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.force.totalApplied.tons', get_result_value(shear_results, 'total_force_applied_tons', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.force.requiredToShear', get_result_value(shear_results, 'force_req_to_shear', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.force.requiredToShearCheck', get_result_value(shear_results, 'force_req_to_shear_check', 'ERROR'))
            
            # Safety and performance
            set_nested_value(updated_data, 'shear.shear.conclusions.safetyFactor', get_result_value(shear_results, 'safety_factor', 0))
            
            # Per minute calculations
            set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.gallons.instantaneous', get_result_value(shear_results, 'instant_gallons_per_minute_req', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.gallons.averaged', get_result_value(shear_results, 'averaged_gallons_per_minute_req', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.shearStrokes', get_result_value(shear_results, 'shear_strokes_per_minute', 0))
            set_nested_value(updated_data, 'shear.shear.conclusions.perMinute.parts', get_result_value(shear_results, 'parts_per_minute', 0))
            
            # Per hour calculations
            set_nested_value(updated_data, 'shear.shear.conclusions.perHour.parts', get_result_value(shear_results, 'parts_per_hour', 0))
        else:
            # Calculation failed - preserve original values and log error
            print(f"Shear calculation failed, preserving original values: {shear_results}")
    
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