import { Button } from "@/components";

function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[100dvh] bg-background">
      <h1 className="text-4xl font-bold text-text-muted mb-2">404</h1>
      <p className="text-lg text-text-muted mb-6">Page Not Found</p>
      <div className="flex gap-3">
        <Button
          variant="secondary-outline"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
        <Button
          as="a"
          href="/"
          variant="primary"
        >
          Main Menu
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
