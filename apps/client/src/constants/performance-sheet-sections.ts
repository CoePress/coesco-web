/**
 * Default sections schema for performance sheet versions
 */
export const DEFAULT_PERFORMANCE_SHEET_SECTIONS = [
  {
    "name": "basic",
    "label": "Basic Information",
    "fields": [
      { "key": "referenceNumber", "type": "string", "label": "Reference Number", "required": true },
      { "key": "customer", "type": "string", "label": "Customer", "required": false },
      { "key": "runningCosmeticMaterial", "type": "string", "label": "Running Cosmetic Material", "required": false },
      { "key": "brandOfFeed", "type": "string", "label": "Brand of Feed", "required": false },
      { "key": "voltageRequired", "type": "string", "label": "Voltage Required", "required": false },
      { "key": "equipmentSpaceLength", "type": "string", "label": "Equipment Space Length", "required": false },
      { "key": "equipmentSpaceWidth", "type": "string", "label": "Equipment Space Width", "required": false },
      { "key": "obstructions", "type": "string", "label": "Obstructions", "required": false },
      { "key": "loopPit", "type": "string", "label": "Loop Pit", "required": false },
      { "key": "requireGuarding", "type": "string", "label": "Require Guarding", "required": false },
      { "key": "specialConsiderations", "type": "string", "label": "Special Considerations", "required": false }
    ]
  },
  {
    "name": "customerInfo",
    "label": "Customer Information",
    "fields": [
      { "key": "streetAddress", "type": "string", "label": "Street Address", "required": false },
      { "key": "city", "type": "string", "label": "City", "required": false },
      { "key": "state", "type": "string", "label": "State", "required": false },
      { "key": "zip", "type": "string", "label": "ZIP Code", "required": false },
      { "key": "country", "type": "string", "label": "Country", "required": false },
      { "key": "contactName", "type": "string", "label": "Contact Name", "required": false },
      { "key": "position", "type": "string", "label": "Position", "required": false },
      { "key": "phoneNumber", "type": "string", "label": "Phone Number", "required": false },
      { "key": "email", "type": "string", "label": "Email", "required": false },
      { "key": "dealerName", "type": "string", "label": "Dealer Name", "required": false },
      { "key": "dealerSalesman", "type": "string", "label": "Dealer Salesman", "required": false },
      { "key": "daysPerWeek", "type": "string", "label": "Days Per Week", "required": false },
      { "key": "shiftsPerDay", "type": "string", "label": "Shifts Per Day", "required": false }
    ]
  },
  {
    "name": "dates",
    "label": "Important Dates",
    "fields": [
      { "key": "date", "type": "string", "label": "Date", "required": false },
      { "key": "decisionDate", "type": "string", "label": "Decision Date", "required": false },
      { "key": "idealDeliveryDate", "type": "string", "label": "Ideal Delivery Date", "required": false },
      { "key": "earliestDeliveryDate", "type": "string", "label": "Earliest Delivery Date", "required": false },
      { "key": "latestDeliveryDate", "type": "string", "label": "Latest Delivery Date", "required": false }
    ]
  },
  {
    "name": "coil",
    "label": "Coil Specifications",
    "fields": [
      { "key": "density", "type": "string", "label": "Density", "required": false },
      { "key": "weight", "type": "string", "label": "Weight", "required": false },
      { "key": "maxCoilWidth", "type": "string", "label": "Max Coil Width", "required": false },
      { "key": "minCoilWidth", "type": "string", "label": "Min Coil Width", "required": false },
      { "key": "maxCoilOD", "type": "string", "label": "Max Coil OD", "required": false },
      { "key": "coilID", "type": "string", "label": "Coil ID", "required": false },
      { "key": "maxCoilWeight", "type": "string", "label": "Max Coil Weight", "required": false },
      { "key": "maxCoilHandlingCap", "type": "string", "label": "Max Coil Handling Cap", "required": false },
      { "key": "slitEdge", "type": "string", "label": "Slit Edge", "required": false },
      { "key": "millEdge", "type": "string", "label": "Mill Edge", "required": false },
      { "key": "requireCoilCar", "type": "string", "label": "Require Coil Car", "required": false },
      { "key": "runningOffBackplate", "type": "string", "label": "Running Off Backplate", "required": false },
      { "key": "requireRewinding", "type": "string", "label": "Require Rewinding", "required": false },
      { "key": "changeTimeConcern", "type": "string", "label": "Change Time Concern", "required": false },
      { "key": "timeChangeGoal", "type": "string", "label": "Time Change Goal", "required": false },
      { "key": "loading", "type": "string", "label": "Loading", "required": false },
      { "key": "inertia", "type": "string", "label": "Inertia", "required": false },
      { "key": "reflInertia", "type": "string", "label": "Reflected Inertia", "required": false }
    ]
  },
  {
    "name": "scenario",
    "label": "Material Scenario",
    "fields": [
      { "key": "materialThickness", "type": "string", "label": "Material Thickness", "required": false },
      { "key": "materialDensity", "type": "string", "label": "Material Density", "required": false },
      { "key": "coilWidth", "type": "string", "label": "Coil Width", "required": false },
      { "key": "materialType", "type": "string", "label": "Material Type", "required": false },
      { "key": "maxYieldStrength", "type": "string", "label": "Max Yield Strength", "required": false },
      { "key": "maxTensileStrength", "type": "string", "label": "Max Tensile Strength", "required": false },
      { "key": "minBendRadius", "type": "string", "label": "Min Bend Radius", "required": false },
      { "key": "minLoopLength", "type": "string", "label": "Min Loop Length", "required": false },
      { "key": "calculatedCoilOD", "type": "string", "label": "Calculated Coil OD", "required": false }
    ]
  },
  {
    "name": "press",
    "label": "Press Information",
    "fields": [
      { "key": "gapFramePress", "type": "string", "label": "Gap Frame Press", "required": false },
      { "key": "hydraulicPress", "type": "string", "label": "Hydraulic Press", "required": false },
      { "key": "obi", "type": "string", "label": "OBI", "required": false },
      { "key": "servoPress", "type": "string", "label": "Servo Press", "required": false },
      { "key": "shearDieApplication", "type": "string", "label": "Shear Die Application", "required": false },
      { "key": "straightSidePress", "type": "string", "label": "Straight Side Press", "required": false },
      { "key": "other", "type": "string", "label": "Other", "required": false },
      { "key": "tonnageOfPress", "type": "string", "label": "Tonnage of Press", "required": false },
      { "key": "strokeLength", "type": "string", "label": "Stroke Length", "required": false },
      { "key": "maxSPM", "type": "string", "label": "Max SPM", "required": false },
      { "key": "bedWidth", "type": "string", "label": "Bed Width", "required": false },
      { "key": "bedLength", "type": "string", "label": "Bed Length", "required": false },
      { "key": "windowSize", "type": "string", "label": "Window Size", "required": false },
      { "key": "cycleTime", "type": "string", "label": "Cycle Time", "required": false }
    ]
  },
  {
    "name": "dies",
    "label": "Dies Information",
    "fields": [
      { "key": "transferDies", "type": "string", "label": "Transfer Dies", "required": false },
      { "key": "progressiveDies", "type": "string", "label": "Progressive Dies", "required": false },
      { "key": "blankingDies", "type": "string", "label": "Blanking Dies", "required": false }
    ]
  },
  {
    "name": "feed",
    "label": "Feed System",
    "fields": [
      { "key": "application", "type": "string", "label": "Application", "required": false },
      { "key": "model", "type": "string", "label": "Model", "required": false },
      { "key": "machineWidth", "type": "string", "label": "Machine Width", "required": false },
      { "key": "loopPit", "type": "string", "label": "Loop Pit", "required": false },
      { "key": "fullWidthRolls", "type": "string", "label": "Full Width Rolls", "required": false },
      { "key": "motor", "type": "string", "label": "Motor", "required": false },
      { "key": "amp", "type": "string", "label": "Amp", "required": false },
      { "key": "frictionInDie", "type": "string", "label": "Friction in Die", "required": false },
      { "key": "accelerationRate", "type": "string", "label": "Acceleration Rate", "required": false },
      { "key": "defaultAcceleration", "type": "string", "label": "Default Acceleration", "required": false },
      { "key": "chartMinLength", "type": "string", "label": "Chart Min Length", "required": false },
      { "key": "lengthIncrement", "type": "string", "label": "Length Increment", "required": false },
      { "key": "feedAngle1", "type": "string", "label": "Feed Angle 1", "required": false },
      { "key": "feedAngle2", "type": "string", "label": "Feed Angle 2", "required": false },
      { "key": "maximunVelocity", "type": "string", "label": "Maximum Velocity", "required": false },
      { "key": "acceleration", "type": "string", "label": "Acceleration", "required": false },
      { "key": "ratio", "type": "string", "label": "Ratio", "required": false },
      { "key": "typeOfLine", "type": "string", "label": "Type of Line", "required": false },
      { "key": "match", "type": "string", "label": "Match", "required": false },
      { "key": "reflInertia", "type": "string", "label": "Reflected Inertia", "required": false },
      { "key": "regen", "type": "string", "label": "Regen", "required": false },
      { "key": "windowDegrees", "type": "string", "label": "Window Degrees", "required": false },
      { "key": "direction", "type": "string", "label": "Direction", "required": false },
      { "key": "controls", "type": "string", "label": "Controls", "required": false },
      { "key": "controlsLevel", "type": "string", "label": "Controls Level", "required": false },
      { "key": "passline", "type": "string", "label": "Passline", "required": false },
      { "key": "lightGuageNonMarking", "type": "string", "label": "Light Gauge Non-Marking", "required": false },
      { "key": "nonMarking", "type": "string", "label": "Non-Marking", "required": false },
      { "key": "tableData", "type": "object", "label": "Table Data", "required": false }
    ]
  },
  {
    "name": "feedTorque",
    "label": "Feed Torque",
    "fields": [
      { "key": "motorPeak", "type": "string", "label": "Motor Peak", "required": false },
      { "key": "peak", "type": "string", "label": "Peak", "required": false },
      { "key": "frictional", "type": "string", "label": "Frictional", "required": false },
      { "key": "loop", "type": "string", "label": "Loop", "required": false },
      { "key": "settle", "type": "string", "label": "Settle", "required": false },
      { "key": "acceleration", "type": "string", "label": "Acceleration", "required": false }
    ]
  },
  {
    "name": "feedTorqueRms",
    "label": "Feed Torque RMS",
    "fields": [
      { "key": "motor", "type": "string", "label": "Motor", "required": false },
      { "key": "feedAngle1", "type": "string", "label": "Feed Angle 1", "required": false },
      { "key": "feedAngle2", "type": "string", "label": "Feed Angle 2", "required": false }
    ]
  },
  {
    "name": "feedPullThru",
    "label": "Feed Pull Through",
    "fields": [
      { "key": "isPullThru", "type": "string", "label": "Is Pull Through", "required": false },
      { "key": "straightenerRolls", "type": "string", "label": "Straightener Rolls", "required": false },
      { "key": "pinchRolls", "type": "string", "label": "Pinch Rolls", "required": false },
      { "key": "kConst", "type": "string", "label": "K Constant", "required": false },
      { "key": "straightenerTorque", "type": "string", "label": "Straightener Torque", "required": false }
    ]
  },
  {
    "name": "feedAverage",
    "label": "Feed Average",
    "fields": [
      { "key": "length", "type": "string", "label": "Length", "required": false },
      { "key": "spm", "type": "string", "label": "SPM", "required": false },
      { "key": "fpm", "type": "string", "label": "FPM", "required": false }
    ]
  },
  {
    "name": "feedMax",
    "label": "Feed Maximum",
    "fields": [
      { "key": "length", "type": "string", "label": "Length", "required": false },
      { "key": "spm", "type": "string", "label": "SPM", "required": false },
      { "key": "fpm", "type": "string", "label": "FPM", "required": false }
    ]
  },
  {
    "name": "feedMin",
    "label": "Feed Minimum",
    "fields": [
      { "key": "length", "type": "string", "label": "Length", "required": false },
      { "key": "spm", "type": "string", "label": "SPM", "required": false },
      { "key": "fpm", "type": "string", "label": "FPM", "required": false }
    ]
  },
  {
    "name": "straightener",
    "label": "Straightener",
    "fields": [
      { "key": "model", "type": "string", "label": "Model", "required": false },
      { "key": "straighteningRolls", "type": "string", "label": "Straightening Rolls", "required": false },
      { "key": "numberOfRolls", "type": "string", "label": "Number of Rolls", "required": false },
      { "key": "backupRolls", "type": "string", "label": "Backup Rolls", "required": false },
      { "key": "payoff", "type": "string", "label": "Payoff", "required": false },
      { "key": "width", "type": "string", "label": "Width", "required": false },
      { "key": "feedRate", "type": "string", "label": "Feed Rate", "required": false },
      { "key": "acceleration", "type": "string", "label": "Acceleration", "required": false },
      { "key": "horsepower", "type": "string", "label": "Horsepower", "required": false },
      { "key": "autoBrakeCompensation", "type": "string", "label": "Auto Brake Compensation", "required": false },
      { "key": "centerDistance", "type": "string", "label": "Center Distance", "required": false },
      { "key": "jackForceAvailable", "type": "string", "label": "Jack Force Available", "required": false },
      { "key": "modulus", "type": "string", "label": "Modulus", "required": false },
      { "key": "actualCoilWeight", "type": "string", "label": "Actual Coil Weight", "required": false },
      { "key": "coilOD", "type": "string", "label": "Coil OD", "required": false },
      { "key": "check", "type": "string", "label": "Check", "required": false }
    ]
  },
  {
    "name": "reel",
    "label": "Reel System",
    "fields": [
      { "key": "model", "type": "string", "label": "Model", "required": false },
      { "key": "horsepower", "type": "string", "label": "Horsepower", "required": false },
      { "key": "width", "type": "string", "label": "Width", "required": false },
      { "key": "ratio", "type": "string", "label": "Ratio", "required": false },
      { "key": "reelDriveOK", "type": "string", "label": "Reel Drive OK", "required": false },
      { "key": "style", "type": "string", "label": "Style", "required": false },
      { "key": "airPressureAvailable", "type": "string", "label": "Air Pressure Available", "required": false },
      { "key": "requiredDecelRate", "type": "string", "label": "Required Decel Rate", "required": false },
      { "key": "acceleration", "type": "string", "label": "Acceleration", "required": false },
      { "key": "speed", "type": "string", "label": "Speed", "required": false },
      { "key": "accelerationTime", "type": "string", "label": "Acceleration Time", "required": false },
      { "key": "coilWeight", "type": "string", "label": "Coil Weight", "required": false },
      { "key": "coilOD", "type": "string", "label": "Coil OD", "required": false },
      { "key": "dispReelMtr", "type": "string", "label": "Display Reel Meter", "required": false },
      { "key": "brakePadDiameter", "type": "string", "label": "Brake Pad Diameter", "required": false },
      { "key": "cylinderBore", "type": "string", "label": "Cylinder Bore", "required": false },
      { "key": "coefficientOfFriction", "type": "string", "label": "Coefficient of Friction", "required": false },
      { "key": "minMaterialWidth", "type": "string", "label": "Min Material Width", "required": false }
    ]
  },
  {
    "name": "shear",
    "label": "Shear System",
    "fields": [
      { "key": "strength", "type": "string", "label": "Strength", "required": false },
      { "key": "rakeOfBladePerFoot", "type": "string", "label": "Rake of Blade Per Foot", "required": false },
      { "key": "overlap", "type": "string", "label": "Overlap", "required": false },
      { "key": "bladeOpening", "type": "string", "label": "Blade Opening", "required": false },
      { "key": "percentOfPenetration", "type": "string", "label": "Percent of Penetration", "required": false },
      { "key": "angleOfBlade", "type": "string", "label": "Angle of Blade", "required": false }
    ]
  },
  {
    "name": "mount",
    "label": "Mounting",
    "fields": [
      { "key": "feederMountedToPress", "type": "string", "label": "Feeder Mounted to Press", "required": false },
      { "key": "adequateSupport", "type": "string", "label": "Adequate Support", "required": false },
      { "key": "customMounting", "type": "string", "label": "Custom Mounting", "required": false }
    ]
  }
];
