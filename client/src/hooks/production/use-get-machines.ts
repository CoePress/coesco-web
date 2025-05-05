import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

export type MachineType = "LATHE" | "MILL";
export type MachineController = "MAZAK" | "FANUC";

export interface IMachine {
  id: string;
  slug: string;
  name: string;
  type: MachineType;
  controller: MachineController;
  controllerModel: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface IQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface IMachineQueryParams extends IQueryParams {
  type?: MachineType;
  controller?: MachineController;
}

const useGetMachines = ({
  page,
  limit,
  sortBy = "name",
  sortOrder = "asc",
  search,
  type,
  controller,
}: IMachineQueryParams = {}) => {
  const [machines, setMachines] = useState<IMachine[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getMachines = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: IMachineQueryParams = {
          sortBy,
          sortOrder,
        };

        if (page !== undefined) params.page = page;
        if (limit !== undefined) params.limit = limit;
        if (sortBy !== undefined) params.sortBy = sortBy;
        if (sortOrder !== undefined) params.sortOrder = sortOrder;
        if (search !== undefined) params.search = search;
        if (type !== undefined) params.type = type;
        if (controller !== undefined) params.controller = controller;

        const { data } = await axios.get(`${env.VITE_API_URL}/machines`, {
          params,
          withCredentials: true,
        });

        setMachines(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
        return null;
      } finally {
        setLoading(false);
      }
    };

    getMachines();
  }, [refreshToggle, sortBy, sortOrder, page, limit, type, controller]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    machines,
    loading,
    error,
    refresh,
  };
};

export default useGetMachines;
