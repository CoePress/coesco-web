import React, { createContext, useContext, useState, ReactNode } from "react";
import { RFQFormData } from "@/hooks/performance/use-create-rfq";

// RFQ variables (flat fields)
export type PerformanceSheetState = RFQFormData & {
  // --- Material Specs versioned fields ---
  maxThick: MaterialSpecsVersion;
  atFull: MaterialSpecsVersion;
  minThick: MaterialSpecsVersion;
  atWidth: MaterialSpecsVersion;
  // --- TDDBHD fields ---
  tddbhd?: Record<string, any>;
  // --- Reel Drive fields ---
  reelDrive?: Record<string, any>;
  // --- Material Specs top-level fields ---
  controlsLevel?: string;
  typeOfLine?: string;
  feedControls?: string;
  passline?: string;
  typeOfRoll?: string;
  reelBackplate?: string;
  reelStyle?: string;
  lightGauge?: boolean;
  nonMarking?: boolean;
  // --- FPM calculated fields for RFQ ---
  avgFPM?: string;
  maxFPM?: string;
  minFPM?: string;
  // --- Additional fields from summary image ---
  straightenerModel?: string;
  straighteningRolls?: string;
  backupRolls?: string;
  payoff?: string;
  straightenerWidth?: string;
  feedRate?: string;
  acceleration?: string;
  horsepower?: string;
  application?: string;
  model?: string;
  machineWidth?: string;
  loopPit?: string;
  fullWidthRolls?: string;
  feedAngle1?: string;
  feedAngle2?: string;
  pressBedLength?: string;
  maximumVelocity?: string;
  acceleration2?: string;
  ratio?: string;
  // --- Additional fields for summary report ---
  reelModel?: string;
  reelWidth?: string;
  backplateDiameter?: string;
  reelMotorization?: string;
  singleOrDoubleEnded?: string;
  airClutch?: string;
  hydThreadingDrive?: string;
  holdDownAssy?: string;
  holdDownCylinder?: string;
  brakeModel?: string;
  brakeQuantity?: string;
  driveHorsepower?: string;
  speed?: string;
  accelRate?: string;
  regenReqd?: string;
  pullThruStraightenerRolls?: string;
  pullThruPinchRolls?: string;
};

// Versioned material specs fields for each version
export type MaterialSpecsVersion = {
  materialType: string;
  materialThickness: string;
  coilWidth: string;
  yieldStrength: string;
  materialTensile: string;
  coilID: string;
  coilOD: string;
  coilWeight: string;
  minBendRad: string;
  minLoopLength: string;
  coilODCalculated: string;
};

// Initial state for a versioned material spec
const initialMaterialSpecsVersion: MaterialSpecsVersion = {
  materialType: "",
  materialThickness: "",
  coilWidth: "",
  yieldStrength: "",
  materialTensile: "",
  coilID: "",
  coilOD: "",
  coilWeight: "",
  minBendRad: "",
  minLoopLength: "",
  coilODCalculated: "",
};

export interface RollDetail {
  height?: string;
  forceRequired?: string;
  numberOfYieldStrainsAtSurface?: string;
  up?: {
    resultingRadius?: string;
    curvatureDifference?: string;
    bendingMoment?: string;
    bendingMomentRatio?: string;
    springback?: string;
    percentOfThicknessYielded?: string;
    radiusAfterSpringback?: string;
  };
  down?: {
    resultingRadius?: string;
    curvatureDifference?: string;
    bendingMoment?: string;
    bendingMomentRatio?: string;
    springback?: string;
    percentOfThicknessYielded?: string;
    radiusAfterSpringback?: string;
  };
}

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
          first?: RollDetail;
          middle?: RollDetail;
          last?: {
            height?: string;
            forceRequired?: string;
            numberOfYieldStrainsAtSurface?: string;
            up?: {
              resultingRadius?: string;
              curvatureDifference?: string;
              bendingMoment?: string;
              bendingMomentRatio?: string;
              springback?: string;
              percentOfThicknessYielded?: string;
              radiusAfterSpringback?: string;
            };
          };
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
    model?: string;
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

