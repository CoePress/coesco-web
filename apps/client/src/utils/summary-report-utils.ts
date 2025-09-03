import { PerformanceData } from "@/contexts/performance.context";

// The new summary report structure
export interface ISummaryReportData {
  AirClutch?: boolean | string;
  BackplateDiameter?: number | string;
  BrakeModel?: string;
  BrakeQuantity?: number | string;
  ControlsLevel?: string;
  Customer?: string;
  Date?: string;
  FeedAccel?: number | string;
  FeedAngle1?: string;
  FeedAngle2?: string;
  FeedAngleTable?: string;
  FeedApplication?: string;
  FeedControls?: string;
  FeedDirection?: string;
  FeedFullWidthRolls?: boolean | string;
  FeedLoopPit?: boolean | string;
  FeedMaxVelocity?: number | string;
  FeedModel?: string;
  FeedPullThruPinchRolls?: number | string;
  FeedPullThruStrRolls?: number | string;
  FeedRatio?: number | string;
  FeedWidth?: number | string;
  HoldDownAssembly?: string;
  HoldDownCylinder?: string;
  HoldDownPressure?: number | string;
  HydraulicThreadDrive?: string;
  LightGuage?: boolean | string;
  MaterialWidth?: number | string;
  MatlSpecsTable?: string;
  MotorizedReelModel?: string;
  MotorizedReelWidth?: number | string;
  NonMarking?: boolean | string;
  Passline?: string;
  PressBedLength?: number | string;
  ReelAcceleration?: number | string;
  ReelBackplate?: number | string;
  ReedDriveHP?: number | string;
  ReelModel?: string;
  ReelMotorized?: string;
  ReelRegen?: boolean | string;
  ReelSpeed?: number | string;
  ReelStyle?: string;
  Reference?: string;
  rfqAddress?: string;
  rfqBackplate?: boolean | string;
  rfqCity?: string;
  rfqCoilCar?: boolean | string;
  rfqCompany?: string;
  rfqCosmetic?: boolean | string;
  rfqCountry?: string;
  rfqDealer?: string;
  rfqDealerSalesman?: string;
  rfqEmail?: string;
  rfqPhone?: string;
  rfqPosition?: string;
  rfqRequireGuarding?: boolean | string;
  rfqState?: string;
  rfqVoltage?: number | string;
  rfqZipCode?: string;
  StrAcceleration?: number | string;
  StrBackupRolls?: string;
  StrFeedRate?: number | string;
  StrHP?: number | string;
  StrModel?: string;
  StrPayoff?: string;
  StrRollType?: string;
  StrWidth?: number | string;
  TypeOfLine?: string;
}

