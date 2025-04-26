import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Alert from "@mui/joy/Alert";
import Select from "@mui/joy/Select";
import Option from "@mui/joy/Option";
import axiosInstance, { getCookie } from "../utils/axiosConfig";

export default function Register(): JSX.Element {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [companyId, setCompanyId] = useState("company-a");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize company ID from query param or localStorage
  useEffect(() => {
    // Check if there's a company ID in the query parameters
    const queryCompanyId = router.query.companyId as string;

    // Check if there's a company ID in localStorage or cookie
    const storedCompanyId = localStorage.getItem("companyId");
    const cookieCompanyId =
      getCookie("company_id") || getCookie("company_id_js");

    // Use query param first, then cookie, then localStorage, then default
    const initialCompanyId =
      queryCompanyId || cookieCompanyId || storedCompanyId || "company-a";

    setCompanyId(initialCompanyId);

    // Also store it in localStorage for persistence
    if (initialCompanyId) {
      localStorage.setItem("companyId", initialCompanyId);
    }
  }, [router.query]);

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      // Store company ID in localStorage for later use
      localStorage.setItem("companyId", companyId);

      // Send registration data to backend with company ID header
      const response = await axiosInstance.post(
        "/api/register",
        {
          username,
          email,
          full_name: fullName,
          password,
        },
        {
          headers: {
            "X-Company-ID": companyId,
          },
        },
      );

      console.log("Registration successful:", response.data);

      // Redirect to login page with success message and company ID
      await router.push({
        pathname: "/",
        query: { registered: "success", companyId },
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      // Process structured error format
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;

        if (Array.isArray(detail)) {
          // Process validation errors array
          const fieldErrors: { [key: string]: string } = {};

          detail.forEach((err) => {
            // Get the field name from the location path
            if (err.loc && err.loc.length > 1) {
              const fieldName = err.loc[1];
              fieldErrors[fieldName] = err.msg;
            } else {
              // If no field specified, treat as general error
              setGeneralError(err.msg || "Validation error");
            }
          });

          setErrors(fieldErrors);
        } else if (typeof detail === "string") {
          // Simple string error
          setGeneralError(detail);
        } else {
          // Other object format
          setGeneralError(
            "Registration failed. Please check your information.",
          );
        }
      } else {
        setGeneralError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = async (): Promise<void> => {
    // Pass company ID when redirecting to login
    await router.push({
      pathname: "/",
      query: { companyId },
    });
  };

  return (
    <main>
      <Sheet
        sx={{
          width: 350, // Slightly wider to accommodate error messages
          mx: "auto",
          my: 14,
          py: 4,
          px: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: "sm",
          boxShadow: "md",
        }}
        variant="outlined"
      >
        <div>
          <Typography level="h4" component="h1">
            <b>Create an Account</b>
          </Typography>
          <Typography level="body-sm">Register to get started.</Typography>
        </div>

        {generalError && (
          <Alert color="danger" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {generalError}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <FormControl>
            <FormLabel>Company</FormLabel>
            <Select
              value={companyId}
              onChange={(_, newValue) => setCompanyId(newValue as string)}
              disabled={isLoading}
              sx={{ width: "100%" }}
            >
              <Option value="company-a">Peterson Parts Trading</Option>
              <Option value="company-b">Company B</Option>
            </Select>
          </FormControl>

          <FormControl error={!!errors.username} sx={{ mt: 2 }}>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              id="username"
              value={username}
              placeholder="johndoe"
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
            {errors.username && (
              <Typography level="body-xs" color="danger">
                {errors.username}
              </Typography>
            )}
          </FormControl>

          <FormControl error={!!errors.email} sx={{ mt: 2 }}>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              id="email"
              value={email}
              placeholder="johndoe@example.com"
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            {errors.email && (
              <Typography level="body-xs" color="danger">
                {errors.email}
              </Typography>
            )}
          </FormControl>

          <FormControl error={!!errors.full_name} sx={{ mt: 2 }}>
            <FormLabel>Full Name</FormLabel>
            <Input
              type="text"
              id="fullName"
              value={fullName}
              placeholder="John Doe"
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
            {errors.full_name && (
              <Typography level="body-xs" color="danger">
                {errors.full_name}
              </Typography>
            )}
          </FormControl>

          <FormControl error={!!errors.password} sx={{ mt: 2 }}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              id="password"
              value={password}
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
            {errors.password && (
              <Typography level="body-xs" color="danger">
                {errors.password}
              </Typography>
            )}
          </FormControl>

          <Button
            className="bg-button-primary w-full"
            sx={{ mt: 3 }}
            type="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <Button
          variant="outlined"
          color="neutral"
          className="w-full"
          onClick={handleLoginRedirect}
          disabled={isLoading}
        >
          Already have an account? Log in
        </Button>
      </Sheet>
    </main>
  );
}
