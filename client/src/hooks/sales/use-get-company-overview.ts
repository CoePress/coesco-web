import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

const useGetCompanyOverview = ({ companyId }: { companyId: string }) => {
  const [companyOverview, setCompanyOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getCompanyOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any>>(
          `/companies/${companyId}/overview`
        );

        if (data.success) {
          setCompanyOverview(data.data);
        } else {
          setError(data.error || "Failed to fetch company overview");
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

    getCompanyOverview();
  }, [refreshToggle, companyId]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    companyOverview,
    loading,
    error,
    refresh,
  };
};

export default useGetCompanyOverview;
