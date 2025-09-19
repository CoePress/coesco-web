import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import type { IApiResponse, IQueryParams } from "@/utils/types";

import { instance } from "@/utils";

export function useGetEntities<T = any>(endpoint: string | null, {
  sort = "createdAt",
  order = "desc",
  page = 1,
  limit = 25,
  search,
  filter,
  include,
  dateFrom,
  dateTo,
}: IQueryParams<any> = {}) {
  const [entities, setEntities] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 25,
  });

  useEffect(() => {
    const getEntities = async () => {
      if (!endpoint) {
        setLoading(false);
        setEntities([]);
        return;
      }

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

        if (search)
          params.search = search;
        if (filter)
          params.filter = filter;
        if (dateFrom)
          params.dateFrom = dateFrom;
        if (dateTo)
          params.dateTo = dateTo;
        if (include)
          params.include = JSON.stringify(include);

        const { data } = await instance.get<IApiResponse<T[]>>(endpoint, {
          params,
        });

        if (data.success) {
          setEntities(data.data || []);
          setPagination({
            total: data.meta?.total || 0,
            totalPages: data.meta?.totalPages || 0,
            page: data.meta?.page || 1,
            limit: data.meta?.limit || 25,
          });
        }
        else {
          setError(data.error || `Failed to fetch entities from ${endpoint}`);
        }
      }
      catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        }
        else {
          setError("An error occurred. Please try again.");
        }
        return null;
      }
      finally {
        setLoading(false);
      }
    };

    getEntities();
  }, [
    endpoint,
    refreshToggle,
    sort,
    order,
    page,
    limit,
    search,
    filter,
    include,
    dateFrom,
    dateTo,
  ]);

  const refresh = () => setRefreshToggle(prev => !prev);

  return {
    entities,
    loading,
    error,
    refresh,
    pagination,
  };
}
