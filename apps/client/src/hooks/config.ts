import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { instance } from "@/utils";

const useGetProductClasses = () => {
  const [productClasses, setProductClasses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getProductClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get(`/config/classes`);
        setProductClasses(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getProductClasses();
  }, [refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    productClasses,
    loading,
    error,
    refresh,
  };
};

const useGetOptionCategoriesByProductClass = (productClassId: string) => {
  const [categories, setCategories] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getCategories = async () => {
      if (!productClassId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get(
          `/config/classes/${productClassId}/categories`
        );
        setCategories(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getCategories();
  }, [productClassId, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    categories,
    loading,
    error,
    refresh,
  };
};

const useGetOptionsByOptionCategory = (optionCategoryId: string) => {
  const [options, setOptions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getOptions = async () => {
      if (!optionCategoryId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get(
          `/config/categories/${optionCategoryId}/options`
        );
        setOptions(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getOptions();
  }, [optionCategoryId, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    options,
    loading,
    error,
    refresh,
  };
};

const useGetOptionsByProductClass = (
  productClassId: string,
  grouped: boolean = false
) => {
  const [options, setOptions] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getOptions = async () => {
      if (!productClassId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get(
          `/config/classes/${productClassId}/options`,
          {
            params: { grouped },
          }
        );
        setOptions(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getOptions();
  }, [productClassId, grouped, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    options,
    loading,
    error,
    refresh,
  };
};

const useGetConfigurations = () => {
  const [configurations, setConfigurations] = useState<any[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getProductClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get(`/config/configurations`);
        setConfigurations(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getProductClasses();
  }, [refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    configurations,
    loading,
    error,
    refresh,
  };
};

export {
  useGetProductClasses,
  useGetOptionCategoriesByProductClass,
  useGetOptionsByOptionCategory,
  useGetOptionsByProductClass,
  useGetConfigurations,
};
