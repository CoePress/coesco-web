import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    title: "",
    department: "",
    reason: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { post, isLoading, error } = useApi<{ ok: boolean }>();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = await post("/access/request", formData);

    if (result.data?.ok) {
      setIsSubmitted(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
              <CheckCircle className="size-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Request submitted</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your access request has been submitted. An administrator will review your request and you'll receive an email once it's been processed.
            </p>
          </div>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="size-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
              <UserPlus className="size-6" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Request Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill out this form to request access to the system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First name *
              </label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last name *
              </label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Work email *
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Job title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="Engineer"
                value={formData.title}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="department" className="text-sm font-medium">
                Department
              </label>
              <Input
                id="department"
                name="department"
                placeholder="Engineering"
                value={formData.department}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for access
            </label>
            <textarea
              id="reason"
              name="reason"
              placeholder="Please describe why you need access..."
              value={formData.reason}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error.message || "Something went wrong"}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3 inline mr-1" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
