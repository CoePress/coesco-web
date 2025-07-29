import { useEffect } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import Select from "@/components/common/select";
import { PerformanceData } from "@/contexts/performance.context";
import { 
  REEL_MODEL_OPTIONS,
  REEL_HORSEPOWER_OPTIONS,
 } from "@/utils/select-options";

export interface ReelDriveProps {
  data: PerformanceData;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const ReelDrive: React.FC<ReelDriveProps> = ({ data, isEditing, onChange }) => {

  useEffect(() => {
    
  }, [onChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (!isEditing) return;
    
    const { name, value } = e.target;

    // Handle nested field updates based on field name pattern
    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      // Build the nested update object
      let updateObj: any = {};
      let current = updateObj;
      
      // Navigate to the correct nested level
      const sectionData = data[section as keyof typeof data];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = value;
      
      onChange(updateObj);
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...data.dates,
            date: value,
          },
        },
        reelModel: {
          reel: {
            ...data.reel,
            model: value,
          },
        },
        hp: {
          reel: {
            ...data.reel,
            horsepower: value,
          },
        },
        reelSize: {
          reel: {
            ...data.reel,
            width: value,
          },
        },
        reelMaxWidth: {
          reel: {
            ...data.reel,
            width: value,
          },
        },
        reelBrgDist: {
          reel: {
            ...data.reel,
            bearing: {
              ...data.reel?.bearing,
              distance: value,
            },
          },
        },
        reelFBrgDia: {
          reel: {
            ...data.reel,
            bearing: {
              ...data.reel?.bearing,
              diameter: {
                ...data.reel?.bearing?.diameter,
                front: value,
              },
            },
          },
        },
        reelRBrgDia: {
          reel: {
            ...data.reel,
            bearing: {
              ...data.reel?.bearing,
              diameter: {
                ...data.reel?.bearing?.diameter,
                rear: value,
              },
            },
          },
        },
        mandrelDiameter: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              diameter: value,
            },
          },
        },
        mandrelLength: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              length: value,
            },
          },
        },
        mandrelMaxRPM: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              maxRPM: value,
            },
          },
        },
        mandrelRPMFull: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              RpmFull: value,
            },
          },
        },
        mandrelWeight: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              weight: value,
            },
          },
        },
        mandrelInertia: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              inertia: value,
            },
          },
        },
        mandrelReflInert: {
          reel: {
            ...data.reel,
            mandrel: {
              ...data.reel?.mandrel,
              reflInertia: value,
            },
          },
        },
        backplateDiameter: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              diameter: value,
            },
          },
        },
        backplateThickness: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              thickness: value,
            },
          },
        },
        backplateWeight: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              weight: value,
            },
          },
        },
        backplateInertia: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              inertia: value,
            },
          },
        },
        backplateReflInert: {
          reel: {
            ...data.reel,
            backplate: {
              ...data.reel?.backplate,
              reflInertia: value,
            },
          },
        },
        coilDensity: {
          coil: {
            ...data.coil,
            density: value,
          },
        },
        coilOD: {
          coil: {
            ...data.coil,
            maxCoilOD: value,
          },
        },
        coilID: {
          coil: {
            ...data.coil,
            coilID: value,
          },
        },
        coilWidth: {
          material: {
            ...data.material,
            coilWidth: value,
          },
        },
        coilWeight: {
          coil: {
            ...data.coil,
            maxCoilWeight: value,
          },
        },
        coilInertia: {
          reel: {
            ...data.reel,
            // Coil inertia would be calculated field
          },
        },
        coilReflInert: {
          reel: {
            ...data.reel,
            // Coil reflected inertia would be calculated field
          },
        },
        reducerRatio: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              ratio: value,
            },
          },
        },
        reducerEfficiency: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              efficiency: value,
            },
          },
        },
        reducerDriving: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              driving: value,
            },
          },
        },
        reducerBackdriving: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              backdriving: value,
            },
          },
        },
        reducerInertia: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              inertia: value,
            },
          },
        },
        reducerReflInert: {
          reel: {
            ...data.reel,
            reducer: {
              ...data.reel?.reducer,
              reflInertia: value,
            },
          },
        },
        chainRatio: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              ratio: value,
            },
          },
        },
        chainSprktOD: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              sprktOD: value,
            },
          },
        },
        chainSprktThk: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              sprktThickness: value,
            },
          },
        },
        chainWeight: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              weight: value,
            },
          },
        },
        chainInertia: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              inertia: value,
            },
          },
        },
        chainReflInert: {
          reel: {
            ...data.reel,
            chain: {
              ...data.reel?.chain,
              reflInertia: value,
            },
          },
        },
        totalRatio: {
          reel: {
            ...data.reel,
            ratio: value,
          },
        },
        totalReflInertiaEmpty: {
          reel: {
            ...data.reel,
            totalReflInertia: {
              ...data.reel?.totalReflInertia,
              empty: value,
            },
          },
        },
        totalReflInertiaFull: {
          reel: {
            ...data.reel,
            totalReflInertia: {
              ...data.reel?.totalReflInertia,
              full: value,
            },
          },
        },
        motorHP: {
          reel: {
            ...data.reel,
            horsepower: value,
          },
        },
        motorInertia: {
          reel: {
            ...data.reel,
            motor: {
              ...data.reel?.motor,
              inertia: value,
            },
          },
        },
        motorBaseRPM: {
          reel: {
            ...data.reel,
            motor: {
              ...data.reel?.motor,
              rpm: {
                ...data.reel?.motor?.rpm,
                base: value,
              },
            },
          },
        },
        motorRPMFull: {
          reel: {
            ...data.reel,
            motor: {
              ...data.reel?.motor,
              rpm: {
                ...data.reel?.motor?.rpm,
                full: value,
              },
            },
          },
        },
        frictionRBrgMand: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                mandrel: {
                  ...data.reel?.friction?.bearing?.mandrel,
                  rear: value,
                },
              },
            },
          },
        },
        frictionFBrgMand: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                mandrel: {
                  ...data.reel?.friction?.bearing?.mandrel,
                  front: value,
                },
              },
            },
          },
        },
        frictionFBrgCoil: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                coil: {
                  ...data.reel?.friction?.bearing?.coil,
                  front: value,
                },
              },
            },
          },
        },
        frictionTotalEmpty: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                total: {
                  ...data.reel?.friction?.bearing?.total,
                  empty: value,
                },
              },
            },
          },
        },
        frictionTotalFull: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                total: {
                  ...data.reel?.friction?.bearing?.total,
                  full: value,
                },
              },
            },
          },
        },
        frictionReflEmpty: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                refl: {
                  ...data.reel?.friction?.bearing?.refl,
                  empty: value,
                },
              },
            },
          },
        },
        frictionReflFull: {
          reel: {
            ...data.reel,
            friction: {
              ...data.reel?.friction,
              bearing: {
                ...data.reel?.friction?.bearing,
                refl: {
                  ...data.reel?.friction?.bearing?.refl,
                  full: value,
                },
              },
            },
          },
        },
        speed: {
          reel: {
            ...data.reel,
            speed: value,
          },
        },
        accelRate: {
          reel: {
            ...data.reel,
            motorization: {
              ...data.reel?.motorization,
              accelRate: value,
            },
          },
        },
        accelTime: {
          reel: {
            ...data.reel,
            accelerationTime: value,
          },
        },
        torqueEmpty: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              empty: {
                ...data.reel?.torque?.empty,
                torque: value,
              },
            },
          },
        },
        torqueFull: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              full: {
                ...data.reel?.torque?.full,
                torque: value,
              },
            },
          },
        },
        hpReqdEmpty: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              empty: {
                ...data.reel?.torque?.empty,
                horsepowerRequired: value,
              },
            },
          },
        },
        hpReqdFull: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              full: {
                ...data.reel?.torque?.full,
                horsepowerRequired: value,
              },
            },
          },
        },
        regenEmpty: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              empty: {
                ...data.reel?.torque?.empty,
                regen: value,
              },
            },
          },
        },
        regenFull: {
          reel: {
            ...data.reel,
            torque: {
              ...data.reel?.torque,
              full: {
                ...data.reel?.torque?.full,
                regen: value,
              },
            },
          },
        },
        usePulloff: {
          // This might be a note field - could add to specialConsiderations
          specialConsiderations: (data.specialConsiderations || "") + (value ? `\nUSE PULLOFF: ${value}` : ""),
        },
      };

      if (fieldMappings[name]) {
        onChange(fieldMappings[name]);
      }
    }
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      {/* Customer and Date Info */}
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Customer & Date
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Customer"
            name="customer"
            value={data.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={data.dates?.date || ""}
            onChange={handleChange}
          />
        </div>
      </Card>
      <Card className="mb-0 p-4">
        <Text
          as="h3"
          className="mb-4 text-lg font-medium">
          Model & HP
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Select
            label="Reel Model"
            name="reel.model"
            value={data.reel?.model !== undefined 
                && data.reel?.model !== null ? String(data.reel.model) : ""}
            onChange={handleChange}
            options={REEL_MODEL_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
          <Select
            label="HP"
            name="hp"
            value={data.reel?.horsepower !== undefined
                && data.reel?.horsepower !== null ? String(data.reel.horsepower) : ""}
            onChange={handleChange}
            options={REEL_HORSEPOWER_OPTIONS.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            }))}
          />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* REEL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Reel
          </Text>
          <div className="space-y-2">
            <Input
              id="reelSize"
              name="reelSize"
              label="SIZE"
              value={data.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelMaxWidth"
              name="reelMaxWidth"
              label="MAX WIDTH"
              value={data.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelBrgDist"
              name="reelBrgDist"
              label="BRG. DIST."
              value={data.reel?.bearing?.distance || ""}
              onChange={handleChange}
            />
            <Input
              id="reelFBrgDia"
              name="reelFBrgDia"
              label="F. BRG. DIA."
              value={data.reel?.bearing?.diameter?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="reelRBrgDia"
              name="reelRBrgDia"
              label="R. BRG. DIA."
              value={data.reel?.bearing?.diameter?.rear || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* MANDREL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Mandrel
          </Text>
          <div className="space-y-2">
            <Input
              id="mandrelDiameter"
              name="mandrelDiameter"
              label="DIAMETER"
              value={data.reel?.mandrel?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelLength"
              name="mandrelLength"
              label="LENGTH"
              value={data.reel?.mandrel?.length || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelMaxRPM"
              name="mandrelMaxRPM"
              label="MAX RPM"
              value={data.reel?.mandrel?.maxRPM || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelRPMFull"
              name="mandrelRPMFull"
              label="RPM FULL"
              value={data.reel?.mandrel?.RpmFull || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelWeight"
              name="mandrelWeight"
              label="WEIGHT"
              value={data.reel?.mandrel?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelInertia"
              name="mandrelInertia"
              label="INERTIA"
              value={data.reel?.mandrel?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelReflInert"
              name="mandrelReflInert"
              label="REFL. INERT."
              value={data.reel?.mandrel?.reflInertia || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* BACKPLATE */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Backplate
          </Text>
          <div className="space-y-2">
            <Input
              id="backplateDiameter"
              name="backplateDiameter"
              label="DIAMETER"
              value={data.reel?.backplate?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateThickness"
              name="backplateThickness"
              label="THICKNESS"
              value={data.reel?.backplate?.thickness || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateWeight"
              name="backplateWeight"
              label="WEIGHT"
              value={data.reel?.backplate?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateInertia"
              name="backplateInertia"
              label="INERTIA"
              value={data.reel?.backplate?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateReflInert"
              name="backplateReflInert"
              label="REFL. INERT."
              value={data.reel?.backplate?.reflInertia || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* COIL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Coil
          </Text>
          <div className="space-y-2">
            <Input
              id="coilDensity"
              name="coilDensity"
              label="DENSITY"
              value={data.coil?.density || ""}
              onChange={handleChange}
            />
            <Input
              id="coilOD"
              name="coilOD"
              label="O.D."
              value={data.coil?.maxCoilOD || ""}
              onChange={handleChange}
            />
            <Input
              id="coilID"
              name="coilID"
              label="I.D."
              value={data.coil?.coilID || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWidth"
              name="coilWidth"
              label="WIDTH"
              value={data.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWeight"
              name="coilWeight"
              label="WEIGHT"
              value={data.coil?.maxCoilWeight || ""}
              onChange={handleChange}
            />
            <Input
              id="coilInertia"
              name="coilInertia"
              label="INERTIA"
              value=""
              onChange={handleChange}
              readOnly
            />
            <Input
              id="coilReflInert"
              name="coilReflInert"
              label="REFL. INERT."
              value=""
              onChange={handleChange}
              readOnly
            />
          </div>
        </Card>
        {/* REDUCER */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Reducer
          </Text>
          <div className="space-y-2">
            <Input
              id="reducerRatio"
              name="reducerRatio"
              label="RATIO"
              value={data.reel?.reducer?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerEfficiency"
              name="reducerEfficiency"
              label="EFFICIENCY"
              value={data.reel?.reducer?.efficiency || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerDriving"
              name="reducerDriving"
              label="DRIVING"
              value={data.reel?.reducer?.driving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerBackdriving"
              name="reducerBackdriving"
              label="BACKDRIVING"
              value={data.reel?.reducer?.backdriving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerInertia"
              name="reducerInertia"
              label="INERTIA"
              value={data.reel?.reducer?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerReflInert"
              name="reducerReflInert"
              label="REFL. INERT."
              value={data.reel?.reducer?.reflInertia || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* CHAIN */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Chain
          </Text>
          <div className="space-y-2">
            <Input
              id="chainRatio"
              name="chainRatio"
              label="RATIO"
              value={data.reel?.chain?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktOD"
              name="chainSprktOD"
              label="SPRK. O.D."
              value={data.reel?.chain?.sprktOD || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktThk"
              name="chainSprktThk"
              label="SPRK. THK."
              value={data.reel?.chain?.sprktThickness || ""}
              onChange={handleChange}
            />
            <Input
              id="chainWeight"
              name="chainWeight"
              label="WEIGHT"
              value={data.reel?.chain?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="chainInertia"
              name="chainInertia"
              label="INERTIA"
              value={data.reel?.chain?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="chainReflInert"
              name="chainReflInert"
              label="REFL. INERT."
              value={data.reel?.chain?.reflInertia || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* TOTAL */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Total
          </Text>
          <div className="space-y-2">
            <Input
              id="totalRatio"
              name="totalRatio"
              label="RATIO"
              value={data.reel?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaEmpty"
              name="totalReflInertiaEmpty"
              label="TOTAL REFL. INERTIA EMPTY"
              value={data.reel?.totalReflInertia?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaFull"
              name="totalReflInertiaFull"
              label="TOTAL REFL. INERTIA FULL"
              value={data.reel?.totalReflInertia?.full || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* MOTOR */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Motor
          </Text>
          <div className="space-y-2">
            <Input
              id="motorHP"
              name="motorHP"
              label="HP"
              value={data.reel?.horsepower || ""}
              onChange={handleChange}
            />
            <Input
              id="motorInertia"
              name="motorInertia"
              label="INERTIA"
              value={data.reel?.motor?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="motorBaseRPM"
              name="motorBaseRPM"
              label="BASE RPM"
              value={data.reel?.motor?.rpm?.base || ""}
              onChange={handleChange}
            />
            <Input
              id="motorRPMFull"
              name="motorRPMFull"
              label="RPM FULL"
              value={data.reel?.motor?.rpm?.full || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* FRICTION */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Friction
          </Text>
          <div className="space-y-2">
            <Input
              id="frictionRBrgMand"
              name="frictionRBrgMand"
              label="R. BRG. MAND."
              value={data.reel?.friction?.bearing?.mandrel?.rear || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgMand"
              name="frictionFBrgMand"
              label="F. BRG. MAND."
              value={data.reel?.friction?.bearing?.mandrel?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgCoil"
              name="frictionFBrgCoil"
              label="F. BRG. COIL"
              value={data.reel?.friction?.bearing?.coil?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalEmpty"
              name="frictionTotalEmpty"
              label="TOTAL EMPTY"
              value={data.reel?.friction?.bearing?.total?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalFull"
              name="frictionTotalFull"
              label="TOTAL FULL"
              value={data.reel?.friction?.bearing?.total?.full || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflEmpty"
              name="frictionReflEmpty"
              label="REFL. EMPTY"
              value={data.reel?.friction?.bearing?.refl?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflFull"
              name="frictionReflFull"
              label="REFL. FULL"
              value={data.reel?.friction?.bearing?.refl?.full || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* SPEED & ACCELERATION */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Speed & Acceleration
          </Text>
          <div className="space-y-2">
            <Input
              id="speed"
              name="speed"
              label="SPEED"
              value={data.reel?.speed || ""}
              onChange={handleChange}
            />
            <Input
              id="accelRate"
              name="accelRate"
              label="ACCEL RATE"
              value={data.reel?.motorization?.accelRate || ""}
              onChange={handleChange}
            />
            <Input
              id="accelTime"
              name="accelTime"
              label="ACCEL TIME"
              value={data.reel?.accelerationTime || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* TORQUE */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Torque
          </Text>
          <div className="space-y-2">
            <Input
              id="torqueEmpty"
              name="torqueEmpty"
              label="EMPTY"
              value={data.reel?.torque?.empty?.torque || ""}
              onChange={handleChange}
            />
            <Input
              id="torqueFull"
              name="torqueFull"
              label="FULL"
              value={data.reel?.torque?.full?.torque || ""}
              onChange={handleChange}
            />
          </div>
        </Card>
        {/* HP REQ'D */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            HP Req'd
          </Text>
          <div className="space-y-2">
            <Input
              id="hpReqdEmpty"
              name="hpReqdEmpty"
              label="EMPTY"
              value={data.reel?.torque?.empty?.horsepowerRequired || ""}
              onChange={handleChange}
            />
            <Input
              id="hpReqdFull"
              name="hpReqdFull"
              label="FULL"
              value={data.reel?.torque?.full?.horsepowerRequired || ""}
              onChange={handleChange}
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">OK:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                OK
              </span>
            </div>
          </div>
        </Card>
        {/* REGEN */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Regen
          </Text>
          <div className="space-y-2">
            <Input
              id="regenEmpty"
              name="regenEmpty"
              label="EMPTY"
              value={data.reel?.torque?.empty?.regen || ""}
              onChange={handleChange}
            />
            <Input
              id="regenFull"
              name="regenFull"
              label="FULL"
              value={data.reel?.torque?.full?.regen || ""}
              onChange={handleChange}
            />
            <div className="flex items-center">
              <label className="w-36 font-medium">YES:</label>
              <span className="bg-green-100 text-green-800 font-semibold px-2 py-1 rounded">
                YES
              </span>
            </div>
          </div>
        </Card>
        {/* NOTES */}
        <Card className="p-4">
          <Text
            as="h3"
            className="mb-4 text-lg font-medium">
            Notes
          </Text>
          <div className="space-y-2">
            <Input
              id="usePulloff"
              name="usePulloff"
              label="USE PULLOFF"
              value=""
              onChange={handleChange}
            />
          </div>
        </Card>
      </div>
      {status && (
        <div className="text-center text-xs text-primary mt-2">{status}</div>
      )}
    </div>
  );
};

export default ReelDrive;