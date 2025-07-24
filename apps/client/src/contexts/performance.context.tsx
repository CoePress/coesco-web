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
  height?: number;
  forceRequired?: number;
  numberOfYieldStrainsAtSurface?: number;
  up?: {
    resultingRadius?: number;
    curvatureDifference?: number;
    bendingMoment?: number;
    bendingMomentRatio?: number;
    springback?: number;
    percentOfThicknessYielded?: number;
    radiusAfterSpringback?: number;
  };
  down?: {
    resultingRadius?: number;
    curvatureDifference?: number;
    bendingMoment?: number;
    bendingMomentRatio?: number;
    springback?: number;
    percentOfThicknessYielded?: number;
    radiusAfterSpringback?: number;
  };
}

export interface PerformanceData {
  referenceNumber: string;
  customer?: string;
  customerInfo?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: number;
    country?: string;
    contactName?: string;
    position?: string;
    phoneNumber?: string;
    email?: string;
    dealerName?: string;
    dealerSalesman?: string;
    daysPerWeek?: number;
    shiftsPerDay?: number;
  };
  dates?: {
    date?: string;
    decisionDate?: string;
    idealDeliveryDate?: string;
    earliestDeliveryDate?: string;
    latestDeliveryDate?: string;
  };
  coil?: {
    density?: number;
    weight?: number;
    maxCoilWidth?: number;
    minCoilWidth?: number;
    maxCoilOD?: number;
    coilID?: number;
    maxCoilWeight?: number;
    maxCoilHandlingCap?: number;
    slitEdge?: string;
    millEdge?: string;
    requireCoilCar?: string;
    runningOffBackplate?: string;
    requireRewinding?: string;
    changeTimeConcern?: string;
    timeChangeGoal?: string;
    loading?: string;
    inertia?: number;
    reflInertia?: number;
  };
  material?: {
    materialThickness?: number;
    materialDensity?: number;
    coilWidth?: number;
    materialType?: string;
    maxYieldStrength?: number;
    maxTensileStrength?: number;
    minBendRadius?: number;
    minLoopLength?: number;
    calculatedCoilOD?: number;
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
    machineWidth?: number;
    loopPit?: string;
    fullWidthRolls?: string;
    motor?: string;
    amp?: string;
    frictionInDie?: number;
    accelerationRate?: number;
    defaultAcceleration?: number;
    chartMinLength?: number;
    lengthIncrement?: number;
    feedAngle1?: number;
    feedAngle2?: number;
    maximumVelocity?: number;
    acceleration?: number;
    ratio?: string;
    typeOfLine?: string;
    match?: number;
    reflInertia?: number;
    regen?: number;
    torque?: {
      motorPeak?: number;
      peak?: number;
      frictional?: number;
      loop?: number;
      settle?: number;
      rms?: {
        motor?: number;
        feedAngle1?: number;
        feedAngle2?: number;
      };
      acceleration?: number;
    };
    tableData?: Record<number, any>;
    pullThru?: {
      isPullThru?: string;
      straightenerRolls?: number;
      pinchRolls?: string;
      kConst?: number;
      straightenerTorque?: number;
    };
    average?: {
      length?: number;
      spm?: number;
      fpm?: number;
    };
    max?: {
      length?: number;
      spm?: number;
      fpm?: number;
    };
    min?: {
      length?: number;
      spm?: number;
      fpm?: number;
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
      typeOfRoll?: string;
      straighteningRolls?: number;
      numberOfRolls?: number;
      backupRolls?: string;
      depth?: {
        withoutMaterial?: number;
        withMaterial?: number;
      };
      straightener?: {
        diameter?: number;
        requiredGearTorque?: number;
        ratedTorque?: number;
        check?: string;
      };
      pinch?: {
        diameter?: number;
        requiredGearTorque?: number;
        ratedTorque?: number;
        check?: string;
      };
      backbend?: {
        hiddenValue?: number;
        rollers?: {
          depthRequired?: number;
          forceRequired?: number;
          first?: RollDetail;
          middle?: RollDetail;
          last?: {
            height?: number;
            forceRequired?: number;
            numberOfYieldStrainsAtSurface?: number;
            up?: {
              resultingRadius?: number;
              curvatureDifference?: number;
              bendingMoment?: number;
              bendingMomentRatio?: number;
              springback?: number;
              percentOfThicknessYielded?: number;
              radiusAfterSpringback?: number;
            };
          };
        };
        yieldMet?: string;
        radius?: {
          comingOffCoil?: number;
          offCoilAfterSpringback?: number;
          requiredToYieldSkinOfFlatMaterial?: number;
        };
        bendingMomentToYieldSkin?: number;
      };
    };
    payoff?: string;
    width?: number;
    feedRate?: number;
    acceleration?: number;
    horsepower?: number;
    autoBrakeCompensation?: string;
    rollDiameter?: number;
    centerDistance?: number;
    jackForceAvailable?: number;
    modulus?: number;
    actualCoilWeight?: number;
    coilOD?: number;
    check?: number;
    torque?: {
      straightener?: number;
      acceleration?: number;
      brake?: number;
    };
    required?: {
      horsepower?: number;
      horsepowerCheck?: string;
      force?: number;
      ratedForce?: number;
      jackForceCheck?: string;
      backupRollsCheck?: string;
    };
    gear?: {
      faceWidth?: number;
      contAngle?: number;
      straightenerRoll?: {
        numberOfTeeth?: number;
        dp?: number;
      };
      pinchRoll?: {
        numberOfTeeth?: number;
        dp?: number;
      };
    };
  };
  reel?: {
    model?: string;
    horsepower?: number;
    width?: number;
    ratio?: string;
    reelDriveOK?: string;
    bearing?: {
      diameter?: {
        front?: number;
        rear?: number;
      };
      distance?: number;
    };
    totalReflInertia?: {
      empty?: number;
      full?: number;
    };
    mandrel?: {
      diameter?: number;
      length?: number;
      maxRPM?: number;
      RpmFull?: number;
      weight?: number;
      inertia?: number;
      reflInertia?: number;
    };
    backplate?: {
      type?: string;
      diameter?: number;
      thickness?: number;
      weight?: number;
      inertia?: number;
      reflInertia?: number;
    };
    reducer?: {
      ratio?: number;
      efficiency?: number;
      driving?: number;
      backdriving?: number;
      inertia?: number;
      reflInertia?: number;
    };
    chain?: {
      ratio?: number;
      sprktOD?: number;
      sprktThickness?: number;
      weight?: number;
      inertia?: number;
      reflInertia?: number;
    };
    motor?: {
      inertia?: number;
      rpm?: {
        base?: number;
        full?: number;
      };
    };
    friction?: {
      bearing?: {
        mandrel?: {
          rear?: number;
          front?: number;
        };
        coil?: {
          rear?: number;
          front?: number;
        };
        total?: {
          empty?: number;
          full?: number;
        };
        refl?: {
          empty?: number;
          full?: number;
        };
      };
    };
    motorization?: {
      isMotorized?: string;
      driveHorsepower?: number;
      speed?: number;
      accelRate?: number;
      regenRequired?: string;
    };
    style?: string;
    threadingDrive?: {
      airClutch?: string;
      hydThreadingDrive?: string;
    };
    holddown?: {
      assy?: string;
      cylinder?: string;
      cylinderPressure?: number;
      force?: {
        required?: number;
        available?: number;
      };
    };
    dragBrake?: {
      model?: string;
      quantity?: number;
      psiAirRequired?: number;
      holdingForce?: number;
    };
    airPressureAvailable?: number;
    requiredDecelRate?: number;
    acceleration?: number;
    speed?: number;
    accelerationTime?: number;
    coilWeight?: number;
    coilOD?: number;
    dispReelMtr?: string;
    webTension?: {
      psi?: number;
      lbs?: number;
    };
    brakePadDiameter?: number;
    cylinderBore?: number;
    coefficientOfFriction?: number;
    minMaterialWidth?: number;
    torque?: {
      atMandrel?: number;
      rewindRequired?: number;
      required?: number;
      empty?: {
        torque?: number;
        horsepowerRequired?: number;
        horsepowerCheck?: string;
        regen?: string;
        regenCheck?: string;
      };
      full?: {
        torque?: number;
        horsepowerRequired?: number;
        horsepowerCheck?: string;
        regen?: string;
        regenCheck?: string;
      };
    };
  };
  shear?: {
    model?: string;
    strength?: number;
    blade?: {
      rakeOfBladePerFoot?: number;
      overlap?: number;
      bladeOpening?: number;
      percentOfPenetration?: number;
      angleOfBlade?: number;
      initialCut?: {
        length?: number;
        area?: number;
      };
    };
    cylinder?: {
      boreSize?: number;
      rodDiameter?: number;
      stroke?: number;
      minStroke?: {
        forBlade?: number;
        requiredForOpening?: number;
      };
      actualOpeningAboveMaxMaterial?: number;
    };
    hydraulic?: {
      pressure?: number;
      cylinder?: {
        area?: number;
        volume?: number;
      };
      fluidVelocity?: number;
    };
    time?: {
      forDownwardStroke?: number;
      dwellTime?: number;
    };
    conclusions?: {
      force?: {
        perCylinder?: number;
        totalApplied?: {
          lbs?: number;
          tons?: number;
        };
        requiredToShear?: number;
      };
      safetyFactor?: number;
      perMinute?: {
        gallons?: {
          instantaneous?: number;
          averaged?: number;
        };
        shearStrokes?: number;
        parts?: number;
      };
    };
  };
  voltageRequired?: number;
  equipmentSpaceLength?: number;
  equipmentSpaceWidth?: number;
  obstructions?: string;
  mount?: {
    feederMountedToPress?: string;
    adequateSupport?: string;
    customMounting?: string;
  };
  loopPit?: string;
  requireGuarding?: string;
  specialConsiderations?: string;
};

