import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IEmployee, IQueryParams } from "@/utils/types";
import { instance } from "@/utils";

const useGetEmployees = ({
  sort = "lastName",
  order = "asc",
  page = 1,
  limit = 25,
  search,
  filter,
  dateFrom,
  dateTo,
}: IQueryParams = {}) => {
  const [employees, setEmployees] = useState<IEmployee[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<
          string,
          string | number | boolean | Record<string, any> | Date
        > = {
          sort,
          order,
          page,
          limit,
        };

        if (search) params.search = search;
        if (filter) params.filter = filter;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await instance.get(`/employees`, {
          params,
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
    sort,
    order,
    page,
    limit,
    search,
    filter,
    dateFrom,
    dateTo,
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
