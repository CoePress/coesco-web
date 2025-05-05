import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-6 bg-background px-4">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold text-muted-foreground">
          Page not found
        </h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="gap-2">
          <ArrowLeft size={16} />
          Go Back
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="gap-2">
          <Home size={16} />
          Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
