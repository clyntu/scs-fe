// src/pages/register.tsx
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
} from "@mui/joy";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/joy/IconButton";
import axiosInstance, { getCookie } from "../utils/axiosConfig";

export default function Register(): JSX.Element {
  /* ─────────────────── hooks ─────────────────── */
  const router = useRouter();

  const [companyId, setCompanyId] = useState("company-a");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  /* ────────── initialise company (query > cookie > local) ────────── */
  useEffect(() => {
    const q = router.query.companyId as string | undefined;
    const c = getCookie("company_id") || getCookie("company_id_js");
    const ls =
      typeof window !== "undefined" ? localStorage.getItem("companyId") : null;
    const id = q || c || ls || "company-a";
    setCompanyId(id);
    if (typeof window !== "undefined") localStorage.setItem("companyId", id);
  }, [router.query]);

  /* ─────────────────── handlers ─────────────────── */
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      // Get the correct Supabase client for the selected company
      const { getSupabase } = await import("../supabase/supabaseClient");
      const companySpecificSupabase = getSupabase(
        companyId as "company-a" | "company-b",
      );

      // Supabase sign-up (browser) with the company-specific client
      const { data, error } = await companySpecificSupabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;

      // Persist user in your own DB (roles)
      await axiosInstance.post(
        "/api/users/sync",
        { username, full_name: fullName }, // body optional
        { headers: { "X-Company-ID": companyId } },
      );

      //  success -> login page
      await router.push({
        pathname: "/",
        query: { registered: "success", companyId },
      });
    } catch (err: any) {
      console.error("Registration error:", err);

      /* Supabase error object */
      if (err?.message) {
        setGeneralError(err.message);
      } else if (err.response?.data?.detail) {
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

  const toLogin = async () =>
    await router.push({ pathname: "/", query: { companyId } });

  // Helper function to get company name from company ID
  const getCompanyName = (id: string): string => {
    return id === "company-a" ? "Peterson Parts Trading" : "Company B";
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

        {generalError && (
          <Alert color="danger" variant="soft" sx={{ mt: 1, mb: 1 }}>
            {generalError}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <FormControl>
            <FormLabel>Company</FormLabel>
            <Typography level="body-md" sx={{ p: 1 }}>
              {getCompanyName(companyId)}
            </Typography>
          </FormControl>

          <FormControl error={!!errors.username} sx={{ mt: 2 }}>
            <FormLabel>Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              required
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
            {errors.password && (
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
