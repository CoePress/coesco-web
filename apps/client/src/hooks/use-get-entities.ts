import { useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { IApiResponse, IQueryParams } from "../utils/types";
import api from "@/utils/axios";

export const useGetEntities = <T = any>(
  endpoint: string | null,
  {
    sort = "createdAt",
    order = "desc",
    page = 1,
    limit = 25,
    search,
    filter,
    include,
    dateFrom,
    dateTo,
  }: IQueryParams = {}
) => {
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

        if (search) params.search = search;
        if (filter) params.filter = filter;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        if (include) params.include = JSON.stringify(include);

        const data = await api.get<IApiResponse<T[]>>(endpoint, params);

        if (data.success) {
          setEntities(data.data || []);
          setPagination({
            total: data.meta?.total ?? 0,
            totalPages: data.meta?.totalPages ?? 0,
            page: data.meta?.page ?? 1,
            limit: data.meta?.limit ?? 25,
          });
        } else {
          setError(data.error || `Failed to fetch entities from ${endpoint}`);
        }
      } catch (err: unknown) {
        if (isAxiosError(err)) {
          // interceptor rejects with err.response?.data || err
          const apiMsg =
            (err as any)?.message ||
            (err.response?.data as any)?.message ||
            "Request failed";
          setError(apiMsg);
        } else if (typeof err === "object" && err && "message" in err) {
          setError((err as any).message || "An error occurred. Please try again.");
        } else {
          setError("An error occurred. Please try again.");
        }
        return null;
      } finally {
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

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    entities,
    loading,
    error,
    refresh,
    pagination,
  };
};
