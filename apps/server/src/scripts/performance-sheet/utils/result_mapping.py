import sys

# Helper function to safely get nested values
def get_nested_value(obj, path):
    keys = path.split('.')
    for key in keys:
        if isinstance(obj, dict) and key in obj:
            obj = obj[key]
        else:
            return None
    return obj

def map_calculation_results_to_data_structure(data, calculation_results):
    """
    Map calculation results from main.py to the proper variables in the data structure.
    
    Args:
        data (dict): The orig        else:
            # Calculation failed - preserve original values and log error
            print(f"Reel Drive calculation failed, preserving original values: {reel_results}", file=sys.stderr)
    
    # --- STR Utility Mappings ---data structure
        calculation_results (dict): Results from calculations containing rfq, material_specs, etc.
    
    Returns:
        dict: Updated data structure with calculated values mapped to proper fields
    """
    
    # Create a deep copy to avoid modifying the original
    import copy
    updated_data = copy.deepcopy(data)
    
    # Helper function to safely set nested values (handles both dict keys and array indices)
    def set_nested_value(obj, path, value):
        import re
        # Split path by dots, but keep array notation intact
        keys = path.split('.')
        
        for i, key in enumerate(keys[:-1]):
            # Check if key contains array notation like "scenarios[0]"
            array_match = re.match(r'^(.+?)\[(\d+)\]$', key)
            if array_match:
                array_name = array_match.group(1)
                array_index = int(array_match.group(2))
                
                # Ensure array exists
                if array_name not in obj:
                    obj[array_name] = []
                
                # Ensure array is long enough
                while len(obj[array_name]) <= array_index:
                    obj[array_name].append({})
                
                obj = obj[array_name][array_index]
            else:
                # Regular dict key
                if key not in obj:
                    obj[key] = {}
                obj = obj[key]
        
        # Handle the final key
        final_key = keys[-1]
        array_match = re.match(r'^(.+?)\[(\d+)\]$', final_key)
        if array_match:
            array_name = array_match.group(1)
            array_index = int(array_match.group(2))
            
            if array_name not in obj:
                obj[array_name] = []
            
            while len(obj[array_name]) <= array_index:
                obj[array_name].append({})
            
            if value is not None:
                obj[array_name][array_index] = value
        else:
            if value is not None:
                obj[final_key] = value
    
    # Always populate material density if material type is available
    material_type = get_nested_value(updated_data, 'common.material.materialType')
    if material_type and isinstance(material_type, str):
        try:
            from utils.lookup_tables import get_material_density
            density = get_material_density(material_type.upper())
            set_nested_value(updated_data, 'common.material.materialDensity', density)
        except Exception as e:
            print(f"Failed to get material density for {material_type}: {e}", file=sys.stderr)
    
    # Set default acceleration rate if not present
    current_accel = get_nested_value(updated_data, 'feed.feed.accelerationRate')
    if current_accel is None or current_accel == '' or current_accel == 0:
        set_nested_value(updated_data, 'feed.feed.accelerationRate', 60)
    
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
        
        # Handle scenarios array (new format)
        if 'scenarios' in mat_results and isinstance(mat_results['scenarios'], list):
            # Initialize scenarios array in data structure if it doesn't exist
            if 'materialSpecs' not in updated_data:
                updated_data['materialSpecs'] = {}
            if 'scenarios' not in updated_data['materialSpecs']:
                updated_data['materialSpecs']['scenarios'] = []
            
            # Ensure we have enough scenario slots
            while len(updated_data['materialSpecs']['scenarios']) < len(mat_results['scenarios']):
                updated_data['materialSpecs']['scenarios'].append({})
            
            # Map each scenario's calculated values
            for idx, scenario_result in enumerate(mat_results['scenarios']):
                if isinstance(scenario_result, dict) and 'error' not in scenario_result:
                    scenario_data = updated_data['materialSpecs']['scenarios'][idx]
                    
                    min_bend_radius = get_result_value(scenario_result, 'min_bend_radius', None)
                    if min_bend_radius is not None:
                        scenario_data['minBendRadius'] = min_bend_radius
                    
                    min_loop_length = get_result_value(scenario_result, 'min_loop_length', None)
                    if min_loop_length is not None:
                        scenario_data['minLoopLength'] = min_loop_length
                    
                    coil_od_calculated = get_result_value(scenario_result, 'coil_od_calculated', None)
                    if coil_od_calculated is not None:
                        scenario_data['coilODCalculated'] = coil_od_calculated
                    
                    # Also update material density in common if available from first scenario
                    if idx == 0:
                        material_density = get_result_value(scenario_result, 'material_density', None)
                        if material_density is not None:
                            set_nested_value(updated_data, 'common.material.materialDensity', material_density)
        else:
            # Handle old single-value format (backwards compatibility)
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
        
        # Handle scenarios array (new format)
        if isinstance(tddbhd_results, dict) and 'scenarios' in tddbhd_results and isinstance(tddbhd_results['scenarios'], list):
            # Initialize scenarios array in data structure if it doesn't exist
            if 'tddbhd' not in updated_data:
                updated_data['tddbhd'] = {}
            if 'scenarios' not in updated_data['tddbhd']:
                updated_data['tddbhd']['scenarios'] = []
            
            # Ensure we have enough scenario slots
            while len(updated_data['tddbhd']['scenarios']) < len(tddbhd_results['scenarios']):
                updated_data['tddbhd']['scenarios'].append({})
            
            # Map each scenario's calculated values
            for idx, scenario_result in enumerate(tddbhd_results['scenarios']):
                if isinstance(scenario_result, dict) and 'error' not in scenario_result:
                    scenario_data = updated_data['tddbhd']['scenarios'][idx]
                    
                    # Coil specifications
                    if 'coil' not in scenario_data:
                        scenario_data['coil'] = {}
                    scenario_data['coil']['coilWeight'] = get_result_value(scenario_result, 'coil_weight', 0)
                    scenario_data['coil']['coilOD'] = get_result_value(scenario_result, 'coil_od', 0)
                    
                    # Reel specifications
                    if 'reel' not in scenario_data:
                        scenario_data['reel'] = {}
                    scenario_data['reel']['dispReelMtr'] = get_result_value(scenario_result, 'disp_reel_mtr', 0)
                    scenario_data['reel']['brakePadDiameter'] = get_result_value(scenario_result, 'brake_pad_diameter', 0)
                    scenario_data['reel']['cylinderBore'] = get_result_value(scenario_result, 'cylinder_bore', 0)
                    scenario_data['reel']['minMaterialWidth'] = get_result_value(scenario_result, 'min_material_width', 0)
                    
                    # Web tension
                    if 'webTension' not in scenario_data['reel']:
                        scenario_data['reel']['webTension'] = {}
                    scenario_data['reel']['webTension']['psi'] = get_result_value(scenario_result, 'web_tension_psi', 0)
                    scenario_data['reel']['webTension']['lbs'] = get_result_value(scenario_result, 'web_tension_lbs', 0)
                    
                    # Torque values
                    if 'torque' not in scenario_data['reel']:
                        scenario_data['reel']['torque'] = {}
                    scenario_data['reel']['torque']['atMandrel'] = get_result_value(scenario_result, 'torque_at_mandrel', 0)
                    scenario_data['reel']['torque']['rewindRequired'] = get_result_value(scenario_result, 'rewind_torque_required', 0)
                    scenario_data['reel']['torque']['required'] = get_result_value(scenario_result, 'torque_required', 0)
                    
                    # Hold down force and pressure
                    if 'holddown' not in scenario_data['reel']:
                        scenario_data['reel']['holddown'] = {'force': {}}
                    elif 'force' not in scenario_data['reel']['holddown']:
                        scenario_data['reel']['holddown']['force'] = {}
                    scenario_data['reel']['holddown']['force']['required'] = get_result_value(scenario_result, 'holddown_force_required', 0)
                    scenario_data['reel']['holddown']['force']['available'] = get_result_value(scenario_result, 'holddown_force_available', 0)
                    scenario_data['reel']['holddown']['cylinderPressure'] = get_result_value(scenario_result, 'holddown_pressure', 0)
                    
                    # Drag brake
                    if 'dragBrake' not in scenario_data['reel']:
                        scenario_data['reel']['dragBrake'] = {}
                    scenario_data['reel']['dragBrake']['psiAirRequired'] = get_result_value(scenario_result, 'brake_psi_air_required', 0)
                    scenario_data['reel']['dragBrake']['holdingForce'] = get_result_value(scenario_result, 'brake_holding_force', 0)
                    
                    # Validation checks
                    if 'checks' not in scenario_data['reel']:
                        scenario_data['reel']['checks'] = {}
                    scenario_data['reel']['checks']['minMaterialWidthCheck'] = get_result_value(scenario_result, 'min_material_width_check', 'ERROR')
                    scenario_data['reel']['checks']['airPressureCheck'] = get_result_value(scenario_result, 'air_pressure_check', 'ERROR')
                    scenario_data['reel']['checks']['rewindTorqueCheck'] = get_result_value(scenario_result, 'rewind_torque_check', 'ERROR')
                    scenario_data['reel']['checks']['holdDownForceCheck'] = get_result_value(scenario_result, 'holddown_force_check', 'ERROR')
                    scenario_data['reel']['checks']['brakePressCheck'] = get_result_value(scenario_result, 'brake_press_check', 'ERROR')
                    scenario_data['reel']['checks']['torqueRequiredCheck'] = get_result_value(scenario_result, 'torque_required_check', 'ERROR')
                    scenario_data['reel']['checks']['tddbhdCheck'] = get_result_value(scenario_result, 'overall_check', 'ERROR')
                    
                    # Preserve input fields from original data (try scenario first, then shared)
                    if 'tddbhd' in data and 'scenarios' in data['tddbhd']:
                        scenarios = data['tddbhd']['scenarios']
                        if isinstance(scenarios, list) and idx < len(scenarios) and 'reel' in scenarios[idx]:
                            orig_scenario = scenarios[idx]['reel']
                        else:
                            orig_scenario = {}
                    else:
                        orig_scenario = {}
                    
                    # Shared location fallback
                    tddbhd_shared = data.get('tddbhd', {}).get('reel', {})
                    
                    # Preserve holddown assy
                    if 'holddown' in orig_scenario and orig_scenario['holddown'].get('assy'):
                        scenario_data['reel']['holddown']['assy'] = orig_scenario['holddown']['assy']
                    elif tddbhd_shared.get('holddown', {}).get('assy'):
                        if 'holddown' not in scenario_data['reel']:
                            scenario_data['reel']['holddown'] = {}
                        scenario_data['reel']['holddown']['assy'] = tddbhd_shared['holddown']['assy']
                    
                    # Preserve drag brake model and quantity
                    if 'dragBrake' in orig_scenario:
                        if 'dragBrake' not in scenario_data['reel']:
                            scenario_data['reel']['dragBrake'] = {}
                        if orig_scenario['dragBrake'].get('model'):
                            scenario_data['reel']['dragBrake']['model'] = orig_scenario['dragBrake']['model']
                        if orig_scenario['dragBrake'].get('quantity') is not None:
                            scenario_data['reel']['dragBrake']['quantity'] = orig_scenario['dragBrake']['quantity']
                    elif tddbhd_shared.get('dragBrake'):
                        if 'dragBrake' not in scenario_data['reel']:
                            scenario_data['reel']['dragBrake'] = {}
                        if tddbhd_shared['dragBrake'].get('model'):
                            scenario_data['reel']['dragBrake']['model'] = tddbhd_shared['dragBrake']['model']
                        if tddbhd_shared['dragBrake'].get('quantity') is not None:
                            scenario_data['reel']['dragBrake']['quantity'] = tddbhd_shared['dragBrake']['quantity']
        elif isinstance(tddbhd_results, dict) and 'error' not in tddbhd_results:
            # Handle old single-value format (backwards compatibility)
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
            print(f"TDDBHD calculation failed, preserving original values: {tddbhd_results}", file=sys.stderr)
    
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
                
                # Map to motorization fields for Summary Report
                set_nested_value(updated_data, 'reelDrive.reel.motorization.speed', get_result_value(speed_data, 'speed', 0))
                set_nested_value(updated_data, 'reelDrive.reel.motorization.accelRate', get_result_value(speed_data, 'accel_rate', 0))
            
            # Motor specifications - map to motorization
            if 'motor' in reel_results:
                motor_data = reel_results['motor']
                set_nested_value(updated_data, 'reelDrive.reel.motorization.driveHorsepower', get_result_value(motor_data, 'hp', 0))
            
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
                
                # Map to motorization.regenRequired for Summary Report (check if regen is needed for either empty or full)
                empty_regen = get_result_value(regen_data, 'empty', 0)
                full_regen = get_result_value(regen_data, 'full', 0)
                regen_required = "Yes" if (empty_regen > 0 or full_regen > 0) else "No"
                set_nested_value(updated_data, 'reelDrive.reel.motorization.regenRequired', regen_required)
            # Overall check
            set_nested_value(updated_data, 'reelDrive.reel.reelDriveOK', get_result_value(reel_results, 'use_pulloff', 'ERROR'))
        else:
            # Calculation failed - preserve original values and log error
            print(f"Reel Drive calculation failed, preserving original values: {reel_results}")
    
    # --- Str Utility Mappings ---
    if 'str_utility' in calculation_results:
        str_results = calculation_results['str_utility']
        
        # STR Utility is scenario-based - loop through all scenarios
        if 'scenarios' in str_results and isinstance(str_results['scenarios'], list):
            for idx, scenario_result in enumerate(str_results['scenarios']):
                # Preserve user input values for this scenario
                original_scenario_values = {}
                if 'strUtility' in data and 'scenarios' in data['strUtility']:
                    scenarios = data['strUtility']['scenarios']
                    if isinstance(scenarios, list) and idx < len(scenarios):
                        scenario_data = scenarios[idx]
                        if 'straightener' in scenario_data:
                            original_scenario_values = {
                                'feedRate': scenario_data['straightener'].get('feedRate'),
                                'horsepower': scenario_data['straightener'].get('horsepower'),
                                'acceleration': scenario_data['straightener'].get('acceleration'),
                            }
                
                # Only map calculated values if we have valid results (not error)
                if isinstance(scenario_result, dict) and 'error' not in scenario_result:
                    # Physical parameters - map to EACH scenario (these vary per scenario based on material properties)
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.centerDistance', get_result_value(scenario_result, 'center_dist', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.jackForceAvailable', get_result_value(scenario_result, 'jack_force_available', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.modulus', get_result_value(scenario_result, 'modulus', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.maxRollDepth', get_result_value(scenario_result, 'max_roll_depth', 0))
                    
                    # Roll specifications - map to EACH scenario
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.straightener.diameter', get_result_value(scenario_result, 'str_roll_dia', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.pinch.diameter', get_result_value(scenario_result, 'pinch_roll_dia', 0))
                    
                    # Gear data - map to EACH scenario
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.faceWidth', get_result_value(scenario_result, 'face_width', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.contAngle', get_result_value(scenario_result, 'cont_angle', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.straightenerRoll.numberOfTeeth', get_result_value(scenario_result, 'str_roll_teeth', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.straightenerRoll.dp', get_result_value(scenario_result, 'str_roll_dp', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.pinchRoll.numberOfTeeth', get_result_value(scenario_result, 'pinch_roll_teeth', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.gear.pinchRoll.dp', get_result_value(scenario_result, 'pinch_roll_dp', 0))
                    
                    # Scenario-specific calculated values
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.straightener.requiredGearTorque', get_result_value(scenario_result, 'str_roll_req_torque', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.straightener.ratedTorque', get_result_value(scenario_result, 'str_roll_rated_torque', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.pinch.requiredGearTorque', get_result_value(scenario_result, 'pinch_roll_req_torque', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.rolls.pinch.ratedTorque', get_result_value(scenario_result, 'pinch_roll_rated_torque', 0))
                    
                    # Force and horsepower calculations (scenario-specific)
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.force', get_result_value(scenario_result, 'required_force', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.horsepower', get_result_value(scenario_result, 'horsepower_required', 0))
                    
                    # Additional calculations (scenario-specific)
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.actualCoilWeight', get_result_value(scenario_result, 'actual_coil_weight', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.coilOD', get_result_value(scenario_result, 'coil_od', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.torque.straightener', get_result_value(scenario_result, 'str_torque', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.torque.acceleration', get_result_value(scenario_result, 'acceleration_torque', 0))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.torque.brake', get_result_value(scenario_result, 'brake_torque', 0))
                    
                    # Validation checks (scenario-specific)
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.horsepowerCheck', get_result_value(scenario_result, 'horsepower_check', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.jackForceCheck', get_result_value(scenario_result, 'required_force_check', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.backupRollsCheck', get_result_value(scenario_result, 'backup_rolls_recommended', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.feedRateCheck', get_result_value(scenario_result, 'feed_rate_check', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.pinchRollCheck', get_result_value(scenario_result, 'pinch_roll_check', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.strRollCheck', get_result_value(scenario_result, 'str_roll_check', 'ERROR'))
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.required.fpmCheck', get_result_value(scenario_result, 'fpm_check', 'ERROR'))
                    
                    # Sync feed rate to Feed tab STR Max Speed for THIS scenario
                    # Try scenario location first, then shared location
                    feed_rate = original_scenario_values.get('feedRate')
                    if not feed_rate:
                        # Fallback to shared location
                        feed_rate = get_nested_value(data, 'strUtility.straightener.feedRate')
                    if feed_rate:
                        set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.strMaxSpeed', feed_rate)
                else:
                    # Calculation failed for this scenario - log error
                    print(f"STR Utility calculation failed for scenario {idx + 1}: {scenario_result.get('error', 'Unknown error')}", file=sys.stderr)
                
                # CRITICAL: Always restore original user input values regardless of calculation success
                # These are input fields that the user enters, not calculated output values
                if original_scenario_values.get('feedRate') is not None:
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.feedRate', original_scenario_values['feedRate'])
                if original_scenario_values.get('horsepower') is not None:
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.horsepower', original_scenario_values['horsepower'])
                if original_scenario_values.get('acceleration') is not None:
                    set_nested_value(updated_data, f'strUtility.scenarios[{idx}].straightener.acceleration', original_scenario_values['acceleration'])
                    
                # Set scenarioId
                set_nested_value(updated_data, f'strUtility.scenarios[{idx}].scenarioId', idx + 1)
        
        # Also preserve shared straightener values (payoff, autoBrakeCompensation)
        if 'strUtility' in data and 'straightener' in data['strUtility']:
            original_straightener = data['strUtility']['straightener']
            if original_straightener.get('payoff') is not None:
                set_nested_value(updated_data, 'strUtility.straightener.payoff', original_straightener['payoff'])
            if original_straightener.get('autoBrakeCompensation') is not None:
                set_nested_value(updated_data, 'strUtility.straightener.autoBrakeCompensation', original_straightener['autoBrakeCompensation'])
    
    # --- Roll Str Backbend Mappings ---
    if 'roll_str_backbend' in calculation_results:
        roll_results = calculation_results['roll_str_backbend']
        
        # Roll Str Backbend is scenario-based - loop through all scenarios
        if 'scenarios' in roll_results and isinstance(roll_results['scenarios'], list):
            for idx, scenario_result in enumerate(roll_results['scenarios']):
                # Only map calculated values if we have valid results (not error)
                if isinstance(scenario_result, dict) and 'error' not in scenario_result:
                    # Roll configuration
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].rollConfiguration', get_result_value(scenario_result, 'num_str_rolls', 0))
                    
                    # Straightener specifications (scenario-specific)
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rollDiameter', get_result_value(scenario_result, 'roll_diameter', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.centerDistance', get_result_value(scenario_result, 'center_distance', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.jackForceAvailable', get_result_value(scenario_result, 'jack_force_available', 0))
                    
                    # Also map to template field paths (these fields are referenced with different prefixes in the template)
                    set_nested_value(updated_data, 'common.equipment.straightener.rollDiameter', get_result_value(scenario_result, 'roll_diameter', 0))
                    set_nested_value(updated_data, 'strUtility.straightener.modulus', get_result_value(scenario_result, 'modules', 0))
                    set_nested_value(updated_data, 'strUtility.straightener.maxRollDepth', get_result_value(scenario_result, 'max_roll_depth_without_material', 0))
                    
                    # Roll depth calculations (scenario-specific)
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.depth.withoutMaterial', get_result_value(scenario_result, 'max_roll_depth_without_material', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.depth.withMaterial', get_result_value(scenario_result, 'max_roll_depth_with_material', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.depthRequired', get_result_value(scenario_result, 'roller_depth_required', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.forceRequired', get_result_value(scenario_result, 'roller_force_required', 0))
                    
                    # Backbend specifications
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.yieldMet', get_result_value(scenario_result, 'percent_yield_check', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.comingOffCoil', get_result_value(scenario_result, 'radius_off_coil', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.offCoilAfterSpringback', get_result_value(scenario_result, 'radius_off_coil_after_springback', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.bendingMomentToYield', get_result_value(scenario_result, 'bending_moment_to_yield', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.oneOffCoil', get_result_value(scenario_result, 'one_radius_off_coil', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.curveAtYield', get_result_value(scenario_result, 'curve_at_yield', 0))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.radius.radiusAtYield', get_result_value(scenario_result, 'radius_at_yield', 0))
                    
                    # First roller calculations
                    if 'first_up' in scenario_result:
                        first_up = scenario_result['first_up']
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.height', get_result_value(first_up, 'roll_height_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.forceRequired', get_result_value(first_up, 'force_required_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.numberOfYieldStrainsAtSurface', get_result_value(first_up, 'number_of_yield_strains_first_up', 0))
                        
                        # First roller up direction
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.resultingRadius', get_result_value(first_up, 'res_rad_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.curvatureDifference', get_result_value(first_up, 'r_ri_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.bendingMoment', get_result_value(first_up, 'mb_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.bendingMomentRatio', get_result_value(first_up, 'mb_my_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.springback', get_result_value(first_up, 'springback_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.percentOfThicknessYielded', get_result_value(first_up, 'percent_yield_first_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.up.radiusAfterSpringback', get_result_value(first_up, 'radius_after_springback_first_up', 0))
                    
                    # First roller down direction
                    if 'first_down' in scenario_result:
                        first_down = scenario_result['first_down']
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.resultingRadius', get_result_value(first_down, 'res_rad_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.curvatureDifference', get_result_value(first_down, 'r_ri_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.bendingMoment', get_result_value(first_down, 'mb_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.bendingMomentRatio', get_result_value(first_down, 'mb_my_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.springback', get_result_value(first_down, 'springback_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.percentOfThicknessYielded', get_result_value(first_down, 'percent_yield_first_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.first.down.radiusAfterSpringback', get_result_value(first_down, 'radius_after_springback_first_down', 0))
                    
                    # Middle roller calculations
                    if 'mid_up_1' in scenario_result:
                        mid_up_1 = scenario_result['mid_up_1']
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.height', get_result_value(mid_up_1, 'roll_height_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.forceRequired', get_result_value(mid_up_1, 'force_required_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.numberOfYieldStrainsAtSurface', get_result_value(mid_up_1, 'number_of_yield_strains_mid_up', 0))
                        
                        # Middle roller up direction
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.resultingRadius', get_result_value(mid_up_1, 'res_rad_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.curvatureDifference', get_result_value(mid_up_1, 'r_ri_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.bendingMoment', get_result_value(mid_up_1, 'mb_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.bendingMomentRatio', get_result_value(mid_up_1, 'mb_my_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.springback', get_result_value(mid_up_1, 'springback_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.percentOfThicknessYielded', get_result_value(mid_up_1, 'percent_yield_mid_up', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.up.radiusAfterSpringback', get_result_value(mid_up_1, 'radius_after_springback_mid_up', 0))
                    
                    # Middle roller down direction
                    if 'mid_down_1' in scenario_result:
                        mid_down_1 = scenario_result['mid_down_1']
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.resultingRadius', get_result_value(mid_down_1, 'res_rad_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.curvatureDifference', get_result_value(mid_down_1, 'r_ri_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.bendingMoment', get_result_value(mid_down_1, 'mb_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.bendingMomentRatio', get_result_value(mid_down_1, 'mb_my_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.springback', get_result_value(mid_down_1, 'springback_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.percentOfThicknessYielded', get_result_value(mid_down_1, 'percent_yield_mid_down', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.middle.down.radiusAfterSpringback', get_result_value(mid_down_1, 'radius_after_springback_mid_down', 0))
                    
                    # Last roller calculations
                    if 'last' in scenario_result:
                        last = scenario_result['last']
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.height', get_result_value(last, 'roll_height_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.forceRequired', get_result_value(last, 'force_required_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.numberOfYieldStrainsAtSurface', get_result_value(last, 'number_of_yield_strains_last', 0))
                        
                        # Last roller up direction
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.resultingRadius', get_result_value(last, 'res_rad_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.curvatureDifference', get_result_value(last, 'r_ri_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.bendingMoment', get_result_value(last, 'mb_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.bendingMomentRatio', get_result_value(last, 'mb_my_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.springback', get_result_value(last, 'springback_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.percentOfThicknessYielded', get_result_value(last, 'percent_yield_last', 0))
                        set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.last.up.radiusAfterSpringback', get_result_value(last, 'radius_after_springback_last', 0))
                    
                    # Validation checks
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.depthRequiredCheck', get_result_value(scenario_result, 'roller_depth_required_check', 'ERROR'))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.forceRequiredCheck', get_result_value(scenario_result, 'roller_force_required_check', 'ERROR'))
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].straightener.rolls.backbend.rollers.percentYieldCheck', get_result_value(scenario_result, 'percent_yield_check', 'ERROR'))
                    
                    # Set scenarioId
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].scenarioId', idx + 1)
                else:
                    # Calculation failed for this scenario
                    print(f"Roll Str Backbend calculation failed for scenario {idx + 1}: {scenario_result.get('error', 'Unknown error')}", file=sys.stderr)
                    set_nested_value(updated_data, f'rollStrBackbend.scenarios[{idx}].scenarioId', idx + 1)
    
    
    # --- Feed Mappings ---
    if 'feed' in calculation_results:
        feed_results = calculation_results['feed']
        
        # Feed is scenario-based - loop through all scenarios (typically 2)
        if 'scenarios' in feed_results and isinstance(feed_results['scenarios'], list):
            for idx, scenario_result in enumerate(feed_results['scenarios']):
                # Only map calculated values if we have valid results (not error)
                if isinstance(scenario_result, dict) and 'error' not in scenario_result:
                    # Material density - populate from material type lookup (shared, only on first scenario)
                    if idx == 0:
                        material_type = get_nested_value(updated_data, 'common.material.materialType')
                        if material_type and isinstance(material_type, str):
                            try:
                                from utils.lookup_tables import get_material_density
                                density = get_material_density(material_type.upper())
                                set_nested_value(updated_data, 'common.material.materialDensity', density)
                            except Exception as e:
                                print(f"Failed to get material density for {material_type}: {e}", file=sys.stderr)
                    
                    # Material in loop - calculated from feed results
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.materialInLoop', get_result_value(scenario_result, 'material_loop', 0))
                    
                    # Motor and amp - returned from spec lookups in feed calculation
                    motor_val = get_result_value(scenario_result, 'motor', None)
                    amp_val = get_result_value(scenario_result, 'amp', None)
                    if motor_val is not None:
                        set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.motor', motor_val)
                    if amp_val is not None:
                        set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.amp', amp_val)
                    
                    # Max velocity mapping (shared, only on first scenario)
                    if idx == 0:
                        max_velocity = get_result_value(scenario_result, 'max_vel', None)
                        if max_velocity is not None:
                            set_nested_value(updated_data, 'common.equipment.feed.maxVelocity', max_velocity)
                    
                    # Motor and drive specifications
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.ratio', get_result_value(scenario_result, 'ratio', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.maxMotorRPM', get_result_value(scenario_result, 'max_motor_rpm', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.motorInertia', get_result_value(scenario_result, 'motor_inertia', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.settleTime', get_result_value(scenario_result, 'settle_time', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.regen', get_result_value(scenario_result, 'regen', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.reflInertia', get_result_value(scenario_result, 'refl_inertia', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.match', get_result_value(scenario_result, 'match', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.maxVel', get_result_value(scenario_result, 'max_vel', 0))
                    
                    # Torque calculations
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.motorPeak', get_result_value(scenario_result, 'motor_peak_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.peak', get_result_value(scenario_result, 'peak_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.frictional', get_result_value(scenario_result, 'frictional_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.loop', get_result_value(scenario_result, 'loop_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.settle', get_result_value(scenario_result, 'settle_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.acceleration', get_result_value(scenario_result, 'acceleration_torque', 0))
                    
                    # RMS torque calculations
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.motor', get_result_value(scenario_result, 'motor_rms_torque', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.feedAngle1', get_result_value(scenario_result, 'rms_torque_fa1', 0))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.feedAngle2', get_result_value(scenario_result, 'rms_torque_fa2', 0))
                    
                    # NOTE: Pull-through fields (centerDistance, yieldStrength, etc.) are INPUT fields
                    # They are preserved below from user data (not calculated)
                    
                    # Validation checks
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.feedCheck', get_result_value(scenario_result, 'feed_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.matchCheck', get_result_value(scenario_result, 'match_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.peakCheck', get_result_value(scenario_result, 'peak_torque_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.accelerationCheck', get_result_value(scenario_result, 'acceleration_torque_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.motorCheck', get_result_value(scenario_result, 'motor_rms_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.feedAngle1Check', get_result_value(scenario_result, 'rms_torque_fa1_check', 'ERROR'))
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.torque.rms.feedAngle2Check', get_result_value(scenario_result, 'rms_torque_fa2_check', 'ERROR'))
                    
                    # Table values (performance data)
                    table_values = get_result_value(scenario_result, 'table_values', None)
                    if table_values:
                        set_nested_value(updated_data, f'feed.scenarios[{idx}].feed.tableValues', table_values)
                    
                    # Set scenarioId
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].scenarioId', idx + 1)
                    
                    # Preserve ALL input field values from ORIGINAL data (try scenario location first, fall back to shared location)
                    # NOTE: motor and amp are OUTPUT fields (from spec lookups), mapped above
                    # NOTE: feedAngle1 and feedAngle2 are NOT preserved here because:
                    #   - Template uses shared path (feed.feed.feedAngle*)  
                    #   - Frontend transforms to scenario path (feed.scenarios[X].feed.feedAngle*)
                    #   - Backend reads from scenario path correctly
                    #   - If we preserve from shared (fallback), it overwrites user's scenario-specific value
                    #   - Frontend handles keeping dropdown state, backend should NOT overwrite it
                    # Input fields are user-entered values that must be preserved from original incoming data
                    input_fields = {
                        'frictionInDie': None,
                        'accelerationRate': None,
                        'chartMinLength': None,
                        'lengthIncrement': None,
                        # feedAngle1 and feedAngle2 removed - frontend manages these via scenario transformation
                        'pullThru.centerDistance': None,
                        'pullThru.yieldStrength': None,
                        'pullThru.kConst': None,
                        'pullThru.straightenerRolls': None,
                        'pullThru.straightenerTorque': None,
                        'pullThru.payoffMaxSpeed': None
                    }
                    
                    for field_path, _ in input_fields.items():
                        scenario_path = f'feed.scenarios[{idx}].feed.{field_path}'
                        shared_path = f'feed.feed.{field_path}'
                        
                        # Read from ORIGINAL data (not updated_data which is being built)
                        # Try scenario location first in original data
                        scenario_value = get_nested_value(data, scenario_path)
                        
                        # If not in scenario, try shared location in original data
                        if scenario_value is None:
                            scenario_value = get_nested_value(data, shared_path)
                        
                        # Set to updated_data if we found a value
                        if scenario_value is not None:
                            set_nested_value(updated_data, scenario_path, scenario_value)
                    

                else:
                    # Calculation failed for this scenario
                    print(f"Feed calculation failed for scenario {idx + 1}: {scenario_result.get('error', 'Unknown error')}", file=sys.stderr)
                    set_nested_value(updated_data, f'feed.scenarios[{idx}].scenarioId', idx + 1)
    
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
            print(f"Shear calculation failed, preserving original values: {shear_results}", file=sys.stderr)
    
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
        print(f"Error mapping calculation results: {e}", file=sys.stderr)
        return data_structure