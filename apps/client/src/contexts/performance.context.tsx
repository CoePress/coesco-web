import React, { 
  createContext, useContext, useState, ReactNode, useCallback,
  useEffect, useRef 
} from "react";
import { useParams } from "react-router-dom";
import { mapCalculationResultsToPerformanceData } from "@/utils/universal-mapping";
import { useUpdateEntity } from "@/hooks/_base/use-update-entity";

// Common interfaces that are shared across pages
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

// Common shared data structure
export interface CommonData {
  customer?: string;
  date?: string;
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
  material?: {
    materialThickness?: number;
    coilWidth?: number;
    coilWeight?: number;
    materialType?: string;
    maxYieldStrength?: number;
    maxTensileStrength?: number;
    materialDensity?: number;
    modulus?: number;
  };
  coil?: {
    maxCoilWidth?: number;
    minCoilWidth?: number;
    maxCoilOD?: number;
    coilID?: number;
    maxCoilWeight?: number;
    maxCoilHandlingCap?: number;
  };
  equipment?: {
    reel?: {
      model?: string;
      width?: number;
      horsepower?: number;
      backplate?: {
        diameter?: number;
      };
    };
    straightener?: {
      model?: string;
      width?: number;
      numberOfRolls?: number;
      rollDiameter?: number;
    };
    feed?: {
      direction?: string;
      controlsLevel?: string;
      controls?: string;
      typeOfLine?: string;
      passline?: string;
      lightGuageNonMarking?: string;
      nonMarking?: string;
      maximumVelocity?: number;
    };
  };
  feedRates?: {
    average?: {
      length?: number;
      spm?: number;
      fpm?: number; // Calculated
    };
    max?: {
      length?: number;
      spm?: number;
      fpm?: number; // Calculated
    };
    min?: {
      length?: number;
      spm?: number;
      fpm?: number; // Calculated
    };
  };
}

