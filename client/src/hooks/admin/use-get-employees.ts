import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IEmployee, IEmployeeQueryParams } from "@/utils/t";

const useGetEmployees = ({
  sortBy = "name",
  sortOrder = "asc",
  page,
  limit,
  department,
  isActive,
  receivesReports,
  search,
}: IEmployeeQueryParams = {}) => {
  const [employees, setEmployees] = useState<IEmployee[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number | boolean> = {
          sortBy,
          sortOrder,
        };

        if (page !== undefined) params.page = page;
        if (limit !== undefined) params.limit = limit;
        if (department !== undefined) params.department = department;
        if (isActive !== undefined) params.isActive = isActive;
        if (receivesReports !== undefined)
          params.receivesReports = receivesReports;
        if (search !== undefined) params.search = search;

        const { data } = await axios.get(`${env.VITE_API_URL}/users`, {
          params,
          withCredentials: true,
        });

        setEmployees(data);
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

    getEmployees();
  }, [
    refreshToggle,
    sortBy,
    sortOrder,
    page,
    limit,
    department,
    isActive,
    receivesReports,
    search,
  ]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    employees,
    loading,
    error,
    refresh,
  };
};

export default useGetEmployees;