// Initial state for the context
const initialState: PerformanceSheetState = {
  // --- RFQ variables (from lines 14-100 in rfq.tsx) ---
  referenceNumber: "",
  date: "",
  customer: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  contactName: "",
  position: "",
  phone: "",
  email: "",
  dealerName: "",
  dealerSalesman: "",
  daysPerWeek: "",
  shiftsPerDay: "",
  lineApplication: "Press Feed",
  typeOfLine: "Conventional",
  pullThrough: "No",
  coilWidthMin: "",
  coilWidthMax: "",
  maxCoilOD: "",
  coilID: "",
  coilWeightMax: "",
  coilHandlingMax: "",
  slitEdge: false,
  millEdge: false,
  coilCarRequired: "No",
  runOffBackplate: "No",
  requireRewinding: "No",
  cosmeticMaterial: "No",
  feedEquipment: "",
  pressType: {
    gapFrame: false,
    hydraulic: false,
    obi: false,
    servo: false,
    shearDie: false,
    straightSide: false,
    other: false,
    otherText: "",
  },
  tonnage: "",
  pressBedWidth: "",
  pressBedLength: "",
  pressStroke: "",
  windowOpening: "",
  maxSPM: "",
  dies: {
    transfer: false,
    progressive: false,
    blanking: false,
  },
  avgFeedLen: "",
  avgFeedSPM: "",
  maxFeedLen: "",
  maxFeedSPM: "",
  minFeedLen: "",
  minFeedSPM: "",
  voltage: "",
  spaceLength: "",
  spaceWidth: "",
  obstructions: "",
  mountToPress: "",
  adequateSupport: "",
  requireCabinet: "",
  needMountingPlates: "",
  passlineHeight: "",
  coilChangeConcern: "",
  coilChangeTime: "",
  downtimeReasons: "",
  feedDirection: "",
  coilLoading: "",
  safetyRequirements: "",
  decisionDate: "",
  idealDelivery: "",
  earliestDelivery: "",
  latestDelivery: "",
  specialConsiderations: "",
  // --- Material Specs versioned fields ---
  maxThick: { ...initialMaterialSpecsVersion },
  atFull: { ...initialMaterialSpecsVersion },
  minThick: { ...initialMaterialSpecsVersion },
  atWidth: { ...initialMaterialSpecsVersion },
  // --- TDDBHD fields ---
  tddbhd: {
    referenceNumber: "",
    customer: "",
    date: "",
    reel: {
      "Maximum Thick": {
        model: "",
        width: "",
        backplate: "",
        materialType: "",
        materialWidth: "",
        thickness: "",
        yieldStrength: "",
        airPressure: "",
        decelRate: "",
      },
      "Max @ Full": {
        model: "",
        width: "",
        backplate: "",
        materialType: "",
        materialWidth: "",
        thickness: "",
        yieldStrength: "",
        airPressure: "",
        decelRate: "",
      },
      "Minimum Thick": {
        model: "",
        width: "",
        backplate: "",
        materialType: "",
        materialWidth: "",
        thickness: "",
        yieldStrength: "",
        airPressure: "",
        decelRate: "",
      },
      "Max @ Width": {
        model: "",
        width: "",
        backplate: "",
        materialType: "",
        materialWidth: "",
        thickness: "",
        yieldStrength: "",
        airPressure: "",
        decelRate: "",
      },
    },
    coil: {
      "Maximum Thick": {
        weight: "",
        od: "",
        dispReel: "",
        webTensionPsi: "",
        webTensionLbs: "",
      },
      "Max @ Full": {
        weight: "",
        od: "",
        dispReel: "",
        webTensionPsi: "",
        webTensionLbs: "",
      },
      "Minimum Thick": {
        weight: "",
        od: "",
        dispReel: "",
        webTensionPsi: "",
        webTensionLbs: "",
      },
      "Max @ Width": {
        weight: "",
        od: "",
        dispReel: "",
        webTensionPsi: "",
        webTensionLbs: "",
      },
    },
    brake: {
      "Maximum Thick": { padDiameter: "", cylinderBore: "", friction: "" },
      "Max @ Full": { padDiameter: "", cylinderBore: "", friction: "" },
      "Minimum Thick": { padDiameter: "", cylinderBore: "", friction: "" },
      "Max @ Width": { padDiameter: "", cylinderBore: "", friction: "" },
    },
    threadingDrive: {
      "Maximum Thick": {
        airClutch: "",
        hydThreadingDrive: "",
        torqueAtMandrel: "",
        rewindTorque: "",
      },
      "Max @ Full": {
        airClutch: "",
        hydThreadingDrive: "",
        torqueAtMandrel: "",
        rewindTorque: "",
      },
      "Minimum Thick": {
        airClutch: "",
        hydThreadingDrive: "",
        torqueAtMandrel: "",
        rewindTorque: "",
      },
      "Max @ Width": {
        airClutch: "",
        hydThreadingDrive: "",
        torqueAtMandrel: "",
        rewindTorque: "",
      },
    },
    holdDown: {
      "Maximum Thick": {
        assy: "",
        pressure: "",
        forceRequired: "",
        forceAvailable: "",
        minWidth: "",
      },
      "Max @ Full": {
        assy: "",
        pressure: "",
        forceRequired: "",
        forceAvailable: "",
        minWidth: "",
      },
      "Minimum Thick": {
        assy: "",
        pressure: "",
        forceRequired: "",
        forceAvailable: "",
        minWidth: "",
      },
      "Max @ Width": {
        assy: "",
        pressure: "",
        forceRequired: "",
        forceAvailable: "",
        minWidth: "",
      },
    },
    cylinder: {
      "Maximum Thick": { type: "", pressure: "" },
      "Max @ Full": { type: "", pressure: "" },
      "Minimum Thick": { type: "", pressure: "" },
      "Max @ Width": { type: "", pressure: "" },
    },
    dragBrake: {
      "Maximum Thick": {
        model: "",
        quantity: "",
        torqueRequired: "",
        failsafePSI: "",
        failsafeHoldingForce: "",
      },
      "Max @ Full": {
        model: "",
        quantity: "",
        torqueRequired: "",
        failsafePSI: "",
        failsafeHoldingForce: "",
      },
      "Minimum Thick": {
        model: "",
        quantity: "",
        torqueRequired: "",
        failsafePSI: "",
        failsafeHoldingForce: "",
      },
      "Max @ Width": {
        model: "",
        quantity: "",
        torqueRequired: "",
        failsafePSI: "",
        failsafeHoldingForce: "",
      },
    },
  },
  // --- Reel Drive fields ---
  reelDrive: {},
  // --- Material Specs top-level fields ---
  controlsLevel: "",
  feedControls: "",
  passline: "",
  typeOfRoll: "",
  reelBackplate: "",
  reelStyle: "",
  lightGauge: false,
  nonMarking: false,
  // --- FPM calculated fields for RFQ ---
  avgFPM: "",
  maxFPM: "",
  minFPM: "",
  // --- Additional fields from summary image ---
  straightenerModel: "",
  straighteningRolls: "",
  backupRolls: "",
  payoff: "",
  straightenerWidth: "",
  feedRate: "",
  acceleration: "",
  horsepower: "",
  application: "",
  model: "",
  machineWidth: "",
  loopPit: "",
  fullWidthRolls: "",
  feedAngle1: "",
  feedAngle2: "",
  maximumVelocity: "",
  acceleration2: "",
  ratio: "",
  reelModel: "",
  reelWidth: "",
  backplateDiameter: "",
  reelMotorization: "",
  singleOrDoubleEnded: "",
  airClutch: "",
  hydThreadingDrive: "",
  holdDownAssy: "",
  holdDownCylinder: "",
  brakeModel: "",
  brakeQuantity: "",
  driveHorsepower: "",
  speed: "",
  accelRate: "",
  regenReqd: "",
  pullThruStraightenerRolls: "",
  pullThruPinchRolls: "",
};

interface PerformanceSheetContextType {
  performanceSheet: PerformanceSheetState;
  setPerformanceSheet: React.Dispatch<
    React.SetStateAction<PerformanceSheetState>
  >;
  updatePerformanceSheet: (updates: Partial<PerformanceSheetState>) => void;
}

const PerformanceSheetContext = createContext<
  PerformanceSheetContextType | undefined
>(undefined);

export const PerformanceSheetProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [performanceSheet, setPerformanceSheet] =
    useState<PerformanceSheetState>(initialState);

  const updatePerformanceSheet = (updates: Partial<PerformanceSheetState>) => {
    setPerformanceSheet((prev) => ({ ...prev, ...updates }));
  };

  return (
    <PerformanceSheetContext.Provider
      value={{ performanceSheet, setPerformanceSheet, updatePerformanceSheet }}>
      {children}
    </PerformanceSheetContext.Provider>
  );
};

export const usePerformanceSheet = () => {
  const ctx = useContext(PerformanceSheetContext);
  if (!ctx)
    throw new Error(
      "usePerformanceSheet must be used within a PerformanceSheetProvider"
    );
  return ctx;
};

export { initialState };
