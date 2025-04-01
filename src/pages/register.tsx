import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/router";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import FormControl from "@mui/joy/FormControl";
import FormLabel from "@mui/joy/FormLabel";
import Input from "@mui/joy/Input";
import Button from "@mui/joy/Button";
import Alert from "@mui/joy/Alert";
import axiosInstance from "../utils/axiosConfig";

export default function Register(): JSX.Element {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      // Send registration data to backend
      const response = await axiosInstance.post("/api/register", {
        username,
        email,
        full_name: fullName,
        password,
      });

      console.log("Registration successful:", response.data);

      // Instead of auto-login, redirect to login page with success message
      await router.push({
        pathname: "/",
        query: { registered: "success" },
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
    await router.push("/");
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
          <FormControl error={!!errors.username}>
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
