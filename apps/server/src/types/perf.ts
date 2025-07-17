export interface PerformanceData {
  referenceNumber: string;
  customer?: string;
  customerInfo?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    contactName?: string;
    position?: string;
    phoneNumber?: string;
    email?: string;
    dealerName?: string;
    dealerSalesman?: string;
    daysPerWeek?: string;
    shiftsPerDay?: string;
  };
  dates?: {
    date?: string;
    decisionDate?: string;
    idealDeliveryDate?: string;
    earliestDeliveryDate?: string;
    latestDeliveryDate?: string;
  };
  coil?: {
    density?: string;
    weight?: string;
    maxCoilWidth?: string;
    minCoilWidth?: string;
    maxCoilOD?: string;
    coilID?: string;
    maxCoilWeight?: string;
    maxCoilHandlingCap?: string;
    slitEdge?: string;
    millEdge?: string;
    requireCoilCar?: string;
    runningOffBackplate?: string;
    requireRewinding?: string;
    changeTimeConcern?: string;
    timeChangeGoal?: string;
    loading?: string;
    inertia?: string;
    reflInertia?: string;
  };
  scenario?: {
    materialThickness?: string;
    materialDensity?: string;
    coilWidth?: string;
    materialType?: string;
    maxYieldStrength?: string;
    maxTensileStrength?: string;
    minBendRadius?: string;
    minLoopLength?: string;
    calculatedCoilOD?: string;
  };
  runningCosmeticMaterial?: string;
  brandOfFeed?: string;
  press?: {
    gapFramePress?: string;
    hydraulicPress?: string;
    obi?: string;
    servoPress?: string;
    shearDieApplication?: string;
    straightSidePress?: string;
    other?: string;
    tonnageOfPress?: string;
    strokeLength?: string;
    maxSPM?: string;
    bedWidth?: string;
    bedLength?: string;
    windowSize?: string;
    cycleTime?: string;
  };
  dies?: {
    transferDies?: string;
    progressiveDies?: string;
    blankingDies?: string;
  };
  feed?: {
    application?: string;
    model?: string;
    machineWidth?: string;
    loopPit?: string;
    fullWidthRolls?: string;
    motor?: string;
    amp?: string;
    frictionInDie?: string;
    accelerationRate?: string;
    defaultAcceleration?: string;
    chartMinLength?: string;
    lengthIncrement?: string;
    feedAngle1?: string;
    feedAngle2?: string;
    maximunVelocity?: string;
    acceleration?: string;
    ratio?: string;
    typeOfLine?: string;
    match?: string;
    reflInertia?: string;
    regen?: string;
    torque?: {
      motorPeak?: string;
      peak?: string;
      frictional?: string;
      loop?: string;
      settle?: string;
      rms?: {
        motor?: string;
        feedAngle1?: string;
        feedAngle2?: string;
      };
      acceleration?: string;
    };
    tableData?: Record<string, any>;
    pullThru?: {
      isPullThru?: string;
      straightenerRolls?: string;
      pinchRolls?: string;
      kConst?: string;
      straightenerTorque?: string;
    };
    average?: {
      length?: string;
      spm?: string;
      fpm?: string;
    };
    max?: {
      length?: string;
      spm?: string;
      fpm?: string;
    };
    min?: {
      length?: string;
      spm?: string;
      fpm?: string;
    };
    windowDegrees?: string;
    direction?: string;
    controls?: string;
    controlsLevel?: string;
    passline?: string;
    lightGuageNonMarking?: string;
    nonMarking?: string;
  };
  straightener?: {
    model?: string;
    rolls?: {
      straighteningRolls?: string;
      numberOfRolls?: string;
      backupRolls?: string;
      depth?: {
        withoutMaterial?: string;
        withMaterial?: string;
      };
      straightener?: {
        diameter?: string;
        requiredGearTorque?: string;
        ratedTorque?: string;
        check?: string;
      };
      pinch?: {
        diameter?: string;
        requiredGearTorque?: string;
        ratedTorque?: string;
        check?: string;
      };
      backbend?: {
        hiddenValue?: string;
        rollers?: {
          depthRequired?: string;
          forceRequired?: string;
          first?: any;
          middle?: any;
          last?: any;
        };
        yieldMet?: string;
        radius?: {
          comingOffCoil?: string;
          offCoilAfterSpringback?: string;
          requiredToYieldSkinOfFlatMaterial?: string;
        };
        bendingMomentToYieldSkin?: string;
      };
    };
    payoff?: string;
    width?: string;
    feedRate?: string;
    acceleration?: string;
    horsepower?: string;
    autoBrakeCompensation?: string;
    centerDistance?: string;
    jackForceAvailable?: string;
    modulus?: string;
    actualCoilWeight?: string;
    coilOD?: string;
    check?: string;
    torque?: {
      straightener?: string;
      acceleration?: string;
      brake?: string;
    };
    required?: {
      horsepower?: string;
      horsepowerCheck?: string;
      force?: string;
      ratedForce?: string;
      jackForceCheck?: string;
      backupRollsCheck?: string;
    };
    gear?: {
      faceWidth?: string;
      contAngle?: string;
      straightenerRoll?: {
        numberOfTeeth?: string;
        dp?: string;
      };
      pinchRoll?: {
        numberOfTeeth?: string;
        dp?: string;
      };
    };
  };
  reel?: {
    model?: string;
    horsepower?: string;
    width?: string;
    ratio?: string;
    reelDriveOK?: string;
    bearing?: {
      diameter?: {
        front?: string;
        rear?: string;
      };
      distance?: string;
    };
    totalReflInertia?: {
      empty?: string;
      full?: string;
    };
    mandrel?: {
      diameter?: string;
      length?: string;
      maxRPM?: string;
      RpmFull?: string;
      weight?: string;
      intertia?: string;
      reflInertia?: string;
    };
    backplate?: {
      diameter?: string;
      thickness?: string;
      weight?: string;
      inertia?: string;
      reflInertia?: string;
    };
    reducer?: {
      ratio?: string;
      efficiency?: string;
      driving?: string;
      backdriving?: string;
      inertia?: string;
      reflInertia?: string;
    };
    chain?: {
      ratio?: string;
      sprktOD?: string;
      sprktThickness?: string;
      weight?: string;
      inertia?: string;
      reflInertia?: string;
    };
    motor?: {
      inertia?: string;
      rpm?: {
        base?: string;
        full?: string;
      };
    };
    friction?: {
      bearing?: {
        mandrel?: {
          rear?: string;
          front?: string;
        };
        coil?: {
          rear?: string;
          front?: string;
        };
        total?: {
          empty?: string;
          full?: string;
        };
        refl?: {
          empty?: string;
          full?: string;
        };
      };
    };
    motorization?: {
      isMotorized?: string;
      driveHorsepower?: string;
      speed?: string;
      accelRate?: string;
      regenRequired?: string;
    };
    style?: string;
    threadingDrive?: {
      airClutch?: string;
      hydThreadingDrive?: string;
    };
    holddown?: {
      assy?: string;
      cylinderPressure?: string;
      force?: {
        required?: string;
        available?: string;
      };
    };
    dragBrake?: {
      model?: string;
      quantity?: string;
      psiAirRequired?: string;
      holdingForce?: string;
    };
    airPressureAvailable?: string;
    requiredDecelRate?: string;
    acceleration?: string;
    speed?: string;
    accelerationTime?: string;
    coilWeight?: string;
    coilOD?: string;
    dispReelMtr?: string;
    webTension?: {
      psi?: string;
      lbs?: string;
    };
    brakePadDiameter?: string;
    cylinderBore?: string;
    coefficientOfFriction?: string;
    minMaterialWidth?: string;
    torque?: {
      atMandrel?: string;
      rewindRequired?: string;
      required?: string;
      empty?: {
        torque?: string;
        horsepowerRequired?: string;
        horsepowerCheck?: string;
        regen?: string;
        regenCheck?: string;
      };
      full?: {
        torque?: string;
        horsepowerRequired?: string;
        horsepowerCheck?: string;
        regen?: string;
        regenCheck?: string;
      };
    };
  };
  shear?: {
    strength?: string;
    blade?: {
      rakeOfBladePerFoot?: string;
      overlap?: string;
      bladeOpening?: string;
      percentOfPenetration?: string;
      angleOfBlade?: string;
      initialCut?: {
        length?: string;
        area?: string;
      };
    };
    cylinder?: {
      boreSize?: string;
      rodDiameter?: string;
      stroke?: string;
      minStroke?: {
        forBlade?: string;
        requiredForOpening?: string;
      };
      actualOpeningAboveMaxMaterial?: string;
    };
    hydraulic?: {
      pressure?: string;
      cylinder?: {
        area?: string;
        volume?: string;
      };
      fluidVelocity?: string;
    };
    time?: {
      forDownwardStroke?: string;
      dwellTime?: string;
    };
    conclusions?: {
      force?: {
        perCylinder?: string;
        totalApplied?: {
          lbs?: string;
          tons?: string;
        };
        requiredToShear?: string;
      };
      safetyFactor?: string;
      perMinute?: {
        gallons?: {
          instantaneous?: string;
          averaged?: string;
        };
        shearStrokes?: string;
        parts?: string;
      };
    };
  };
  voltageRequired?: string;
  equipmentSpaceLength?: string;
  equipmentSpaceWidth?: string;
  obstructions?: string;
  mount?: {
    feederMountedToPress?: string;
    adequateSupport?: string;
    customMounting?: string;
  };
  loopPit?: string;
  requireGuarding?: string;
  specialConsiderations?: string;
}