// Initial state for PerformanceData
const initialPerformanceData: PerformanceData = {
  referenceNumber: "",
  customer: "",
  customerInfo: {
    streetAddress: "",
    city: "",
    state: "",
    zip: 0,
    country: "",
    contactName: "",
    position: "",
    phoneNumber: "",
    email: "",
    dealerName: "",
    dealerSalesman: "",
    daysPerWeek: 0,
    shiftsPerDay: 0,
  },
  dates: {
    date: "",
    decisionDate: "",
    idealDeliveryDate: "",
    earliestDeliveryDate: "",
    latestDeliveryDate: "",
  },
  coil: {
    density: 0,
    weight: 0,
    maxCoilWidth: 0,
    minCoilWidth: 0,
    maxCoilOD: 0,
    coilID: 0,
    maxCoilWeight: 0,
    maxCoilHandlingCap: 0,
    slitEdge: "",
    millEdge: "",
    requireCoilCar: "",
    runningOffBackplate: "",
    requireRewinding: "",
    changeTimeConcern: "",
    timeChangeGoal: "",
    loading: "",
    inertia: 0,
    reflInertia: 0,
  },
  material: {
    materialThickness: 0,
    materialDensity: 0,
    coilWidth: 0,
    materialType: "",
    maxYieldStrength: 0,
    maxTensileStrength: 0,
    minBendRadius: 0,
    minLoopLength: 0,
    calculatedCoilOD: 0,
  },
  runningCosmeticMaterial: "",
  brandOfFeed: "",
  press: {
    gapFramePress: "",
    hydraulicPress: "",
    obi: "",
    servoPress: "",
    shearDieApplication: "",
    straightSidePress: "",
    other: "",
    tonnageOfPress: "",
    strokeLength: "",
    maxSPM: "",
    bedWidth: "",
    bedLength: "",
    windowSize: "",
    cycleTime: "",
  },
  dies: {
    transferDies: "",
    progressiveDies: "",
    blankingDies: "",
  },
  feed: {
    application: "",
    model: "",
    machineWidth: 0,
    loopPit: "",
    fullWidthRolls: "",
    motor: "",
    amp: "",
    frictionInDie: 0,
    accelerationRate: 0,
    defaultAcceleration: 0,
    chartMinLength: 0,
    lengthIncrement: 0,
    feedAngle1: 0,
    feedAngle2: 0,
    maximumVelocity: 0,
    acceleration: 0,
    ratio: "",
    typeOfLine: "",
    match: 0,
    reflInertia: 0,
    regen: 0,
    torque: {
      motorPeak: 0,
      peak: 0,
      frictional: 0,
      loop: 0,
      settle: 0,
      rms: {
        motor: 0,
        feedAngle1: 0,
        feedAngle2: 0,
      },
      acceleration: 0,
    },
    tableData: {},
    pullThru: {
      isPullThru: "",
      straightenerRolls: 0,
      pinchRolls: "",
      kConst: 0,
      straightenerTorque: 0,
    },
    average: {
      length: 0,
      spm: 0,
      fpm: 0,
    },
    max: {
      length: 0,
      spm: 0,
      fpm: 0,
    },
    min: {
      length: 0,
      spm: 0,
      fpm: 0,
    },
    windowDegrees: "",
    direction: "",
    controls: "",
    controlsLevel: "",
    passline: "",
    lightGuageNonMarking: "",
    nonMarking: "",
  },
  straightener: {
    model: "",
    rolls: {
      straighteningRolls: 0,
      numberOfRolls: 0,
      backupRolls: "",
      depth: {
        withoutMaterial: 0,
        withMaterial: 0,
      },
      straightener: {
        diameter: 0,
        requiredGearTorque: 0,
        ratedTorque: 0,
        check: "",
      },
      pinch: {
        diameter: 0,
        requiredGearTorque: 0,
        ratedTorque: 0,
        check: "",
      },
      backbend: {
        hiddenValue: 0,
        rollers: {
          depthRequired: 0,
          forceRequired: 0,
          first: {
            height: 0,
            forceRequired: 0,
            numberOfYieldStrainsAtSurface: 0,
            up: {
              resultingRadius: 0,
              curvatureDifference: 0,
              bendingMoment: 0,
              bendingMomentRatio: 0,
              springback: 0,
              percentOfThicknessYielded: 0,
              radiusAfterSpringback: 0,
            },
            down: {
              resultingRadius: 0,
              curvatureDifference: 0,
              bendingMoment: 0,
              bendingMomentRatio: 0,
              springback: 0,
              percentOfThicknessYielded: 0,
              radiusAfterSpringback: 0,
            },
          },
          middle: {
            height: 0,
            forceRequired: 0,
            numberOfYieldStrainsAtSurface: 0,
            up: {
              resultingRadius: 0,
              curvatureDifference: 0,
              bendingMoment: 0,
              bendingMomentRatio: 0,
              springback: 0,
              percentOfThicknessYielded: 0,
              radiusAfterSpringback: 0,
            },
            down: {
              resultingRadius: 0,
              curvatureDifference: 0,
              bendingMoment: 0,
              bendingMomentRatio: 0,
              springback: 0,
              percentOfThicknessYielded: 0,
              radiusAfterSpringback: 0,
            },
          },
          last: {
            height: 0,
            forceRequired: 0,
            numberOfYieldStrainsAtSurface: 0,
            up: {
              resultingRadius: 0,
              curvatureDifference: 0,
              bendingMoment: 0,
              bendingMomentRatio: 0,
              springback: 0,
              percentOfThicknessYielded: 0,
              radiusAfterSpringback: 0,
            },
          },
        },
        yieldMet: "",
        radius: {
          comingOffCoil: 0,
          offCoilAfterSpringback: 0,
          requiredToYieldSkinOfFlatMaterial: 0,
        },
        bendingMomentToYieldSkin: 0,
      },
    },
    payoff: "",
    width: 0,
    feedRate: 0,
    acceleration: 0,
    horsepower: 0,
    autoBrakeCompensation: "",
    rollDiameter: 0,
    centerDistance: 0,
    jackForceAvailable: 0,
    modulus: 0,
    actualCoilWeight: 0,
    coilOD: 0,
    check: 0,
    torque: {
      straightener: 0,
      acceleration: 0,
      brake: 0,
    },
    required: {
      horsepower: 0,
      horsepowerCheck: "",
      force: 0,
      ratedForce: 0,
      jackForceCheck: "",
      backupRollsCheck: "",
    },
    gear: {
      faceWidth: 0,
      contAngle: 0,
      straightenerRoll: {
        numberOfTeeth: 0,
        dp: 0,
      },
      pinchRoll: {
        numberOfTeeth: 0,
        dp: 0,
      },
    },
  },
  reel: {
    model: "",
    horsepower: 0,
    width: 0,
    ratio: "",
    reelDriveOK: "",
    bearing: {
      diameter: {
        front: 0,
        rear: 0,
      },
      distance: 0,
    },
    totalReflInertia: {
      empty: 0,
      full: 0,
    },
    mandrel: {
      diameter: 0,
      length: 0,
      maxRPM: 0,
      RpmFull: 0,
      weight: 0,
      inertia: 0,
      reflInertia: 0,
    },
    backplate: {
      type: "",
      diameter: 0,
      thickness: 0,
      weight: 0,
      inertia: 0,
      reflInertia: 0,
    },
    reducer: {
      ratio: 0,
      efficiency: 0,
      driving: 0,
      backdriving: 0,
      inertia: 0,
      reflInertia: 0,
    },
    chain: {
      ratio: 0,
      sprktOD: 0,
      sprktThickness: 0,
      weight: 0,
      inertia: 0,
      reflInertia: 0,
    },
    motor: {
      inertia: 0,
      rpm: {
        base: 0,
        full: 0,
      },
    },
    friction: {
      bearing: {
        mandrel: {
          rear: 0,
          front: 0,
        },
        coil: {
          rear: 0,
          front: 0,
        },
        total: {
          empty: 0,
          full: 0,
        },
        refl: {
          empty: 0,
          full: 0,
        },
      },
    },
    motorization: {
      isMotorized: "",
      driveHorsepower: 0,
      speed: 0,
      accelRate: 0,
      regenRequired: "",
    },
    style: "",
    threadingDrive: {
      airClutch: "",
      hydThreadingDrive: "",
    },
    holddown: {
      assy: "",
      cylinder: "",
      cylinderPressure: 0,
      force: {
        required: 0,
        available: 0,
      },
    },
    dragBrake: {
      model: "",
      quantity: 0,
      psiAirRequired: 0,
      holdingForce: 0,
    },
    airPressureAvailable: 0,
    requiredDecelRate: 0,
    acceleration: 0,
    speed: 0,
    accelerationTime: 0,
    coilWeight: 0,
    coilOD: 0,
    dispReelMtr: "",
    webTension: {
      psi: 0,
      lbs: 0,
    },
    brakePadDiameter: 0,
    cylinderBore: 0,
    coefficientOfFriction: 0,
    minMaterialWidth: 0,
    torque: {
      atMandrel: 0,
      rewindRequired: 0,
      required: 0,
      empty: {
        torque: 0,
        horsepowerRequired: 0,
        horsepowerCheck: "",
        regen: "",
        regenCheck: "",
      },
      full: {
        torque: 0,
        horsepowerRequired: 0,
        horsepowerCheck: "",
        regen: "",
        regenCheck: "",
      },
    },
  },
  shear: {
    model: "",
    strength: 0,
    blade: {
      rakeOfBladePerFoot: 0,
      overlap: 0,
      bladeOpening: 0,
      percentOfPenetration: 0,
      angleOfBlade: 0,
      initialCut: {
        length: 0,
        area: 0,
      },
    },
    cylinder: {
      boreSize: 0,
      rodDiameter: 0,
      stroke: 0,
      minStroke: {
        forBlade: 0,
        requiredForOpening: 0,
      },
      actualOpeningAboveMaxMaterial: 0,
    },
    hydraulic: {
      pressure: 0,
      cylinder: {
        area: 0,
        volume: 0,
      },
      fluidVelocity: 0,
    },
    time: {
      forDownwardStroke: 0,
      dwellTime: 0,
    },
    conclusions: {
      force: {
        perCylinder: 0,
        totalApplied: {
          lbs: 0,
          tons: 0,
        },
        requiredToShear: 0,
      },
      safetyFactor: 0,
      perMinute: {
        gallons: {
          instantaneous: 0,
          averaged: 0,
        },
        shearStrokes: 0,
        parts: 0,
      },
    },
  },
  voltageRequired: 0,
  equipmentSpaceLength: 0,
  equipmentSpaceWidth: 0,
  obstructions: "",
  mount: {
    feederMountedToPress: "",
    adequateSupport: "",
    customMounting: "",
  },
  loopPit: "",
  requireGuarding: "",
  specialConsiderations: "",
};

