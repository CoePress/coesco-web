import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse, IQueryParams } from "@/utils/types";
import { instance } from "@/utils";

const useGetQuotes = ({
  sort = "createdAt",
  order = "desc",
  page = 1,
  limit = 25,
  search,
  filter,
  dateFrom,
  dateTo,
}: IQueryParams = {}) => {
  const [quotes, setQuotes] = useState<any[] | null>(null);
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
    const getQuotes = async () => {
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

        const { data } = await instance.get<IApiResponse<any[]>>(`/quotes`, {
          params,
        });

        if (data.success) {
          setQuotes(data.data || []);
          setPagination({
            total: data.total || 0,
            totalPages: data.totalPages || 0,
            page: data.page || 1,
            limit: data.limit || 25,
          });
        } else {
          setError(data.error || "Failed to fetch quotes");
        }
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

    getQuotes();
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
    quotes,
    loading,
    error,
    refresh,
    pagination,
  };
};

export default useGetQuotes;
