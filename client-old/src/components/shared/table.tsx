type TableProps = {
  columns: string[];
  data: any[];
};

const Table = ({ columns, data }: TableProps) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((column) => (
              <td
                key={column}
                className="px-6 py-4 whitespace-nowrap">
                {row[column]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
