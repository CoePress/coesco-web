import { PerformanceData } from "@/contexts/performance.context";

export type MappingConfig = {
  [backendKey: string]: string | { key: string, transform?: (val: any, backend?: any) => any }
};

export function mapBackendToFrontend<T = any>(
  backendData: any,
  mapping: MappingConfig,
  extra?: (backend: any, partial: Partial<T>) => Partial<T>
): T {
  const result: any = {};
  for (const [backendKey, frontendKeyOrObj] of Object.entries(mapping)) {
    if (backendData[backendKey] !== undefined) {
      if (typeof frontendKeyOrObj === 'string') {
        result[frontendKeyOrObj] = backendData[backendKey];
      } else {
        const { key, transform } = frontendKeyOrObj;
        result[key] = transform ? transform(backendData[backendKey], backendData) : backendData[backendKey];
      }
    }
  }
  // Allow for extra custom logic (for nested/complex fields)
  return extra ? { ...result, ...extra(backendData, result) } : result;
}

// Universal mapping function for all performance pages
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