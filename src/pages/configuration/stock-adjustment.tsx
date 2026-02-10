import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axiosInstance from "../../utils/axiosConfig";
import ViewStockAdjustment from "../../components/StockAdjustment/ViewStockAdjustment";
import StockAdjustmentForm from "../../components/StockAdjustment/StockAdjustmentForm";
import type { User } from "../Login";
import CircularProgress from "@mui/joy/CircularProgress";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import Alert from "@mui/joy/Alert";

const StockAdjustmentRouter = (): JSX.Element => {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const isAdmin = currentUser?.is_admin === true;

  // Admin access check
  useEffect(() => {
    const checkAdminAccess = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");
        setCurrentUser(response.data);

        if (!response.data.is_admin) {
          await router.push("/configuration/item");
        }
      } catch (err) {
        console.error("Error checking admin access:", err);
        await router.push("/");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  // Loading state
  if (isCheckingAuth) {
    return (
      <div className="p-6">
        <Stack
          spacing={2}
          justifyContent="center"
          alignItems="center"
          sx={{ py: 10 }}
        >
          <CircularProgress />
          <Typography level="body-sm">Checking access...</Typography>
        </Stack>
      </div>
    );
  }

  // Access denied
  if (!isAdmin) {
    return (
      <div className="p-6">
        <Alert color="danger" variant="soft">
          <Typography level="body-sm">
            Access Denied: This page is only accessible to administrators.
          </Typography>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      {openCreate && (
        <StockAdjustmentForm
          setOpen={setOpenCreate}
          openCreate={openCreate}
        />
      )}

      {!openCreate && (
        <ViewStockAdjustment
          setOpenCreate={setOpenCreate}
        />
      )}
    </div>
  );
};

export default StockAdjustmentRouter;
