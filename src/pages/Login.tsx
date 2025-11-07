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
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/joy/IconButton";
import axiosInstance, { getCookie } from "../utils/axiosConfig";
import { useSupabase } from "../supabase/SupabaseProvider";
import { getSupabase } from "../supabase/supabaseClient";
import type { CompanyId } from "../supabase/supabaseClient";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string; // User role: "admin", "user", "read_only"
  is_admin?: boolean; // Admin flag
}

export default function Login(): JSX.Element {
  const { setCompany } = useSupabase();
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const company = getCookie("company_id");
    if (company === null || company === "") {
      return;
    }

    const checkUser = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");

        if (response.status === 200) {
          void router.push("/configuration/item");
        }
      } catch (err) {
        // Not logged in — do nothing, let them stay on login page
      }
    };

    // "void" tells TS/ESLint that you purposely are ignoring the Promise
    void checkUser();
  }, []);

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
      // Set default company for login - users can switch via sidebar after login
      const defaultCompany = "company-a";
      localStorage.setItem("companyId", defaultCompany);
      localStorage.setItem("currentCompany", defaultCompany); // For new context system
      setCompany(defaultCompany as CompanyId);

      /* create / fetch the correct client synchronously */
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error !== null) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
      if (data.session !== null) {
        // Sync user with backend
        try {
          await axiosInstance.post(
            "/api/users/sync",
            {},
            {
              headers: { "X-Company-ID": "company-a" },
            },
          );
        } catch (syncError) {
          console.error("User sync error:", syncError);
        }

        // Set authentication state
        localStorage.setItem("companyId", "company-a");

        // Redirect to main page
        await router.push("/configuration/item");
      }
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add a check for expired sessions on page load
  useEffect(() => {
    const checkExpiredSession = (): void => {
      if (router.query.expired === "true") {
        setError("Your session has expired. Please log in again.");
      }
    };

    checkExpiredSession();
  }, [router.query]);


  return (
    <main>
      <Sheet
        sx={{
          width: 350,
          mx: "auto",
          mt: 24,
          mb: 14,
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

        {successMessage !== "" && (
          <Alert color="success" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {successMessage}
          </Alert>
        )}

        {error !== "" && (
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
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              endDecorator={
                <IconButton
                  variant="plain"
                  color="neutral"
                  onClick={() => setShowPassword((prev) => !prev)}
                  sx={{ ml: "auto" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              }
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
      </Sheet>
    </main>
  );
}