// Updated RFQ interface (removing duplicated fields)
export interface RFQData {
  dates?: {
    date?: string;
    decisionDate?: string;
    idealDeliveryDate?: string;
    earliestDeliveryDate?: string;
    latestDeliveryDate?: string;
  };
  lineApplication?: string;
  pullThrough?: string;
  coil?: {
    slitEdge?: string;
    millEdge?: string;
    requireCoilCar?: string;
    runningOffBackplate?: string;
    requireRewinding?: string;
    changeTimeConcern?: string;
    timeChangeGoal?: string;
    loading?: string;
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
}

// Updated Material Specs interface (removing duplicated fields)
export interface MaterialSpecsData {
  material?: {
    minBendRadius?: number; // Calculated
    minLoopLength?: number; // Calculated
    calculatedCoilOD?: number; // Calculated
  };
  feed?: {
    controls?: string; // Calculated
  };
  straightener?: {
    rolls?: {
      typeOfRoll?: string;
    };
  };
  reel?: {
    backplate?: {
      type?: string;
    };
    style?: string;
  };
}

// Updated TDDBHD interface (removing duplicated fields)
export interface TDDBHDData {
  reel?: {
    dispReelMtr?: string;
    airPressureAvailable?: number;
    requiredDecelRate?: number;
    coefficientOfFriction?: number; // Calculated
    cylinderBore?: number;
    minMaterialWidth?: number; // Calculated
    brakePadDiameter?: number;
    threadingDrive?: {
      airClutch?: string;
      hydThreadingDrive?: string;
    };
    holddown?: {
      assy?: string;
      cylinder?: string;
      cylinderPressure?: number;
      force?: {
        required?: number; // Calculated
        available?: number; // Calculated
      };
    };
    dragBrake?: {
      model?: string;
      quantity?: number;
      psiAirRequired?: number; // Calculated
      holdingForce?: number; // Calculated
    };
    torque?: {
      atMandrel?: number; // Calculated
      rewindRequired?: number; // Calculated
      required?: number; // Calculated
    };
    webTension?: {
      psi?: number; // Calculated
      lbs?: number; // Calculated
    };
  };
  coil?: {
    coilWeight?: number; // Calculated
    coilOD?: number; // Calculated
  };
}

// Updated Reel Drive interface (removing duplicated fields)
export interface ReelDriveData {
  reel?: {
    size?: number;
    bearing?: {
      distance?: number;
      diameter: {
        front?: number;
        rear?: number;
      };
    };
    mandrel?: {
      diameter?: number;
      length?: number;
      maxRPM?: number; // Calculated
      RpmFull?: number; // Calculated
      weight?: number; // Calculated
      inertia?: number; // Calculated
      reflInertia?: number; // Calculated
    };
    backplate?: {
      thickness?: number;
      weight?: number; // Calculated
      inertia?: number; // Calculated
      reflInertia?: number; // Calculated
    };
    reducer?: {
      ratio?: number;
      efficiency?: number;
      driving?: number;
      backdriving?: number;
      inertia?: number;
      reflInertia?: number; // Calculated
    };
    chain?: {
      ratio?: number;
      sprktOD?: number;
      sprktThickness?: number;
      weight?: number;
      inertia?: number; // Calculated
      reflInertia?: number; // Calculated
    };
    ratio?: string; // Calculated
    totalReflInertia?: {
      empty?: number; // Calculated
      full?: number; // Calculated
    };
    motor?: {
      inertia?: number;
      rpm: {
        base?: number;
        full?: number;
      };
    };
    friction?: {
      bearing?: {
        mandrel: {
          rear?: number; // Calculated
          front?: number; // Calculated
        };
        coil?: {
          rear?: number;
          front?: number; // Calculated
        };
        total?: {
          empty?: number; // Calculated
          full?: number; // Calculated
        };
        refl?: {
          empty?: number; // Calculated
          full?: number; // Calculated
        };
      };
    };
    speed?: number;
    motorization?: {
      accelRate?: number;
    };
    accelerationTime?: number; // Calculated
    torque?: {
      empty?: {
        torque?: number; // Calculated
        horsepowerRequired?: number; // Calculated
        horsepowerCheck?: string; // Calculated
        regen?: string; // Calculated
        regenCheck?: string; // Calculated
      };
      full?: {
        torque?: number; // Calculated
        horsepowerRequired?: number; // Calculated
        horsepowerCheck?: string; // Calculated
        regen?: string; // Calculated
        regenCheck?: string; // Calculated
      };
    };
    reelDriveOK?: string; // Calculated
  };
  coil?: {
    density?: number;
    inertia?: number; // Calculated
    reflInertia?: number; // Calculated
  };
}

// Updated Straightener Utility interface (removing duplicated fields)
export interface StrUtilityData {
  straightener?: {
    payoff?: string;
    horsepower?: number;
    acceleration?: number;
    feedRate?: number;
    autoBrakeCompensation?: string;
    centerDistance?: number;
    jackForceAvailable?: number;
    modulus?: number;
    rolls?: {
      straighteningRolls?: number;
      depth?: {
        withoutMaterial?: number;
      };
      straightener?: {
        diameter?: number;
        requiredGearTorque?: number; // Calculated
        ratedTorque?: number; // Calculated
      };
      pinch?: {
        diameter?: number;
        requiredGearTorque?: number; // Calculated
        ratedTorque?: number; // Calculated
      };
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
    actualCoilWeight?: number; // Calculated
    coilOD?: number; // Calculated
    required?: {
      force?: number; // Calculated
      ratedForce?: number; // Calculated
      horsepower?: number; // Calculated
      horsepowerCheck?: string; // Calculated
      jackForceCheck?: string; // Calculated
      backupRollsCheck?: string; // Calculated
    };
    torque?: {
      straightener?: number; // Calculated
      acceleration?: number; // Calculated
      brake?: number; // Calculated
    };
  };
  coil?: {
    weight?: number;
  };
}

// Updated Roll Straightener Backbend interface (removing duplicated fields)
export interface RollStrBackbendData {
  rollConfiguration?: string; // "7", "9", "11"
  material?: {
    density: number; // lb/in³
  };
  straightener?: {
    centerDistance?: number;
    modulus?: number;
    jackForceAvailable?: number;
    feedRate?: number;
    poweredRolls?: string;
    operatingPressure?: number;
    hydraulicControl?: string;
    rolls?: {
      typeOfRoll?: string;
      depth?: {
        withoutMaterial?: number;
        withMaterial?: number;
      };
      backbend?: {
        hiddenValue?: number;
        yieldMet?: string; // Calculated
        requiredRollDiameter?: number;
        radius?: {
          comingOffCoil?: number;
          offCoilAfterSpringback?: number; // Calculated
          requiredToYieldSkinOfFlatMaterial?: number; // Calculated
        };
        bendingMomentToYieldSkin?: number; // Calculated
        rollers?: {
          depthRequired?: number; // Calculated
          forceRequired?: number; // Calculated
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
      };
    };
  };
}

// Updated Feed interface (removing duplicated fields)
export interface FeedData {
  feedType?: string; // "sigma-5", "sigma-5-pull-thru", "allen-bradley"
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
    ratio?: number;
    maxMotorRPM?: number; // Calculated
    motorInertia?: number; // Calculated
    maxVelocity?: number; // Calculated
    settleTime?: number; // Calculated
    regen?: number; // Calculated
    reflInertia?: number; // Calculated
    match?: number; // Calculated
    materialInLoop?: number; // Calculated
    torque?: {
      motorPeak?: number; // Calculated
      peak?: number; // Calculated
      frictional?: number; // Calculated
      loop?: number; // Calculated
      settle?: number; // Calculated
      rms?: {
        motor?: number; // Calculated
        feedAngle1?: number; // Calculated
        feedAngle2?: number; // Calculated
      };
      acceleration?: number; // Calculated
    };
    pullThru?: {
      isPullThru?: string;
      straightenerRolls?: number;
      centerDistance?: number;
      yieldStrength?: number;
      pinchRolls?: string;
      kConst?: number;
      straightenerTorque?: number;
    };
    tableValues?: Array<{
      length?: number;
      rms_torque_fa1?: number;
      rms_torque_fa2?: number;
      spm_at_fa1?: number;
      fpm_fa1?: number;
      index_time_fa1?: number;
      spm_at_fa2?: number;
      fpm_fa2?: number;
      index_time_fa2?: number;
    }>;
  };
  press?: {
    bedLength?: string;
  };
}

// Updated Shear interface (removing duplicated fields)
export interface ShearData {
  shearType?: string; // "single-rake", "bow-tie"
  shear?: {
    model?: string;
    strength?: number; // Calculated
    blade?: {
      rakeOfBladePerFoot?: number;
      overlap?: number;
      bladeOpening?: number;
      percentOfPenetration?: number;
      angleOfBlade?: number; // Calculated
      initialCut?: {
        length?: number; // Calculated
        area?: number; // Calculated
      };
    };
    cylinder?: {
      boreSize?: number;
      rodDiameter?: number;
      stroke?: number;
      minStroke?: {
        forBlade?: number; // Calculated
        requiredForOpening?: number; // Calculated
      };
      actualOpeningAboveMaxMaterial?: number; // Calculated
    };
    hydraulic?: {
      pressure?: number;
      cylinder?: {
        area?: number; // Calculated
        volume?: number; // Calculated
      };
      fluidVelocity?: number; // Calculated
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
      perHour?: {
        parts?: number;
      };
    };
  };
}

// Updated Summary Report interface (removing duplicated fields)
export interface SummaryReportData {
  reel?: {
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
    };
    dragBrake?: {
      model?: string;
      quantity?: number;
    };
  };
  straightener?: {
    payoff?: string;
    feedRate?: number;
    acceleration?: number;
    horsepower?: number;
    rolls?: {
      straighteningRolls?: number;
      backupRolls?: string;
    };
  };
  feed?: {
    application?: string;
    model?: string;
    machineWidth?: number;
    fullWidthRolls?: string;
    feedAngle1?: number;
    feedAngle2?: number;
    maximumVelocity?: number;
    acceleration?: number;
    ratio?: string;
    pullThru?: {
      straightenerRolls?: number;
      pinchRolls?: string;
    };
  };
  press?: {
    bedLength?: string;
  };
  loopPit?: string;
}

// Updated Main Performance Data Structure
export interface PerformanceData {
  referenceNumber: string;
  common?: CommonData;
  rfq?: RFQData;
  materialSpecs?: MaterialSpecsData;
  tddbhd?: TDDBHDData;
  reelDrive?: ReelDriveData;
  strUtility?: StrUtilityData;
  rollStrBackbend?: RollStrBackbendData;
  feed?: FeedData;
  shear?: ShearData;
  summaryReport?: SummaryReportData;
}

// Initial state for PerformanceData
const initialPerformanceData: PerformanceData = {
  referenceNumber: "",
  common: {
    customer: "",
    date: "",
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
    material: {
      materialThickness: 0,
      coilWidth: 0,
      coilWeight: 0,
      materialType: "",
      maxYieldStrength: 0,
      maxTensileStrength: 0,
      materialDensity: 0,
      modulus: 0,
    },
    coil: {
      maxCoilWidth: 0,
      minCoilWidth: 0,
      maxCoilOD: 0,
      coilID: 0,
      maxCoilWeight: 0,
      maxCoilHandlingCap: 0,
    },
    equipment: {
      reel: {
        model: "",
        width: 0,
        horsepower:0,
        backplate: {
          diameter: 0,
        },
      },
      straightener: {
        model: "",
        width: 0,
        numberOfRolls: 0,
        rollDiameter: 0,
      },
      feed: {
        direction: "",
        controlsLevel: "",
        controls: "",
        typeOfLine: "",
        passline: "",
        lightGuageNonMarking: "",
        nonMarking: "",
        maximumVelocity: 0,
      },
    },
    feedRates: {
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
    },
  },
  rfq: {
    dates: {
      date: "",
      decisionDate: "",
      idealDeliveryDate: "",
      earliestDeliveryDate: "",
      latestDeliveryDate: "",
    },
    lineApplication: "",
    pullThrough: "",
    coil: {
      slitEdge: "",
      millEdge: "",
      requireCoilCar: "",
      runningOffBackplate: "",
      requireRewinding: "",
      changeTimeConcern: "",
      timeChangeGoal: "",
      loading: "",
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
  },
  materialSpecs: {
    material: {
      minBendRadius: 0,
      minLoopLength: 0,
      calculatedCoilOD: 0,
    },
    feed: {
      controls: "",
    },
    straightener: {
      rolls: {
        typeOfRoll: "",
      },
    },
    reel: {
      backplate: {
        type: "",
      },
      style: "",
    },
  },
  tddbhd: {
    reel: {
      dispReelMtr: "",
      airPressureAvailable: 0,
      requiredDecelRate: 0,
      coefficientOfFriction: 0,
      cylinderBore: 0,
      minMaterialWidth: 0,
      brakePadDiameter: 0,
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
      torque: {
        atMandrel: 0,
        rewindRequired: 0,
        required: 0,
      },
      webTension: {
        psi: 0,
        lbs: 0,
      },
    },
    coil: {
      coilWeight: 0,
      coilOD: 0,
    },
  },
  reelDrive: {
    reel: {
      size: 0,
      bearing: {
        distance: 0,
        diameter: {
          front: 0,
          rear: 0,
        },
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
      ratio: "",
      totalReflInertia: {
        empty: 0,
        full: 0,
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
      speed: 0,
      motorization: {
        accelRate: 0,
      },
      accelerationTime: 0,
      torque: {
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
      reelDriveOK: "",
    },
    coil: {
      density: 0,
      inertia: 0,
      reflInertia: 0,
    },
  },
  strUtility: {
    straightener: {
      payoff: "",
      horsepower: 0,
      acceleration: 0,
      feedRate: 0,
      autoBrakeCompensation: "",
      centerDistance: 0,
      jackForceAvailable: 0,
      modulus: 0,
      rolls: {
        straighteningRolls: 0,
        depth: {
          withoutMaterial: 0,
        },
        straightener: {
          diameter: 0,
          requiredGearTorque: 0,
          ratedTorque: 0,
        },
        pinch: {
          diameter: 0,
          requiredGearTorque: 0,
          ratedTorque: 0,
        },
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
      actualCoilWeight: 0,
      coilOD: 0,
      required: {
        force: 0,
        ratedForce: 0,
        horsepower: 0,
        horsepowerCheck: "",
        jackForceCheck: "",
        backupRollsCheck: "",
      },
      torque: {
        straightener: 0,
        acceleration: 0,
        brake: 0,
      },
    },
    coil: {
      weight: 0,
    },
  },
  rollStrBackbend: {
    rollConfiguration: "",
    material: {
      density: 0,
    },
    straightener: {
      centerDistance: 0,
      modulus: 0,
      jackForceAvailable: 0,
      feedRate: 0,
      poweredRolls: "",
      operatingPressure: 0,
      hydraulicControl: "",
      rolls: {
        typeOfRoll: "",
        depth: {
          withoutMaterial: 0,
          withMaterial: 0,
        },
        backbend: {
          hiddenValue: 0,
          yieldMet: "",
          requiredRollDiameter: 0,
          radius: {
            comingOffCoil: 0,
            offCoilAfterSpringback: 0,
            requiredToYieldSkinOfFlatMaterial: 0,
          },
          bendingMomentToYieldSkin: 0,
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
        },
      },
    },
  },
  feed: {
    feedType: "",
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
      ratio: 0,
      maxMotorRPM: 0,
      motorInertia: 0,
      maxVelocity: 0,
      settleTime: 0,
      regen: 0,
      reflInertia: 0,
      match: 0,
      materialInLoop: 0,
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
      pullThru: {
        isPullThru: "",
        straightenerRolls: 0,
        centerDistance: 0,
        yieldStrength: 0,
        pinchRolls: "",
        kConst: 0,
        straightenerTorque: 0,
      },
      tableValues: [],
    },
    press: {
      bedLength: "",
    },
  },
  shear: {
    shearType: "",
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
        perHour: {
          parts: 0,
        },
      },
    },
  },
  summaryReport: {
    reel: {
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
      },
      dragBrake: {
        model: "",
        quantity: 0,
      },
    },
    straightener: {
      payoff: "",
      feedRate: 0,
      acceleration: 0,
      horsepower: 0,
      rolls: {
        straighteningRolls: 0,
        backupRolls: "",
      },
    },
    feed: {
      application: "",
      model: "",
      machineWidth: 0,
      fullWidthRolls: "",
      feedAngle1: 0,
      feedAngle2: 0,
      maximumVelocity: 0,
      acceleration: 0,
      ratio: "",
      pullThru: {
        straightenerRolls: 0,
        pinchRolls: "",
      },
    },
    press: {
      bedLength: "",
    },
    loopPit: "",
  },
};

// Create the context for performance sheet
export const PerformanceSheetContext = createContext<
  | {
      performanceData: PerformanceData;
      setPerformanceData: React.Dispatch<React.SetStateAction<PerformanceData>>;
      updatePerformanceData: (updates: Partial<PerformanceData>) => Promise<any>;
      loading?: boolean;
      error?: string | null;
    }
  | undefined
>(undefined);

export const PerformanceSheetProvider = ({ children }: { children: ReactNode }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>(initialPerformanceData);
  const performanceDataRef = useRef(performanceData);
  const { id: performanceSheetId } = useParams();
  const endpoint = `/performance/${performanceSheetId}`;
  
  // Keep ref in sync with state
  useEffect(() => {
    performanceDataRef.current = performanceData;
  }, [performanceData]);
  
  // Use the performance-specific hook
  const { loading, error } = useUpdateEntity(endpoint);

  const updatePerformanceData = useCallback(async (updates: Partial<PerformanceData>, shouldSave = false) => {
    // Always update local state first for immediate UI feedback
    const updatedData = { ...performanceDataRef.current, ...updates };
    setPerformanceData(updatedData);
    
    console.log("performanceSheetId:", performanceSheetId, "shouldSave:", shouldSave, "updates:", updates);
    return updatedData;
  }, [performanceSheetId]);

  return (
    <PerformanceSheetContext.Provider
      value={{ 
        performanceData,
        setPerformanceData,
        updatePerformanceData,
        loading,
        error,
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

export { initialPerformanceData };