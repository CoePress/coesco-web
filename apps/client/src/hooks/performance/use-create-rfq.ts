import { useState } from 'react';
import { pythonInstance } from '@/utils';

export interface RFQFormData {
  referenceNumber: string;
  date: string;
  companyName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contactName: string;
  position: string;
  phone: string;
  email: string;
  dealerName: string;
  dealerSalesman: string;
  daysPerWeek: string;
  shiftsPerDay: string;
  lineApplication: string;
  lineType: string;
  pullThrough: string;
  maxCoilWidth: string;
  minCoilWidth: string;
  maxCoilOD: string;
  coilID: string;
  maxCoilWeight: string;
  maxCoilHandling: string;
  slitEdge: boolean;
  millEdge: boolean;
  coilCarRequired: string;
  runOffBackplate: string;
  requireRewinding: string;
  matSpec1: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec2: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec3: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec4: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  cosmeticMaterial: string;
  feedEquipment: string;
  pressType: {
    gapFrame: boolean;
    hydraulic: boolean;
    obi: boolean;
    servo: boolean;
    shearDie: boolean;
    straightSide: boolean;
    other: boolean;
    otherText: string;
  };
  tonnage: string;
  pressBedWidth: string;
  pressBedLength: string;
  pressStroke: string;
  windowOpening: string;
  maxSPM: string;
  dies: {
    transfer: boolean;
    progressive: boolean;
    blanking: boolean;
  };
  avgFeedLen: string;
  avgFeedSPM: string;
  maxFeedLen: string;
  maxFeedSPM: string;
  minFeedLen: string;
  minFeedSPM: string;
  voltage: string;
  spaceLength: string;
  spaceWidth: string;
  obstructions: string;
  mountToPress: string;
  adequateSupport: string;
  requireCabinet: string;
  needMountingPlates: string;
  passlineHeight: string;
  loopPit: string;
  coilChangeConcern: string;
  coilChangeTime: string;
  downtimeReasons: string;
  feedDirection: string;
  coilLoading: string;
  safetyRequirements: string;
  decisionDate: string;
  idealDelivery: string;
  earliestDelivery: string;
  latestDelivery: string;
  specialConsiderations: string;
}

const requiredFields = [
  "referenceNumber"
];

export const useCreateRFQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = (form: RFQFormData) => {
    const newErrors: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      if (!form[field as keyof RFQFormData]) {
        newErrors[field] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRFQ = async (form: RFQFormData) => {
    if (!form.referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    
    setIsLoading(true);
    try {
      if (!validate(form)) {
        setStatus("Please fill all required fields before sending.");
        return;
      }

      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      const response = await pythonInstance.post(`/rfq/${form.referenceNumber}`, formData);
      if (response.data) {
        setStatus(`RFQ created successfully! Reference Number: ${form.referenceNumber}`);
      } else {
        setStatus("RFQ created successfully!");
      }
    } catch (error: any) {
      console.error('Error creating RFQ:', error);
      if (error.code === 'ECONNABORTED') {
        setStatus('Request timed out. Please check your connection and try again.');
      } else if (!error.response) {
        setStatus('Network error: Unable to connect to the server. Please check if the server is running.');
      } else if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data)
          : error.response.data;
        setStatus(`Failed to create RFQ: ${errorMessage}`);
      } else if (error.message) {
        setStatus(`Failed to create RFQ: ${error.message}`);
      } else {
        setStatus("Failed to create RFQ. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    errors,
    createRFQ,
    validate
  };
}; 