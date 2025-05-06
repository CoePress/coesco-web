import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IMachineState, IStateQueryParams } from "@/utils/t";

const useGetStates = ({
  page,
  limit,
  sortBy = "timestamp",
  sortOrder = "desc",
  search,
  startDate,
  endDate,
  machineId,
}: IStateQueryParams = {}) => {
  const [states, setStates] = useState<IMachineState[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getStates = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: IStateQueryParams = {
          sortBy,
          sortOrder,
        };

        if (page !== undefined) params.page = page;
        if (limit !== undefined) params.limit = limit;
        if (sortBy !== undefined) params.sortBy = sortBy;
        if (sortOrder !== undefined) params.sortOrder = sortOrder;
        if (search !== undefined) params.search = search;
        if (machineId !== undefined) params.machineId = machineId;
        if (startDate !== undefined) params.startDate = startDate;
        if (endDate !== undefined) params.endDate = endDate;

        const { data } = await axios.get(`${env.VITE_API_URL}/states`, {
          params,
          withCredentials: true,
        });

        setStates(data);
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

    getStates();
  }, [
    refreshToggle,
    sortBy,
    sortOrder,
    page,
    limit,
    machineId,
    startDate,
    endDate,
  ]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    states,
    loading,
    error,
    refresh,
  };
};

export default useGetStates;
