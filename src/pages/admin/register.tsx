// src/pages/admin/register.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Sheet,
  Typography,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  CircularProgress,
  Checkbox,
  Box,
} from "@mui/joy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/joy/IconButton";
import { toast } from "react-toastify";
import axiosInstance from "../../utils/axiosConfig";
import axios from "axios";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  is_admin?: boolean;
}

export default function Register(): JSX.Element {
  /* ─────────────────── hooks ─────────────────── */
  const router = useRouter();

  /* ─────────────────── state ─────────────────── */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Use default company - users can switch companies after registration
  const defaultCompany = "company-a";

  /* ─────────────────── admin check ─────────────────── */
  useEffect(() => {
    const checkAdminAccess = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");
        const user = response.data;

        if (user.is_admin !== true) {
          // Non-admin users are redirected to forbidden page
          await router.push("/forbidden");
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        // If not authenticated or error, redirect to login
        await router.push("/");
      }
    };

    void checkAdminAccess();
  }, [router]);

  /* ─────────────────── helpers ─────────────────── */
  const resetForm = (): void => {
    setUsername("");
    setEmail("");
    setFullName("");
    setPassword("");
    setIsAdmin(false);
    setShowPassword(false);
    setErrors({});
    setGeneralError("");
  };

  /* ─────────────────── handlers ─────────────────── */
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      // Get the Supabase client (now single instance)
      const { getSupabase } = await import("../../supabase/supabaseClient");
      const supabase = getSupabase();

      // Store admin's current session before creating new user
      const {
        data: { session: adminSession },
      } = await supabase.auth.getSession();

      // Supabase sign-up (browser) - creates user in Supabase auth
      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error !== null) throw error;

      // Get the new user's access token (while session is still active)
      const newUserToken = signUpData?.session?.access_token;

      if (newUserToken === undefined || newUserToken === "") {
        throw new Error("Failed to get access token for new user");
      }

      // Persist user in your own DB BEFORE signing out
      // Use plain axios to bypass interceptor that would replace the token
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL !== undefined &&
        process.env.NEXT_PUBLIC_API_URL !== ""
          ? process.env.NEXT_PUBLIC_API_URL
          : "http://localhost:8000";
      await axios.post(
        `${apiUrl}api/users/sync`,
        { username, full_name: fullName, is_admin: isAdmin },
        {
          headers: {
            "X-Company-ID": defaultCompany,
            Authorization: `Bearer ${newUserToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );

      // NOW sign out the newly created user to restore admin session
      await supabase.auth.signOut();

      // Restore admin session if available
      if (adminSession !== null) {
        await supabase.auth.setSession(adminSession);
      }

      // Show success toast and reset form
      toast.success("User registered successfully!");
      resetForm();
    } catch (err: any) {
      console.error("Registration error:", err);

      /* Supabase error object */
      if (err?.message !== undefined) {
        setGeneralError(String(err.message));
      } else if (err.response?.data?.detail !== undefined) {
        /* backend validation format */
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const map: Record<string, string> = {};
          detail.forEach((d: any) => {
            if (d.loc?.length > 1) map[d.loc[1]] = d.msg;
          });
          setErrors(map);
        } else {
          setGeneralError(
            typeof detail === "string" ? detail : "Registration failed.",
          );
        }
      } else {
        setGeneralError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking admin access
  if (isCheckingAuth) {
    return (
      <main>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </div>
      </main>
    );
  }

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
        <Typography level="h4" component="h1">
          <b>Register User</b>
        </Typography>
        <Typography level="body-sm">Create a new user account.</Typography>

        {generalError !== "" && (
          <Alert color="danger" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {generalError}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <FormControl
            error={errors.username !== undefined && errors.username !== ""}
          >
            <FormLabel>Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
              placeholder="e.g., jsmith or john.smith"
            />
            {errors.username !== undefined && errors.username !== "" && (
              <Typography level="body-xs" color="danger">
                {errors.username}
              </Typography>
            )}
          </FormControl>

          <FormControl
            error={errors.email !== undefined && errors.email !== ""}
            sx={{ mt: 2 }}
          >
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              placeholder="user@company.com"
            />
            {errors.email !== undefined && errors.email !== "" && (
              <Typography level="body-xs" color="danger">
                {errors.email}
              </Typography>
            )}
          </FormControl>

          <FormControl
            error={errors.full_name !== undefined && errors.full_name !== ""}
            sx={{ mt: 2 }}
          >
            <FormLabel>Full Name</FormLabel>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
              placeholder="John Smith"
            />
            {errors.full_name !== undefined && errors.full_name !== "" && (
              <Typography level="body-xs" color="danger">
                {errors.full_name}
              </Typography>
            )}
          </FormControl>

          <FormControl
            error={errors.password !== undefined && errors.password !== ""}
            sx={{ mt: 2 }}
          >
            <FormLabel>Password</FormLabel>
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              slotProps={{
                input: {
                  minLength: 8,
                },
              }}
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
            {errors.password !== undefined && errors.password !== "" && (
              <Typography level="body-xs" color="danger">
                {errors.password}
              </Typography>
            )}
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Checkbox
              label="Grant Admin Access"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              disabled={isLoading}
            />
          </Box>

          <Button
            className="bg-button-primary w-full"
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            sx={{ mt: 3 }}
          >
            {isLoading ? "Creating Account…" : "Register"}
          </Button>
        </form>
      </Sheet>
    </main>
  );
}
