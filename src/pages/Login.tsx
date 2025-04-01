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
import axiosInstance from "../utils/axiosConfig";

export default function Login(): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for registration success message
  useEffect(() => {
    if (router.query.registered === "success") {
      setSuccessMessage(
        "Registration successful! Please log in with your credentials.",
      );
    }
  }, [router.query]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axiosInstance.post(
        "/api/token",
        `username=${email}&password=${password}`,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      console.log("Login successful:", response.data);

      // Store the access token
      localStorage.setItem("accessToken", response.data.access_token);

      // Set authorization header for future requests
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;

      // Redirect to dashboard
      await router.push("/configuration/warehouse");
    } catch (error: any) {
      console.error("Login error:", error);

      if (error.response?.data?.detail) {
        setError(
          typeof error.response.data.detail === "string"
            ? error.response.data.detail
            : "Invalid credentials. Please try again.",
        );
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterRedirect = async (): Promise<void> => {
    await router.push("/register");
  };

  return (
    <main>
      <Sheet
        sx={{
          width: 350,
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
            <b>Welcome!</b>
          </Typography>
          <Typography level="body-sm">Sign in to continue.</Typography>
        </div>

        {successMessage && (
          <Alert color="success" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert color="danger" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              id="email"
              value={email}
              placeholder="your.email@example.com"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormControl>
          <FormControl sx={{ mt: 2 }}>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              id="password"
              value={password}
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormControl>
          <Button
            className="bg-button-primary w-full"
            sx={{ mt: 3 }}
            type="submit"
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <Button
          variant="outlined"
          color="neutral"
          className="w-full"
          onClick={handleRegisterRedirect}
          disabled={isLoading}
        >
          Don't have an account? Register
        </Button>
      </Sheet>
    </main>
  );
}
