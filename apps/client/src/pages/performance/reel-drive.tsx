import { useState, useEffect } from "react";
import Card from "@/components/common/card";
import Input from "@/components/common/input";
import Text from "@/components/common/text";
import { useCreateReelDrive } from "@/hooks/performance/use-create-reel-drive";
import { useGetReelDrive } from "@/hooks/performance/use-get-reel-drive";
import { usePerformanceSheet } from "@/contexts/performance.context";
import { 
  mapBackendToReelDrive,
  mapBackendToRFQ,
  mapBackendToTDDBHD 
} from "@/utils/universal-mapping";
import { useGetRFQ } from "@/hooks/performance/use-get-rfq";
import { useGetTDDBHD } from "@/hooks/performance/use-get-tddbhd";

const ReelDrive = () => {
  const { 
    performanceData, 
    updatePerformanceData,
  } = usePerformanceSheet();
  const {
    status: backendStatus,
  } = useCreateReelDrive();
  const {
    status: getBackendStatus,
    fetchedReelDrive,
  } = useGetReelDrive();
  const { getRFQ } = useGetRFQ();
  const { getTDDBHD } = useGetTDDBHD();
  const [status] = useState("");

  useEffect(() => {
    if (fetchedReelDrive) {
      const data =
        typeof fetchedReelDrive === "object" && "reel_drive" in fetchedReelDrive && fetchedReelDrive.reel_drive
          ? (fetchedReelDrive as any).reel_drive
          : fetchedReelDrive;
      
      // Map backend Reel Drive data to new nested structure using universal mapping
      const mappedData = mapBackendToReelDrive(data, performanceData);
      updatePerformanceData(mappedData);
      
      // Fetch related data
      const refNum = mappedData.referenceNumber || performanceData.referenceNumber;
      if (refNum) {
        console.log("Fetching RFQ with refNum:", refNum);
        getRFQ(refNum).then((rfqData) => {
          console.log("RFQ backend data:", rfqData);
          if (rfqData) {
            // Map RFQ data to nested structure using universal mapping
            const rfqMappedData = mapBackendToRFQ(rfqData, performanceData);
            updatePerformanceData(rfqMappedData);
            console.log("RFQ data mapped:", rfqMappedData);
          }
        });

        console.log("Fetching TDDBHD with refNum:", refNum);
        getTDDBHD(refNum).then((tddbhdData) => {
          console.log("TDDBHD backend data:", tddbhdData);
          if (tddbhdData) {
            // Map TDDBHD data to nested structure using universal mapping
            const tddbhdMappedData = mapBackendToTDDBHD(tddbhdData, performanceData);
            updatePerformanceData(tddbhdMappedData);
            console.log("TDDBHD data mapped:", tddbhdMappedData);
          }
        });
      }
    }
  }, [fetchedReelDrive, updatePerformanceData, getRFQ, getTDDBHD]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle nested field updates based on field name pattern
    if (name.includes(".")) {
      const parts = name.split(".");
      const [section, ...rest] = parts;
      
      // Build the nested update object
      let updateObj: any = {};
      let current = updateObj;
      
      // Navigate to the correct nested level
      const sectionData = performanceData[section as keyof typeof performanceData];
      current[section] = { ...(typeof sectionData === "object" && sectionData !== null ? sectionData : {}) };
      current = current[section];
      
      // Handle deeper nesting
      for (let i = 0; i < rest.length - 1; i++) {
        current[rest[i]] = { ...current[rest[i]] };
        current = current[rest[i]];
      }
      
      // Set the final value
      current[rest[rest.length - 1]] = value;
      
      updatePerformanceData(updateObj);
    } else {
      // Handle legacy field names that map to nested structure
      const fieldMappings: { [key: string]: any } = {
        customer: {
          customer: value,
        },
        date: {
          dates: {
            ...performanceData.dates,
            date: value,
          },
        },
        reelModel: {
          reel: {
            ...performanceData.reel,
            model: value,
          },
        },
        hp: {
          reel: {
            ...performanceData.reel,
            horsepower: value,
          },
        },
        reelSize: {
          reel: {
            ...performanceData.reel,
            width: value,
          },
        },
        reelMaxWidth: {
          reel: {
            ...performanceData.reel,
            width: value,
          },
        },
        reelBrgDist: {
          reel: {
            ...performanceData.reel,
            bearing: {
              ...performanceData.reel?.bearing,
              distance: value,
            },
          },
        },
        reelFBrgDia: {
          reel: {
            ...performanceData.reel,
            bearing: {
              ...performanceData.reel?.bearing,
              diameter: {
                ...performanceData.reel?.bearing?.diameter,
                front: value,
              },
            },
          },
        },
        reelRBrgDia: {
          reel: {
            ...performanceData.reel,
            bearing: {
              ...performanceData.reel?.bearing,
              diameter: {
                ...performanceData.reel?.bearing?.diameter,
                rear: value,
              },
            },
          },
        },
        mandrelDiameter: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              diameter: value,
            },
          },
        },
        mandrelLength: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              length: value,
            },
          },
        },
        mandrelMaxRPM: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              maxRPM: value,
            },
          },
        },
        mandrelRPMFull: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              RpmFull: value,
            },
          },
        },
        mandrelWeight: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              weight: value,
            },
          },
        },
        mandrelInertia: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              inertia: value,
            },
          },
        },
        mandrelReflInert: {
          reel: {
            ...performanceData.reel,
            mandrel: {
              ...performanceData.reel?.mandrel,
              reflInertia: value,
            },
          },
        },
        backplateDiameter: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              diameter: value,
            },
          },
        },
        backplateThickness: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              thickness: value,
            },
          },
        },
        backplateWeight: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              weight: value,
            },
          },
        },
        backplateInertia: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              inertia: value,
            },
          },
        },
        backplateReflInert: {
          reel: {
            ...performanceData.reel,
            backplate: {
              ...performanceData.reel?.backplate,
              reflInertia: value,
            },
          },
        },
        coilDensity: {
          coil: {
            ...performanceData.coil,
            density: value,
          },
        },
        coilOD: {
          coil: {
            ...performanceData.coil,
            maxCoilOD: value,
          },
        },
        coilID: {
          coil: {
            ...performanceData.coil,
            coilID: value,
          },
        },
        coilWidth: {
          material: {
            ...performanceData.material,
            coilWidth: value,
          },
        },
        coilWeight: {
          coil: {
            ...performanceData.coil,
            maxCoilWeight: value,
          },
        },
        coilInertia: {
          reel: {
            ...performanceData.reel,
            // Coil inertia would be calculated field
          },
        },
        coilReflInert: {
          reel: {
            ...performanceData.reel,
            // Coil reflected inertia would be calculated field
          },
        },
        reducerRatio: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              ratio: value,
            },
          },
        },
        reducerEfficiency: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              efficiency: value,
            },
          },
        },
        reducerDriving: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              driving: value,
            },
          },
        },
        reducerBackdriving: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              backdriving: value,
            },
          },
        },
        reducerInertia: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              inertia: value,
            },
          },
        },
        reducerReflInert: {
          reel: {
            ...performanceData.reel,
            reducer: {
              ...performanceData.reel?.reducer,
              reflInertia: value,
            },
          },
        },
        chainRatio: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              ratio: value,
            },
          },
        },
        chainSprktOD: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              sprktOD: value,
            },
          },
        },
        chainSprktThk: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              sprktThickness: value,
            },
          },
        },
        chainWeight: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              weight: value,
            },
          },
        },
        chainInertia: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              inertia: value,
            },
          },
        },
        chainReflInert: {
          reel: {
            ...performanceData.reel,
            chain: {
              ...performanceData.reel?.chain,
              reflInertia: value,
            },
          },
        },
        totalRatio: {
          reel: {
            ...performanceData.reel,
            ratio: value,
          },
        },
        totalReflInertiaEmpty: {
          reel: {
            ...performanceData.reel,
            totalReflInertia: {
              ...performanceData.reel?.totalReflInertia,
              empty: value,
            },
          },
        },
        totalReflInertiaFull: {
          reel: {
            ...performanceData.reel,
            totalReflInertia: {
              ...performanceData.reel?.totalReflInertia,
              full: value,
            },
          },
        },
        motorHP: {
          reel: {
            ...performanceData.reel,
            horsepower: value,
          },
        },
        motorInertia: {
          reel: {
            ...performanceData.reel,
            motor: {
              ...performanceData.reel?.motor,
              inertia: value,
            },
          },
        },
        motorBaseRPM: {
          reel: {
            ...performanceData.reel,
            motor: {
              ...performanceData.reel?.motor,
              rpm: {
                ...performanceData.reel?.motor?.rpm,
                base: value,
              },
            },
          },
        },
        motorRPMFull: {
          reel: {
            ...performanceData.reel,
            motor: {
              ...performanceData.reel?.motor,
              rpm: {
                ...performanceData.reel?.motor?.rpm,
                full: value,
              },
            },
          },
        },
        frictionRBrgMand: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                mandrel: {
                  ...performanceData.reel?.friction?.bearing?.mandrel,
                  rear: value,
                },
              },
            },
          },
        },
        frictionFBrgMand: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                mandrel: {
                  ...performanceData.reel?.friction?.bearing?.mandrel,
                  front: value,
                },
              },
            },
          },
        },
        frictionFBrgCoil: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                coil: {
                  ...performanceData.reel?.friction?.bearing?.coil,
                  front: value,
                },
              },
            },
          },
        },
        frictionTotalEmpty: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                total: {
                  ...performanceData.reel?.friction?.bearing?.total,
                  empty: value,
                },
              },
            },
          },
        },
        frictionTotalFull: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                total: {
                  ...performanceData.reel?.friction?.bearing?.total,
                  full: value,
                },
              },
            },
          },
        },
        frictionReflEmpty: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                refl: {
                  ...performanceData.reel?.friction?.bearing?.refl,
                  empty: value,
                },
              },
            },
          },
        },
        frictionReflFull: {
          reel: {
            ...performanceData.reel,
            friction: {
              ...performanceData.reel?.friction,
              bearing: {
                ...performanceData.reel?.friction?.bearing,
                refl: {
                  ...performanceData.reel?.friction?.bearing?.refl,
                  full: value,
                },
              },
            },
          },
        },
        speed: {
          reel: {
            ...performanceData.reel,
            speed: value,
          },
        },
        accelRate: {
          reel: {
            ...performanceData.reel,
            motorization: {
              ...performanceData.reel?.motorization,
              accelRate: value,
            },
          },
        },
        accelTime: {
          reel: {
            ...performanceData.reel,
            accelerationTime: value,
          },
        },
        torqueEmpty: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              empty: {
                ...performanceData.reel?.torque?.empty,
                torque: value,
              },
            },
          },
        },
        torqueFull: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              full: {
                ...performanceData.reel?.torque?.full,
                torque: value,
              },
            },
          },
        },
        hpReqdEmpty: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              empty: {
                ...performanceData.reel?.torque?.empty,
                horsepowerRequired: value,
              },
            },
          },
        },
        hpReqdFull: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              full: {
                ...performanceData.reel?.torque?.full,
                horsepowerRequired: value,
              },
            },
          },
        },
        regenEmpty: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              empty: {
                ...performanceData.reel?.torque?.empty,
                regen: value,
              },
            },
          },
        },
        regenFull: {
          reel: {
            ...performanceData.reel,
            torque: {
              ...performanceData.reel?.torque,
              full: {
                ...performanceData.reel?.torque?.full,
                regen: value,
              },
            },
          },
        },
        usePulloff: {
          // This might be a note field - could add to specialConsiderations
          specialConsiderations: (performanceData.specialConsiderations || "") + (value ? `\nUSE PULLOFF: ${value}` : ""),
        },
      };

      if (fieldMappings[name]) {
        updatePerformanceData(fieldMappings[name]);
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
            value={performanceData.customer || ""}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={performanceData.dates?.date || ""}
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
          <Input
            label="Reel Model"
            name="reelModel"
            value={performanceData.reel?.model || ""}
            onChange={handleChange}
          />
          <Input
            label="HP"
            name="hp"
            value={performanceData.reel?.horsepower || ""}
            onChange={handleChange}
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
              value={performanceData.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelMaxWidth"
              name="reelMaxWidth"
              label="MAX WIDTH"
              value={performanceData.reel?.width || ""}
              onChange={handleChange}
            />
            <Input
              id="reelBrgDist"
              name="reelBrgDist"
              label="BRG. DIST."
              value={performanceData.reel?.bearing?.distance || ""}
              onChange={handleChange}
            />
            <Input
              id="reelFBrgDia"
              name="reelFBrgDia"
              label="F. BRG. DIA."
              value={performanceData.reel?.bearing?.diameter?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="reelRBrgDia"
              name="reelRBrgDia"
              label="R. BRG. DIA."
              value={performanceData.reel?.bearing?.diameter?.rear || ""}
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
              value={performanceData.reel?.mandrel?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelLength"
              name="mandrelLength"
              label="LENGTH"
              value={performanceData.reel?.mandrel?.length || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelMaxRPM"
              name="mandrelMaxRPM"
              label="MAX RPM"
              value={performanceData.reel?.mandrel?.maxRPM || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelRPMFull"
              name="mandrelRPMFull"
              label="RPM FULL"
              value={performanceData.reel?.mandrel?.RpmFull || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelWeight"
              name="mandrelWeight"
              label="WEIGHT"
              value={performanceData.reel?.mandrel?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelInertia"
              name="mandrelInertia"
              label="INERTIA"
              value={performanceData.reel?.mandrel?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="mandrelReflInert"
              name="mandrelReflInert"
              label="REFL. INERT."
              value={performanceData.reel?.mandrel?.reflInertia || ""}
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
              value={performanceData.reel?.backplate?.diameter || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateThickness"
              name="backplateThickness"
              label="THICKNESS"
              value={performanceData.reel?.backplate?.thickness || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateWeight"
              name="backplateWeight"
              label="WEIGHT"
              value={performanceData.reel?.backplate?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateInertia"
              name="backplateInertia"
              label="INERTIA"
              value={performanceData.reel?.backplate?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="backplateReflInert"
              name="backplateReflInert"
              label="REFL. INERT."
              value={performanceData.reel?.backplate?.reflInertia || ""}
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
              value={performanceData.coil?.density || ""}
              onChange={handleChange}
            />
            <Input
              id="coilOD"
              name="coilOD"
              label="O.D."
              value={performanceData.coil?.maxCoilOD || ""}
              onChange={handleChange}
            />
            <Input
              id="coilID"
              name="coilID"
              label="I.D."
              value={performanceData.coil?.coilID || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWidth"
              name="coilWidth"
              label="WIDTH"
              value={performanceData.material?.coilWidth || ""}
              onChange={handleChange}
            />
            <Input
              id="coilWeight"
              name="coilWeight"
              label="WEIGHT"
              value={performanceData.coil?.maxCoilWeight || ""}
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
              value={performanceData.reel?.reducer?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerEfficiency"
              name="reducerEfficiency"
              label="EFFICIENCY"
              value={performanceData.reel?.reducer?.efficiency || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerDriving"
              name="reducerDriving"
              label="DRIVING"
              value={performanceData.reel?.reducer?.driving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerBackdriving"
              name="reducerBackdriving"
              label="BACKDRIVING"
              value={performanceData.reel?.reducer?.backdriving || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerInertia"
              name="reducerInertia"
              label="INERTIA"
              value={performanceData.reel?.reducer?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="reducerReflInert"
              name="reducerReflInert"
              label="REFL. INERT."
              value={performanceData.reel?.reducer?.reflInertia || ""}
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
              value={performanceData.reel?.chain?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktOD"
              name="chainSprktOD"
              label="SPRK. O.D."
              value={performanceData.reel?.chain?.sprktOD || ""}
              onChange={handleChange}
            />
            <Input
              id="chainSprktThk"
              name="chainSprktThk"
              label="SPRK. THK."
              value={performanceData.reel?.chain?.sprktThickness || ""}
              onChange={handleChange}
            />
            <Input
              id="chainWeight"
              name="chainWeight"
              label="WEIGHT"
              value={performanceData.reel?.chain?.weight || ""}
              onChange={handleChange}
            />
            <Input
              id="chainInertia"
              name="chainInertia"
              label="INERTIA"
              value={performanceData.reel?.chain?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="chainReflInert"
              name="chainReflInert"
              label="REFL. INERT."
              value={performanceData.reel?.chain?.reflInertia || ""}
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
              value={performanceData.reel?.ratio || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaEmpty"
              name="totalReflInertiaEmpty"
              label="TOTAL REFL. INERTIA EMPTY"
              value={performanceData.reel?.totalReflInertia?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="totalReflInertiaFull"
              name="totalReflInertiaFull"
              label="TOTAL REFL. INERTIA FULL"
              value={performanceData.reel?.totalReflInertia?.full || ""}
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
              value={performanceData.reel?.horsepower || ""}
              onChange={handleChange}
            />
            <Input
              id="motorInertia"
              name="motorInertia"
              label="INERTIA"
              value={performanceData.reel?.motor?.inertia || ""}
              onChange={handleChange}
            />
            <Input
              id="motorBaseRPM"
              name="motorBaseRPM"
              label="BASE RPM"
              value={performanceData.reel?.motor?.rpm?.base || ""}
              onChange={handleChange}
            />
            <Input
              id="motorRPMFull"
              name="motorRPMFull"
              label="RPM FULL"
              value={performanceData.reel?.motor?.rpm?.full || ""}
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
              value={performanceData.reel?.friction?.bearing?.mandrel?.rear || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgMand"
              name="frictionFBrgMand"
              label="F. BRG. MAND."
              value={performanceData.reel?.friction?.bearing?.mandrel?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionFBrgCoil"
              name="frictionFBrgCoil"
              label="F. BRG. COIL"
              value={performanceData.reel?.friction?.bearing?.coil?.front || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalEmpty"
              name="frictionTotalEmpty"
              label="TOTAL EMPTY"
              value={performanceData.reel?.friction?.bearing?.total?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionTotalFull"
              name="frictionTotalFull"
              label="TOTAL FULL"
              value={performanceData.reel?.friction?.bearing?.total?.full || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflEmpty"
              name="frictionReflEmpty"
              label="REFL. EMPTY"
              value={performanceData.reel?.friction?.bearing?.refl?.empty || ""}
              onChange={handleChange}
            />
            <Input
              id="frictionReflFull"
              name="frictionReflFull"
              label="REFL. FULL"
              value={performanceData.reel?.friction?.bearing?.refl?.full || ""}
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
              value={performanceData.reel?.speed || ""}
              onChange={handleChange}
            />
            <Input
              id="accelRate"
              name="accelRate"
              label="ACCEL RATE"
              value={performanceData.reel?.motorization?.accelRate || ""}
              onChange={handleChange}
            />
            <Input
              id="accelTime"
              name="accelTime"
              label="ACCEL TIME"
              value={performanceData.reel?.accelerationTime || ""}
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
              value={performanceData.reel?.torque?.empty?.torque || ""}
              onChange={handleChange}
            />
            <Input
              id="torqueFull"
              name="torqueFull"
              label="FULL"
              value={performanceData.reel?.torque?.full?.torque || ""}
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
              value={performanceData.reel?.torque?.empty?.horsepowerRequired || ""}
              onChange={handleChange}
            />
            <Input
              id="hpReqdFull"
              name="hpReqdFull"
              label="FULL"
              value={performanceData.reel?.torque?.full?.horsepowerRequired || ""}
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
              value={performanceData.reel?.torque?.empty?.regen || ""}
              onChange={handleChange}
            />
            <Input
              id="regenFull"
              name="regenFull"
              label="FULL"
              value={performanceData.reel?.torque?.full?.regen || ""}
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
      {backendStatus && (
        <div className="text-center text-xs text-primary mt-2">
          {backendStatus}
        </div>
      )}
      {getBackendStatus && (
        <div className="text-center text-xs text-primary mt-2">
          {getBackendStatus}
        </div>
      )}
    </div>
  );
};

export default ReelDrive;