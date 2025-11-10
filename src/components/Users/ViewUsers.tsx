import { useEffect, useState } from "react";
import { Box, Button, Table, Sheet, Input, FormControl, FormLabel } from "@mui/joy";
import axiosInstance from "../../utils/axiosConfig";
import DeleteUserModal from "./DeleteUserModal";
import { toast } from "react-toastify";
import type { PaginatedUsers, PaginationQueryParams, User } from "../../interface";
import { Pagination } from "@mui/material";
import { convertToQueryParams } from "../../helper";

const PAGE_LIMIT = 10;

const ViewUsers = (): JSX.Element => {
  const [users, setUsers] = useState<PaginatedUsers>({
    total: 0,
    items: [],
  });
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  const getAllUsers = (): void => {
    const payload: PaginationQueryParams = {
      page: 1,
      limit: PAGE_LIMIT,
      sort_by: "id",
      sort_order: "asc",
      search_term: searchTerm,
    };

    axiosInstance
      .get<PaginatedUsers>(`/api/users/?${convertToQueryParams(payload)}`)
      .then((response) => {
        setUsers(response.data);
        setPage(1);
      })
      .catch((error) => console.error("Error:", error));
  };

  const changePage = (event: React.ChangeEvent<unknown>, value: number): void => {
    setPage(value);

    const payload: PaginationQueryParams = {
      page: value,
      limit: PAGE_LIMIT,
      sort_by: "id",
      sort_order: "asc",
      search_term: searchTerm,
    };

    axiosInstance
      .get<PaginatedUsers>(`/api/users/?${convertToQueryParams(payload)}`)
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Error:", error));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllUsers();
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleDeleteUser = async (): Promise<void> => {
    if (selectedUser !== undefined) {
      const url = `/api/users/${selectedUser.id}`;
      try {
        await axiosInstance.delete(url);
        toast.success("User deleted successfully!");

        setUsers((prevUsers) => ({
          ...prevUsers,
          items: prevUsers.items.filter((user) => user.id !== selectedUser.id),
          total: prevUsers.total - 1,
        }));
      } catch (error: any) {
        toast.error(
          `Error message: ${error?.response?.data?.detail?.[0]?.msg || error?.response?.data?.detail}`,
        );
        return;
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            mb: 4,
          }}
          className="flex justify-between"
        >
          <h2>Users</h2>
        </Box>
        <Box className="flex items-center mb-6">
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              placeholder="Name / Username / Email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
        </Box>

        <Sheet
          sx={{
            "--TableCell-height": "40px",
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "80px",
            "--Table-lastColumnWidth": "120px",
            "--TableRow-stripeBackground": "rgba(0 0 0 / 0.04)",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.08)",
            overflow: "auto",
            borderRadius: 8,
            background: (
              theme,
            ) => `linear-gradient(to right, ${theme.vars.palette.background.surface} 30%, rgba(255, 255, 255, 0)),
            linear-gradient(to right, rgba(255, 255, 255, 0), ${theme.vars.palette.background.surface} 70%) 0 100%,
            radial-gradient(
              farthest-side at 0 50%,
              rgba(0, 0, 0, 0.12),
              rgba(0, 0, 0, 0)
            ),
            radial-gradient(
                farthest-side at 100% 50%,
                rgba(0, 0, 0, 0.12),
                rgba(0, 0, 0, 0)
              )
              0 100%`,
            backgroundSize:
              "40px calc(100% - var(--TableCell-height)), 40px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height)), 14px calc(100% - var(--TableCell-height))",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "local, local, scroll, scroll",
            backgroundPosition:
              "var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height), var(--Table-firstColumnWidth) var(--TableCell-height), calc(100% - var(--Table-lastColumnWidth)) var(--TableCell-height)",
            backgroundColor: "background.surface",
            maxHeight: "600px",
          }}
        >
          <Table
            className="h-5"
            sx={{
              "& tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "var(--TableCell-headBackground)",
                zIndex: 10,
              },
              "& tbody tr:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.015)",
                cursor: "pointer",
              },
            }}
            borderAxis="both"
          >
            <thead>
              <tr>
                <th style={{ width: "var(--Table-firstColumnWidth)" }}>ID</th>
                <th style={{ width: 250 }}>Name</th>
                <th style={{ width: 200 }}>Username</th>
                <th style={{ width: 250 }}>Email</th>
                <th style={{ width: 150 }}>Role</th>
                <th
                  aria-label="last"
                  style={{
                    width: "var(--Table-lastColumnWidth)",
                    textAlign: "center"
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.items.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.full_name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.is_admin
                      ? "Admin"
                      : user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "N/A"}
                  </td>
                  <td>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Button
                        variant="soft"
                        color="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setOpenDelete(true);
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      </Box>
      <Box className="flex align-center justify-end">
        <Pagination
          count={Math.ceil(users.total / PAGE_LIMIT)}
          page={page}
          onChange={changePage}
          shape="rounded"
          className="mt-7 ml-auto"
        />
      </Box>

      <DeleteUserModal
        open={openDelete}
        title={`Delete User: ${selectedUser?.full_name || ""}`}
        setOpen={setOpenDelete}
        onDelete={handleDeleteUser}
      />
    </>
  );
};

export default ViewUsers;
