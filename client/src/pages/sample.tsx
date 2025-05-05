import { useLocation } from "react-router-dom";

const Sample = () => {
  const location = useLocation();

  return (
    <div className="flex items-center justify-center flex-1 text-white/80">
      {location.pathname}
    </div>
  );
};

export default Sample;
