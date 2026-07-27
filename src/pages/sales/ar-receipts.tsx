import { useState, useEffect } from "react";
import ViewAR from "../../components/AR/ViewAR";
import type { AR } from "../../interface";
import ARForm from "../../components/AR/ARForm";
import axiosInstance from "../../utils/axiosConfig";

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: string;
  is_admin?: boolean;
}

const AccountsReceivableMenu = (): JSX.Element => {
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedRow, setSelectedRow] = useState<AR | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user info to determine if admin
  useEffect(() => {
    const fetchUser = async (): Promise<void> => {
      try {
        const response = await axiosInstance.get<User>("/api/users/me/");
        setIsAdmin(response.data.is_admin ?? false);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    void fetchUser();
  }, []);

  return (
    <div>
      {openCreate && (
        <ARForm
          setOpen={setOpenCreate}
          openCreate={openCreate}
          openEdit={openEdit}
          title="Create AR Receipt"
          isAdmin={isAdmin}
        />
      )}

      {openEdit && (
        <ARForm
          setOpen={setOpenEdit}
          openCreate={openCreate}
          openEdit={openEdit}
          selectedRow={selectedRow}
          title="Edit AR Receipt"
          isAdmin={isAdmin}
        />
      )}

      {!openEdit && !openCreate && (
        <ViewAR
          setOpenCreate={setOpenCreate}
          setOpenEdit={setOpenEdit}
          selectedRow={selectedRow}
          setSelectedRow={setSelectedRow}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default AccountsReceivableMenu;
