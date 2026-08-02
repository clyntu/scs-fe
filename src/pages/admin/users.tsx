// src/pages/admin/users.tsx
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axiosInstance from "../../utils/axiosConfig";
import ViewUsers from "../../components/Users/ViewUsers";
import Typography from "@mui/joy/Typography";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  is_admin?: boolean;
}

export default function UsersPage(): JSX.Element {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if user is admin
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <Typography
        level="body-sm"
        role="status"
        aria-busy="true"
        sx={{ color: "text.tertiary" }}
      >
        Checking access...
      </Typography>
    );
  }

  return <ViewUsers />;
}