// Initial state for the existing flat context
const initialState: PerformanceSheetState = {
  // ... existing initialState code remains the same ...
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
  maxThick: { ...initialMaterialSpecsVersion },
  atFull: { ...initialMaterialSpecsVersion },
  minThick: { ...initialMaterialSpecsVersion },
  atWidth: { ...initialMaterialSpecsVersion },
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
  reelDrive: {},
  controlsLevel: "",
  feedControls: "",
  passline: "",
  typeOfRoll: "",
  reelBackplate: "",
  reelStyle: "",
  lightGauge: false,
  nonMarking: false,
  avgFPM: "",
  maxFPM: "",
  minFPM: "",
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
  // Existing flat structure
  performanceSheet: PerformanceSheetState;
  setPerformanceSheet: React.Dispatch<React.SetStateAction<PerformanceSheetState>>;
  updatePerformanceSheet: (updates: Partial<PerformanceSheetState>) => void;
  
  // New nested structure
  performanceData: PerformanceData;
  setPerformanceData: React.Dispatch<React.SetStateAction<PerformanceData>>;
  updatePerformanceData: (updates: Partial<PerformanceData>) => void;
}

const PerformanceSheetContext = createContext<PerformanceSheetContextType | undefined>(undefined);

export const PerformanceSheetProvider = ({ children }: { children: ReactNode }) => {
  const [performanceSheet, setPerformanceSheet] = useState<PerformanceSheetState>(initialState);
  const [performanceData, setPerformanceData] = useState<PerformanceData>(initialPerformanceData);

  const updatePerformanceSheet = (updates: Partial<PerformanceSheetState>) => {
    setPerformanceSheet((prev) => ({ ...prev, ...updates }));
  };

  const updatePerformanceData = (updates: Partial<PerformanceData>) => {
    setPerformanceData((prev) => {
      // Deep merge for nested objects
      const mergeDeep = (target: any, source: any) => {
        const output = { ...target };
        for (const key in source) {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = mergeDeep(target[key] || {}, source[key]);
          } else {
            output[key] = source[key];
          }
        }
        return output;
      };
      
      return mergeDeep(prev, updates);
    });
  };

  return (
    <PerformanceSheetContext.Provider
      value={{ 
        performanceSheet, 
        setPerformanceSheet, 
        updatePerformanceSheet,
        performanceData,
        setPerformanceData,
        updatePerformanceData
      }}
    >
      {children}
    </PerformanceSheetContext.Provider>
  );
};

export const usePerformanceSheet = () => {
  const ctx = useContext(PerformanceSheetContext);
  if (!ctx)
    throw new Error("usePerformanceSheet must be used within a PerformanceSheetProvider");
  return ctx;
};

export { initialState, initialPerformanceData };