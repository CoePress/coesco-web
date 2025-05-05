import { useSearchParams } from "react-router-dom";

const PopupWindow = () => {
  const [searchParams] = useSearchParams();

  return (
    <div className="p-4">
      <p>
        {Array.from(searchParams.entries()).map(([key, value]) => (
          <p key={key}>
            {key}: {value}
          </p>
        ))}
      </p>
    </div>
  );
};

export default PopupWindow;
