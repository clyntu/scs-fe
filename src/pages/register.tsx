// src/pages/register.tsx
import { useState } from "react";
import { useRouter } from "next/router";
import {
  Sheet,
  Typography,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
} from "@mui/joy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/joy/IconButton";
import axiosInstance from "../utils/axiosConfig";

export default function Register(): JSX.Element {
  /* ─────────────────── hooks ─────────────────── */
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Use default company - users can switch companies after registration
  const defaultCompany = "company-a";

  /* ─────────────────── handlers ─────────────────── */
  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      // Set default company for registration
      localStorage.setItem("companyId", defaultCompany);
      localStorage.setItem("currentCompany", defaultCompany);

      // Get the Supabase client (now single instance)
      const { getSupabase } = await import("../supabase/supabaseClient");
      const supabase = getSupabase();

      // Supabase sign-up (browser)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error !== null) throw error;

      // Persist user in your own DB (roles)
      await axiosInstance.post(
        "/api/users/sync",
        { username, full_name: fullName }, // body optional
        { headers: { "X-Company-ID": defaultCompany } },
      );

      //  success -> login page
      await router.push({
        pathname: "/",
        query: { registered: "success" },
      });
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

  const toLogin = async (): Promise<void> => {
    await router.push({ pathname: "/" });
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
        <Typography level="h4" component="h1">
          <b>Create an Account</b>
        </Typography>
        <Typography level="body-sm">Register to get started.</Typography>

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

        <Button
          variant="outlined"
          color="neutral"
          className="w-full"
          onClick={toLogin}
          disabled={isLoading}
        >
          Already have an account? Log in
        </Button>
      </Sheet>
    </main>
  );
}
