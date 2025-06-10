import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components";

export const instance = axios.create({
  baseURL: "http://api.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const Performance = () => {
  const [sampleData, setSampleData] = useState<any>(null);

  const getData = async () => {
    const { data } = await instance.get<any>(`/performance`);

    setSampleData(data);
  };

  const createData = async () => {
    const response = await instance.post<any>(`/performance`, {
      name: "John Doe",
      email: "john.doe@example.com",
    });

    console.log(response);
  };

  const handleClick = () => {
    createData();
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="text-text flex flex-col items-center justify-center flex-1 gap-4">
      <div>{JSON.stringify(sampleData || {}, null, 2)}</div>
      <Button onClick={handleClick}>Create Data</Button>
    </div>
  );
};

export default Performance;
