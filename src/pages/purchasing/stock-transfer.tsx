import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { CircularProgress } from "@mui/joy";
import StockTransferForm from "../../components/StockTransfer/StockTransferForm";
import ViewStockTransfer from "../../components/StockTransfer/ViewStockTransfer";
import type { StockTransfer } from "../../interface";
import axiosInstance from "../../utils/axiosConfig";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  is_admin?: boolean;
}

const ReceivingReportMenu = (): JSX.Element => {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState<StockTransfer | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");
        const user = response.data;

        if (!user.is_admin) {
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

  // Show loading spinner while checking admin access
  if (isCheckingAuth) {
    return (
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
    );
  }

  return (
    <div>
      {openCreate && (
        <StockTransferForm
          setOpen={setOpenCreate}
          openCreate={openCreate}
          openEdit={openEdit}
          title="Create Stock Transfer"
        />
      )}

      {openEdit && (
        <StockTransferForm
          setOpen={setOpenEdit}
          openCreate={openCreate}
          openEdit={openEdit}
          selectedRow={selectedRow}
          title="Edit Stock Transfer"
        />
      )}

      {!openEdit && !openCreate && (
        <ViewStockTransfer
          setOpenCreate={setOpenCreate}
          setOpenEdit={setOpenEdit}
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
        />
      )}
    </div>
  );
};

export default ReceivingReportMenu;
