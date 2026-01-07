import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2, ArrowLeft, CheckCircle, XCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";

interface InviteData {
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { get, isLoading: isValidating, error: validateError } = useApi<{ success: boolean; data: InviteData }>();
  const { post, isLoading: isSubmitting, error: submitError } = useApi<{ ok: boolean }>();

  useEffect(() => {
    if (token) {
      validateInvite();
    }
  }, [token]);

  const validateInvite = async () => {
    const result = await get(`/access/invite/${token}`);
    if (result.data?.success) {
      setInviteData(result.data.data);
      setFormData((prev) => ({
        ...prev,
        firstName: result.data!.data.firstName || "",
        lastName: result.data!.data.lastName || "",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (formData.password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    const result = await post("/access/register", {
      token,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    if (result.data?.ok) {
      setIsSuccess(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This registration link is invalid. Please contact an administrator for a new invite.
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

  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Validating invite...
        </div>
      </div>
    );
  }

  if (validateError || !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-destructive/10 text-destructive">
              <XCircle className="size-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Invalid or expired invite</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This invitation link is invalid or has expired. Please contact an administrator for a new invite.
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

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
              <CheckCircle className="size-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Account created</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account has been created successfully. You can now sign in with your email and password.
            </p>
          </div>
          <Link to="/login">
            <Button className="w-full">Sign in</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displayError = validationError || (submitError?.message ? submitError.message : null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
              <UserPlus className="size-6" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your registration for {inviteData.email}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={inviteData.email}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password *
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password *
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              required
            />
          </div>

          {displayError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {displayError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
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
