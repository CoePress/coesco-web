/**
 * Performance Data Types
 * Shared types for autofill operations (migrated from client)
 */

export interface PerformanceData {
  common?: {
    customer?: string;
    material?: {
      materialType?: string | number;
      materialThickness?: string | number;
      maxYieldStrength?: string | number;
      maxTensileStrength?: string | number;
      coilWidth?: string | number;
      materialDensity?: string | number;
      grade?: string;
      coating?: string;
      surfaceCondition?: string;
      edgeCondition?: string;
    };
    coil?: {
      maxCoilWeight?: string | number;
      maxCoilOD?: string | number;
      coilID?: string | number;
      maxCoilWidth?: string | number;
      minCoilWidth?: string | number;
    };
    feedRates?: {
      average?: {
        length?: string | number;
        spm?: string | number;
        fpm?: string | number;
      };
      min?: {
        length?: string | number;
        spm?: string | number;
        fpm?: string | number;
      };
      max?: {
        length?: string | number;
        spm?: string | number;
        fpm?: string | number;
      };
    };
    equipment?: {
      feed?: {
        model?: string;
        lineType?: string;
        typeOfLine?: string;
        controlsLevel?: string;
        direction?: string;
        nonMarking?: string | boolean;
        lightGuageNonMarking?: string | boolean;
      };
      straightener?: {
        model?: string;
        numberOfRolls?: string | number;
        width?: string | number;
      };
      reel?: {
        model?: string;
        width?: string | number;
        backplate?: {
          diameter?: string | number;
        };
      };
    };
  };
  feed?: {
    feed?: {
      application?: string;
      pullThru?: {
        isPullThru?: string;
      };
      accelerationRate?: string | number;
      motor?: {
        hp?: string | number;
        torque?: string | number;
      };
      feedConfiguration?: string;
      feedRolls?: {
        diameter?: string | number;
        material?: string;
        hardness?: string | number;
        grip?: {
          pressure?: string | number;
        };
      };
      threading?: {
        webGuides?: {
          quantity?: string | number;
          type?: string;
        };
        threadingSpeed?: string | number;
      };
      servo?: {
        positioning?: {
          accuracy?: string | number;
          repeatability?: string | number;
        };
      };
    };
  };
  rfq?: {
    dates?: {
      date?: string;
    };
    coil?: {
      slitEdge?: string | boolean;
      millEdge?: string | boolean;
    };
    dies?: {
      progressiveDies?: string | boolean;
      transferDies?: string | boolean;
      blankingDies?: string | boolean;
    };
    press?: {
      maxSPM?: string | number;
    };
    voltageRequired?: string;
  };
  rfqDetails?: {
    customerName?: string;
    projectName?: string;
  };
  materialSpecs?: {
    feed?: {
      controls?: string;
    };
    straightener?: {
      rolls?: {
        typeOfRoll?: string;
      };
      selectRoll?: string;
    };
    material?: {
      minBendRadius?: string | number;
    };
  };
  reelDrive?: {
    reel?: {
      model?: string;
      width?: string | number;
      motorization?: {
        isMotorized?: string;
        speed?: string | number;
        driveHorsepower?: string | number;
        accelRate?: string | number;
      };
    };
  };
  tddbhd?: {
    coil?: {
      coilOD?: string | number;
      coilWeight?: string | number;
    };
    reel?: {
      model?: string;
      webTension?: {
        lbs?: string | number;
      };
      dragBrake?: {
        torque?: string | number;
        model?: string;
        quantity?: string | number;
        holdingForce?: string | number;
        psiAirRequired?: string | number;
      };
      airPressureAvailable?: string | number;
      coefficientOfFriction?: string | number;
      cylinderBore?: string | number;
      requiredDecelRate?: string | number;
      brakePadDiameter?: string | number;
      minMaterialWidth?: string | number;
      confirmedMinWidth?: boolean;
      holddown?: {
        assy?: string;
        cylinder?: string;
        cylinderPressure?: string | number;
        force?: {
          required?: string | number;
          available?: string | number;
        };
      };
      threadingDrive?: {
        airClutch?: string;
        hydThreadingDrive?: string;
      };
    };
  };
  rollStrBackbend?: {
    rollConfiguration?: string;
    straightener?: {
      rolls?: {
        typeOfRoll?: string;
        backbend?: {
          rollers?: {
            depthRequired?: string | number;
            forceRequired?: string | number;
            first?: {
              height?: string | number;
            };
            middle?: {
              height?: string | number;
            };
            last?: {
              height?: string | number;
            };
          };
          radius?: {
            radiusAtYield?: string | number;
            comingOffCoil?: string | number;
          };
          requiredRollDiameter?: string | number;
        };
      };
      rollDiameter?: string | number;
      centerDistance?: string | number;
      jackForceAvailable?: string | number;
    };
  };
  strUtility?: {
    straightener?: {
      horsepower?: string | number;
      feedRate?: string | number;
    };
  };
  shear?: {
    type?: string;
    shear?: {
      hydraulic?: {
        pressure?: string | number;
      };
    };
  };
  [key: string]: any; // Allow additional properties
}