// Map PerformanceData to ISummaryReportData
export function mapPerformanceToSummary(perf: PerformanceData): ISummaryReportData {
    const matlSpecsTableString = {
        coilWidth: perf?.common?.material?.coilWidth,
        coilWeight: perf?.common?.material?.coilWeight,
        materialThickness: perf?.common?.material?.materialThickness,
        materialType: perf?.common?.material?.materialType,
        yieldStrength: perf?.common?.material?.maxYieldStrength,
        materialTensile: perf?.common?.material?.maxTensileStrength,
        maxFpm: perf?.common?.material?.reqMaxFPM,
        minBendRadius: perf?.materialSpecs?.material?.minBendRadius,
        minLoopLength: perf?.materialSpecs?.material?.minLoopLength,
        coilOD: perf?.common?.coil?.maxCoilOD,
        coilID: perf?.common?.coil?.coilID,
        coilODCalculated: perf?.materialSpecs?.material?.calculatedCoilOD,
    }.toString();

    return {
        AirClutch: perf?.tddbhd?.reel?.threadingDrive?.airClutch,
        BackplateDiameter: perf?.common?.equipment?.reel?.backplate?.diameter,
        BrakeModel: perf?.tddbhd?.reel?.dragBrake?.model,
        BrakeQuantity: perf?.tddbhd?.reel?.dragBrake?.quantity,
        ControlsLevel: perf?.common?.equipment?.feed?.controlsLevel,
        Customer: perf?.common?.customer,
        Date: perf?.rfq?.dates?.date,
        FeedAccel: perf?.feed?.feed?.accelerationRate,
        FeedAngle1: perf?.feed?.feed?.feedAngle1?.toString(),
        FeedAngle2: perf?.feed?.feed?.feedAngle2?.toString(),
        FeedAngleTable: perf?.feed?.feed?.tableValues?.toString(),
        FeedApplication: perf?.feed?.feed?.application,
        FeedControls: perf?.common?.equipment?.feed?.controlsLevel,
        FeedDirection: perf?.common?.equipment?.feed?.direction,
        FeedFullWidthRolls: perf?.feed?.feed?.fullWidthRolls,
        FeedLoopPit: perf?.common?.equipment?.feed?.loopPit,
        FeedMaxVelocity: perf?.common?.equipment?.feed?.maximumVelocity,
        FeedModel: perf?.common?.equipment?.feed?.model,
        FeedPullThruPinchRolls: perf?.feed?.feed?.pullThru?.pinchRolls,
        FeedPullThruStrRolls: perf?.feed?.feed?.pullThru?.straightenerRolls,
        FeedRatio: perf?.feed?.feed?.ratio,
        FeedWidth: perf?.feed?.feed?.machineWidth,
        HoldDownAssembly: perf?.tddbhd?.reel?.holddown?.assy,
        HoldDownCylinder: perf?.tddbhd?.reel?.holddown?.cylinder,
        HoldDownPressure: perf?.tddbhd?.reel?.holddown?.cylinderPressure,
        HydraulicThreadDrive: perf?.tddbhd?.reel?.threadingDrive?.hydThreadingDrive,
        LightGuage: perf?.common?.equipment?.feed?.lightGuageNonMarking,
        MaterialWidth: perf?.common?.equipment?.straightener?.width,
        MatlSpecsTable: matlSpecsTableString,
        MotorizedReelModel: perf?.common?.equipment?.reel?.model,
        MotorizedReelWidth: perf?.common?.equipment?.reel?.width,
        NonMarking: perf?.common?.equipment?.feed?.nonMarking,
        Passline: perf?.common?.equipment?.feed?.passline,
        PressBedLength: perf?.common?.press?.bedLength,
        ReelAcceleration: perf?.reelDrive?.reel?.motorization?.accelRate,
        ReelBackplate: perf?.common?.equipment?.reel?.backplate?.diameter,
        ReedDriveHP: perf?.reelDrive?.reel?.motorization?.driveHorsepower,
        ReelModel: perf?.common?.equipment?.reel?.model,
        ReelMotorized: perf?.reelDrive?.reel?.motorization?.isMotorized,
        ReelRegen: perf?.reelDrive?.reel?.motorization?.regenRequired,
        ReelSpeed: perf?.reelDrive?.reel?.motorization?.speed,
        ReelStyle: perf?.materialSpecs?.reel?.style,
        Reference: perf?.referenceNumber,
        rfqAddress: perf?.common?.customerInfo?.streetAddress,
        rfqBackplate: perf?.materialSpecs?.reel?.backplate?.type,
        rfqCity: perf?.common?.customerInfo?.city,
        rfqCoilCar: perf?.rfq?.coil?.requireCoilCar,
        rfqCompany: perf?.common?.customer,
        rfqCosmetic: perf?.rfq?.runningCosmeticMaterial,
        rfqCountry: perf?.common?.customerInfo?.country,
        rfqDealer: perf?.common?.customerInfo?.dealerName,
        rfqDealerSalesman: perf?.common?.customerInfo?.dealerSalesman,
        rfqEmail: perf?.common?.customerInfo?.email,
        rfqPhone: perf?.common?.customerInfo?.phoneNumber,
        rfqPosition: perf?.common?.customerInfo?.position,
        rfqRequireGuarding: perf?.rfq?.requireGuarding,
        rfqState: perf?.common?.customerInfo?.state,
        rfqVoltage: perf?.rfq?.voltageRequired,
        rfqZipCode: perf?.common?.customerInfo?.zip?.toString(),
        StrAcceleration: perf?.strUtility?.straightener?.acceleration,
        StrBackupRolls: perf?.strUtility?.straightener?.required?.backupRollsCheck,
        StrFeedRate: perf?.strUtility?.straightener?.feedRate,
        StrHP: perf?.strUtility?.straightener?.horsepower,
        StrModel: perf?.common?.equipment?.straightener?.model,
        StrPayoff: perf?.strUtility?.straightener?.payoff,
        StrRollType: perf?.rollStrBackbend?.straightener?.rolls?.typeOfRoll,
        StrWidth: perf?.common?.equipment?.straightener?.width,
        TypeOfLine: perf?.common?.equipment?.feed?.typeOfLine,
    };
}