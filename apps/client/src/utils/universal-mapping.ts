import { PerformanceData } from "@/contexts/performance.context";

/**
 * Maps calculation results from the Python backend to PerformanceData structure
 * @param calculationResults - Raw calculation results from main.py
 * @returns Partial<PerformanceData> with calculated values mapped to correct locations
 */
export function mapCalculationResultsToPerformanceData(calculationResults: any): Partial<PerformanceData> {
  const mappedData: Partial<PerformanceData> = {};

  // RFQ Calculations - Map FPM values to feedRates
  if (calculationResults.rfq) {
    mappedData.common = {
      feedRates: {
        average: {
          fpm: calculationResults.rfq.average?.fpm
        },
        min: {
          fpm: calculationResults.rfq.min?.fpm
        },
        max: {
          fpm: calculationResults.rfq.max?.fpm
        }
      }
    };
  }

  // Material Specs Calculations
  if (calculationResults.material_specs) {
    mappedData.materialSpecs = {
      material: {
        minBendRadius: calculationResults.material_specs.min_bend_radius,
        minLoopLength: calculationResults.material_specs.min_loop_length,
        calculatedCoilOD: calculationResults.material_specs.coil_od_calculated
      },
      feed: {
        controls: calculationResults.material_specs.feed_controls
      },
      straightener: {
        rolls: {
          typeOfRoll: calculationResults.material_specs.type_of_roll
        }
      },
      reel: {
        backplate: {
          type: calculationResults.material_specs.backplate_type
        },
        style: calculationResults.material_specs.reel_style
      }
    };
  }

  // TDDBHD Calculations
  if (calculationResults.tddbhd) {
    mappedData.tddbhd = {
      reel: {
        coefficientOfFriction: calculationResults.tddbhd.coefficient_of_friction,
        minMaterialWidth: calculationResults.tddbhd.min_material_width,
        holddown: {
          force: {
            required: calculationResults.tddbhd.holddown_force_required,
            available: calculationResults.tddbhd.holddown_force_available
          }
        },
        dragBrake: {
          psiAirRequired: calculationResults.tddbhd.drag_brake_psi_air_required,
          holdingForce: calculationResults.tddbhd.drag_brake_holding_force
        },
        torque: {
          atMandrel: calculationResults.tddbhd.torque_at_mandrel,
          rewindRequired: calculationResults.tddbhd.torque_rewind_required,
          required: calculationResults.tddbhd.torque_required
        },
        webTension: {
          psi: calculationResults.tddbhd.web_tension_psi,
          lbs: calculationResults.tddbhd.web_tension_lbs
        }
      },
      coil: {
        coilWeight: calculationResults.tddbhd.coil_weight,
        coilOD: calculationResults.tddbhd.coil_od
      }
    };
  }

  // Reel Drive Calculations
  if (calculationResults.reel_drive) {
    mappedData.reelDrive = {
      reel: {
        mandrel: {
          maxRPM: calculationResults.reel_drive.mandrel_max_rpm,
          RpmFull: calculationResults.reel_drive.mandrel_rpm_full,
          weight: calculationResults.reel_drive.mandrel_weight,
          inertia: calculationResults.reel_drive.mandrel_inertia,
          reflInertia: calculationResults.reel_drive.mandrel_refl_inertia
        },
        backplate: {
          weight: calculationResults.reel_drive.backplate_weight,
          inertia: calculationResults.reel_drive.backplate_inertia,
          reflInertia: calculationResults.reel_drive.backplate_refl_inertia
        },
        reducer: {
          reflInertia: calculationResults.reel_drive.reducer_refl_inertia
        },
        chain: {
          inertia: calculationResults.reel_drive.chain_inertia,
          reflInertia: calculationResults.reel_drive.chain_refl_inertia
        },
        ratio: calculationResults.reel_drive.ratio,
        totalReflInertia: {
          empty: calculationResults.reel_drive.total_refl_inertia_empty,
          full: calculationResults.reel_drive.total_refl_inertia_full
        },
        friction: {
          bearing: {
            mandrel: {
              rear: calculationResults.reel_drive.friction_bearing_mandrel_rear,
              front: calculationResults.reel_drive.friction_bearing_mandrel_front
            },
            coil: {
              front: calculationResults.reel_drive.friction_bearing_coil_front
            },
            total: {
              empty: calculationResults.reel_drive.friction_bearing_total_empty,
              full: calculationResults.reel_drive.friction_bearing_total_full
            },
            refl: {
              empty: calculationResults.reel_drive.friction_bearing_refl_empty,
              full: calculationResults.reel_drive.friction_bearing_refl_full
            }
          }
        },
        accelerationTime: calculationResults.reel_drive.acceleration_time,
        torque: {
          empty: {
            torque: calculationResults.reel_drive.torque_empty,
            horsepowerRequired: calculationResults.reel_drive.horsepower_required_empty,
            horsepowerCheck: calculationResults.reel_drive.horsepower_check_empty,
            regen: calculationResults.reel_drive.regen_empty,
            regenCheck: calculationResults.reel_drive.regen_check_empty
          },
          full: {
            torque: calculationResults.reel_drive.torque_full,
            horsepowerRequired: calculationResults.reel_drive.horsepower_required_full,
            horsepowerCheck: calculationResults.reel_drive.horsepower_check_full,
            regen: calculationResults.reel_drive.regen_full,
            regenCheck: calculationResults.reel_drive.regen_check_full
          }
        },
        reelDriveOK: calculationResults.reel_drive.reel_drive_ok
      },
      coil: {
        inertia: calculationResults.reel_drive.coil_inertia,
        reflInertia: calculationResults.reel_drive.coil_refl_inertia
      }
    };
  }

  // Straightener Utility Calculations
  if (calculationResults.str_utility) {
    mappedData.strUtility = {
      straightener: {
        rolls: {
          straightener: {
            requiredGearTorque: calculationResults.str_utility.straightener_required_gear_torque,
            ratedTorque: calculationResults.str_utility.straightener_rated_torque
          },
          pinch: {
            requiredGearTorque: calculationResults.str_utility.pinch_required_gear_torque,
            ratedTorque: calculationResults.str_utility.pinch_rated_torque
          }
        },
        actualCoilWeight: calculationResults.str_utility.actual_coil_weight,
        coilOD: calculationResults.str_utility.coil_od,
        required: {
          force: calculationResults.str_utility.required_force,
          ratedForce: calculationResults.str_utility.rated_force,
          horsepower: calculationResults.str_utility.required_horsepower,
          horsepowerCheck: calculationResults.str_utility.horsepower_check,
          jackForceCheck: calculationResults.str_utility.jack_force_check,
          backupRollsCheck: calculationResults.str_utility.backup_rolls_check
        },
        torque: {
          straightener: calculationResults.str_utility.torque_straightener,
          acceleration: calculationResults.str_utility.torque_acceleration,
          brake: calculationResults.str_utility.torque_brake
        }
      }
    };
  }

  // Roll Straightener Backbend Calculations
  if (calculationResults.roll_str_backbend) {
    mappedData.rollStrBackbend = {
      straightener: {
        rolls: {
          backbend: {
            yieldMet: calculationResults.roll_str_backbend.yield_met,
            radius: {
              offCoilAfterSpringback: calculationResults.roll_str_backbend.radius_off_coil_after_springback,
              requiredToYieldSkinOfFlatMaterial: calculationResults.roll_str_backbend.radius_required_to_yield_skin
            },
            bendingMomentToYieldSkin: calculationResults.roll_str_backbend.bending_moment_to_yield_skin,
            rollers: {
              depthRequired: calculationResults.roll_str_backbend.depth_required,
              forceRequired: calculationResults.roll_str_backbend.force_required,
              first: {
                height: calculationResults.roll_str_backbend.first_roll?.height,
                forceRequired: calculationResults.roll_str_backbend.first_roll?.force_required,
                numberOfYieldStrainsAtSurface: calculationResults.roll_str_backbend.first_roll?.number_of_yield_strains,
                up: {
                  resultingRadius: calculationResults.roll_str_backbend.first_roll?.up?.resulting_radius,
                  curvatureDifference: calculationResults.roll_str_backbend.first_roll?.up?.curvature_difference,
                  bendingMoment: calculationResults.roll_str_backbend.first_roll?.up?.bending_moment,
                  bendingMomentRatio: calculationResults.roll_str_backbend.first_roll?.up?.bending_moment_ratio,
                  springback: calculationResults.roll_str_backbend.first_roll?.up?.springback,
                  percentOfThicknessYielded: calculationResults.roll_str_backbend.first_roll?.up?.percent_thickness_yielded,
                  radiusAfterSpringback: calculationResults.roll_str_backbend.first_roll?.up?.radius_after_springback
                },
                down: {
                  resultingRadius: calculationResults.roll_str_backbend.first_roll?.down?.resulting_radius,
                  curvatureDifference: calculationResults.roll_str_backbend.first_roll?.down?.curvature_difference,
                  bendingMoment: calculationResults.roll_str_backbend.first_roll?.down?.bending_moment,
                  bendingMomentRatio: calculationResults.roll_str_backbend.first_roll?.down?.bending_moment_ratio,
                  springback: calculationResults.roll_str_backbend.first_roll?.down?.springback,
                  percentOfThicknessYielded: calculationResults.roll_str_backbend.first_roll?.down?.percent_thickness_yielded,
                  radiusAfterSpringback: calculationResults.roll_str_backbend.first_roll?.down?.radius_after_springback
                }
              },
              middle: {
                height: calculationResults.roll_str_backbend.middle_roll?.height,
                forceRequired: calculationResults.roll_str_backbend.middle_roll?.force_required,
                numberOfYieldStrainsAtSurface: calculationResults.roll_str_backbend.middle_roll?.number_of_yield_strains,
                up: {
                  resultingRadius: calculationResults.roll_str_backbend.middle_roll?.up?.resulting_radius,
                  curvatureDifference: calculationResults.roll_str_backbend.middle_roll?.up?.curvature_difference,
                  bendingMoment: calculationResults.roll_str_backbend.middle_roll?.up?.bending_moment,
                  bendingMomentRatio: calculationResults.roll_str_backbend.middle_roll?.up?.bending_moment_ratio,
                  springback: calculationResults.roll_str_backbend.middle_roll?.up?.springback,
                  percentOfThicknessYielded: calculationResults.roll_str_backbend.middle_roll?.up?.percent_thickness_yielded,
                  radiusAfterSpringback: calculationResults.roll_str_backbend.middle_roll?.up?.radius_after_springback
                },
                down: {
                  resultingRadius: calculationResults.roll_str_backbend.middle_roll?.down?.resulting_radius,
                  curvatureDifference: calculationResults.roll_str_backbend.middle_roll?.down?.curvature_difference,
                  bendingMoment: calculationResults.roll_str_backbend.middle_roll?.down?.bending_moment,
                  bendingMomentRatio: calculationResults.roll_str_backbend.middle_roll?.down?.bending_moment_ratio,
                  springback: calculationResults.roll_str_backbend.middle_roll?.down?.springback,
                  percentOfThicknessYielded: calculationResults.roll_str_backbend.middle_roll?.down?.percent_thickness_yielded,
                  radiusAfterSpringback: calculationResults.roll_str_backbend.middle_roll?.down?.radius_after_springback
                }
              },
              last: {
                height: calculationResults.roll_str_backbend.last_roll?.height,
                forceRequired: calculationResults.roll_str_backbend.last_roll?.force_required,
                numberOfYieldStrainsAtSurface: calculationResults.roll_str_backbend.last_roll?.number_of_yield_strains,
                up: {
                  resultingRadius: calculationResults.roll_str_backbend.last_roll?.up?.resulting_radius,
                  curvatureDifference: calculationResults.roll_str_backbend.last_roll?.up?.curvature_difference,
                  bendingMoment: calculationResults.roll_str_backbend.last_roll?.up?.bending_moment,
                  bendingMomentRatio: calculationResults.roll_str_backbend.last_roll?.up?.bending_moment_ratio,
                  springback: calculationResults.roll_str_backbend.last_roll?.up?.springback,
                  percentOfThicknessYielded: calculationResults.roll_str_backbend.last_roll?.up?.percent_thickness_yielded,
                  radiusAfterSpringback: calculationResults.roll_str_backbend.last_roll?.up?.radius_after_springback
                }
              }
            }
          }
        }
      }
    };
  }

  // Feed Calculations
  if (calculationResults.feed) {
    mappedData.feed = {
      feed: {
        maxMotorRPM: calculationResults.feed.max_motor_rpm,
        motorInertia: calculationResults.feed.motor_inertia,
        maxVelocity: calculationResults.feed.max_velocity,
        settleTime: calculationResults.feed.settle_time,
        regen: calculationResults.feed.regen,
        reflInertia: calculationResults.feed.refl_inertia,
        match: calculationResults.feed.match,
        materialInLoop: calculationResults.feed.material_in_loop,
        torque: {
          motorPeak: calculationResults.feed.torque_motor_peak,
          peak: calculationResults.feed.torque_peak,
          frictional: calculationResults.feed.torque_frictional,
          loop: calculationResults.feed.torque_loop,
          settle: calculationResults.feed.torque_settle,
          rms: {
            motor: calculationResults.feed.torque_rms_motor,
            feedAngle1: calculationResults.feed.torque_rms_feed_angle_1,
            feedAngle2: calculationResults.feed.torque_rms_feed_angle_2
          },
          acceleration: calculationResults.feed.torque_acceleration
        },
        pullThru: {
          straightenerTorque: calculationResults.feed.straightener_torque
        },
        tableValues: calculationResults.feed.table_values || []
      }
    };
  }

  // Shear Calculations
  if (calculationResults.shear) {
    mappedData.shear = {
      shear: {
        strength: calculationResults.shear.strength,
        blade: {
          angleOfBlade: calculationResults.shear.angle_of_blade,
          initialCut: {
            length: calculationResults.shear.initial_cut_length,
            area: calculationResults.shear.initial_cut_area
          }
        },
        cylinder: {
          minStroke: {
            forBlade: calculationResults.shear.min_stroke_for_blade,
            requiredForOpening: calculationResults.shear.min_stroke_required_for_opening
          },
          actualOpeningAboveMaxMaterial: calculationResults.shear.actual_opening_above_max_material
        },
        hydraulic: {
          cylinder: {
            area: calculationResults.shear.hydraulic_cylinder_area,
            volume: calculationResults.shear.hydraulic_cylinder_volume
          },
          fluidVelocity: calculationResults.shear.fluid_velocity
        },
        conclusions: {
          force: {
            perCylinder: calculationResults.shear.force_per_cylinder,
            totalApplied: {
              lbs: calculationResults.shear.total_applied_force_lbs,
              tons: calculationResults.shear.total_applied_force_tons
            },
            requiredToShear: calculationResults.shear.force_required_to_shear
          },
          safetyFactor: calculationResults.shear.safety_factor,
          perMinute: {
            gallons: {
              instantaneous: calculationResults.shear.gallons_per_minute_instantaneous,
              averaged: calculationResults.shear.gallons_per_minute_averaged
            },
            shearStrokes: calculationResults.shear.shear_strokes_per_minute,
            parts: calculationResults.shear.parts_per_minute
          },
          perHour: {
            parts: calculationResults.shear.parts_per_hour
          }
        }
      }
    };
  }

  return mappedData;
}