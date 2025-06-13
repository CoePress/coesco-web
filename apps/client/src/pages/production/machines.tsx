import { Loader, PageHeader, Table } from "@/components";
import useGetMachines from "@/hooks/production/use-get-machines";

const Machines = () => {
  const { machines, loading, error } = useGetMachines();

  if (loading) {
    return (
      <div className="w-full flex flex-1 flex-col items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) return <div>Error</div>;

  const columns = [
    {
      key: "name",
      header: "Name",
    },
    {
      key: "type",
      header: "Type",
    },
    {
      key: "controllerType",
      header: "Controller Type",
    },
    {
      key: "connectionType",
      header: "Connection Type",
    },
    {
      key: "connectionHost",
      header: "Connection Host",
    },
    {
      key: "connectionPort",
      header: "Connection Port",
    },
  ];

  return (
    <div className="w-full flex flex-1 flex-col">
      <PageHeader
        title="Machines"
        description="Manage all machines"
      />

      <div className="w-full flex flex-1 flex-col">
        <Table
          columns={columns}
          data={machines || []}
          total={machines?.length || 0}
        />
      </div>
    </div>
  );
};

export default Machines;
