import { instance } from "@/utils";
import { IEmployee } from "@/utils/types";
import { AxiosError } from "axios";
import { useState } from "react";

const useUpdateEmployee = () => {
  const [updatedEmployee, setUpdatedEmployee] = useState<IEmployee | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateEmployee = async (
    employeeId: string,
    employeeData: Partial<IEmployee>
  ) => {
    setLoading(true);
    setError(null);
    setUpdatedEmployee(null);

    try {
      const { data } = await instance.patch(
        `/employees/${employeeId}`,
        employeeData
      );

      if (data.success) {
        setUpdatedEmployee(data.data);
        return data.data;
      } else {
        setError(data.error || "Failed to update employee");
        return null;
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

  return {
    updatedEmployee,
    loading,
    error,
    updateEmployee,
  };
};

export default useUpdateEmployee;
