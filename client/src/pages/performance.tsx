import { useState } from "react";
import axios from "axios";
import { Button } from "@/components";

const instance = axios.create({
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

  // const createData = async () => {
  //   const response = await instance.post<any>(`/performance`, {
  //     name: "John Doe",
  //     email: "john.doe@example.com",
  //   });
  //   console.log(response);
  // };

  return (
    <div>
      <h1>{sampleData}</h1>
      <Button onClick={getData}>Get Data</Button>
    </div>
  );
};

export default Performance;
