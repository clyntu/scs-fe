import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Table,
  Sheet,
  Input,
  FormControl,
  FormLabel,
  CircularProgress,
  Typography,
  Chip,
} from "@mui/joy";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import axiosInstance from "../../utils/axiosConfig";
import ToggleUserStatusModal from "./ToggleUserStatusModal";
import { toast } from "react-toastify";
import type {
  PaginatedUsers,
  PaginationQueryParams,
  User,
} from "../../interface";
import { convertToQueryParams, getErrorMessage } from "../../helper";

const ViewUsers = (): JSX.Element => {
  const [users, setUsers] = useState<PaginatedUsers>({
    total: 0,
    items: [],
  });
  const [openToggleStatus, setOpenToggleStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isDisabling, setIsDisabling] = useState(false);

  // Infinite scroll states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 50;

  // Refs for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load function - resets everything and loads first page
  const getAllUsers = (searchTerm: string): void => {
    // Clear any pending scroll timeout
    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Reset state for new search
    setPage(1);
    setUsers({ total: 0, items: [] });
    setHasMore(true);
    setIsLoading(true);
    isLoadingRef.current = false;

    const payload: PaginationQueryParams = {
      page: 1,
      limit,
      sort_by: "id",
      sort_order: "asc",
      search_term: searchTerm,
    };

    axiosInstance
      .get<PaginatedUsers>(`/api/users/?${convertToQueryParams(payload)}`)
      .then((response) => {
        setUsers(response.data);
        setHasMore(response.data.items.length < response.data.total);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoading(false);
      });
  };

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    // Prevent duplicate requests using ref (synchronous check)
    if (isLoadingRef.current || isLoadingMore || !hasMore) {
      return;
    }

    // Mark as loading immediately (synchronous)
    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    const payload: PaginationQueryParams = {
      page: nextPage,
      limit,
      sort_by: "id",
      sort_order: "asc",
      search_term: searchTerm,
    };

    axiosInstance
      .get<PaginatedUsers>(`/api/users/?${convertToQueryParams(payload)}`)
      .then((response) => {
        const newUsers = response.data.items;
        setUsers((prev) => {
          const updated = {
            total: response.data.total,
            items: [...prev.items, ...newUsers],
          };
          setHasMore(updated.items.length < response.data.total);
          return updated;
        });
        setPage(nextPage);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      })
      .catch((error) => {
        console.error("Error:", error);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      });
  }, [isLoadingMore, hasMore, page, searchTerm, limit]);

  // Handle scroll event for infinite scroll with debouncing
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container === null) return;

    // Clear any existing timeout
    if (scrollTimeoutRef.current !== null) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce scroll events by 100ms
    scrollTimeoutRef.current = setTimeout(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      // Trigger load more when scrolled to within 200px of bottom
      if (distanceFromBottom < 200 && hasMore && !isLoadingRef.current) {
        loadMore();
      }
    }, 100);
  }, [loadMore, hasMore]);

  // Attach scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container === null) return;

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      // Clear timeout on cleanup
      if (scrollTimeoutRef.current !== null) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      getAllUsers(searchTerm);
    }, 300); // wait 300 ms after the last key-press

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const handleToggleUserStatus = async (): Promise<void> => {
    if (selectedUser !== undefined) {
      const url = `/api/users/${selectedUser.id}/status`;
      const newDisabledStatus = selectedUser.disabled !== true;

      try {
        const response = await axiosInstance.patch<User>(url, {
          disabled: newDisabledStatus,
        });

        const actionText = newDisabledStatus ? "disabled" : "enabled";
        toast.success(`User ${actionText} successfully!`);

        // Update the user in the list with the response data
        setUsers((prevUsers) => ({
          ...prevUsers,
          items: prevUsers.items.map((user) =>
            user.id === selectedUser.id ? response.data : user,
          ),
        }));
      } catch (error: any) {
        toast.error(`Error message: ${getErrorMessage(error)}`);
      }
    }
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            display: "flex",
            mb: 3,
            gap: 1,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "start", sm: "center" },
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Typography level="h2" component="h1">
            Users
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 1.5,
            mb: 3,
            p: 1.5,
            borderRadius: "sm",
            backgroundColor: "background.level1",
          }}
        >
          <FormControl>
            <FormLabel sx={{ fontSize: "12px", mb: 0.5 }}>Search</FormLabel>
            <Input
              size="sm"
              sx={{ width: 300 }}
              placeholder="Name / Username / Email"
              startDecorator={<SearchRoundedIcon fontSize="small" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </FormControl>
        </Box>

        <Sheet
          ref={scrollContainerRef}
          onScroll={handleScroll}
          sx={{
            "--TableCell-height": "40px",
            "--TableHeader-height": "calc(1 * var(--TableCell-height))",
            "--Table-firstColumnWidth": "80px",
            "--Table-lastColumnWidth": "140px",
            "--TableRow-hoverBackground": "rgba(0 0 0 / 0.04)",
            overflow: "auto",
            borderRadius: "sm",
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
            maxHeight: "calc(100dvh - 280px)",
          }}
        >
          <Table
            className="h-5"
            size="sm"
            stickyHeader
            hoverRow
            sx={{
              fontSize: "13px",
              "& tbody tr > *:first-child": {
                position: "sticky",
                left: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& tbody tr > *:last-child": {
                position: "sticky",
                right: 0,
                bgcolor: "background.surface",
                zIndex: 10,
              },
              "& thead tr > *:first-child": {
                position: "sticky",
                left: 0,
                top: 0,
                boxShadow: "1px 0 var(--TableCell-borderColor)",
                bgcolor: "background.level1",
                zIndex: 11,
              },
              "& thead tr > *:last-child": {
                position: "sticky",
                right: 0,
                top: 0,
                bgcolor: "background.level1",
                zIndex: 11,
              },
              "& thead th": {
                backgroundColor: "background.level1",
              },
              "& tbody tr:hover": {
                cursor: "pointer",
              },
            }}
            borderAxis="both"
          >
            {isLoading ? (
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size="sm" />
                      <Typography level="body-sm">Loading users...</Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <th style={{ width: "var(--Table-firstColumnWidth)" }}>
                      ID
                    </th>
                    <th style={{ width: 250 }}>Name</th>
                    <th style={{ width: 200 }}>Username</th>
                    <th style={{ width: 250 }}>Email</th>
                    <th style={{ width: 150 }}>Role</th>
                    <th style={{ width: 100, textAlign: "center" }}>Status</th>
                    <th
                      aria-label="last"
                      style={{
                        width: "var(--Table-lastColumnWidth)",
                        textAlign: "center",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "24px" }}
                      >
                        <Typography
                          level="body-sm"
                          sx={{ color: "text.tertiary" }}
                        >
                          No users found.
                        </Typography>
                      </td>
                    </tr>
                  )}
                  {users.items.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.full_name}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        {user.is_admin === true
                          ? "Admin"
                          : user.role !== undefined && user.role !== ""
                            ? user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)
                            : "N/A"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <Chip
                          color={user.disabled === true ? "danger" : "success"}
                          variant="soft"
                          size="sm"
                        >
                          {user.disabled === true ? "Disabled" : "Active"}
                        </Chip>
                      </td>
                      <td>
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <Button
                            sx={{ fontSize: "13px" }}
                            variant="soft"
                            color={
                              user.disabled === true ? "success" : "warning"
                            }
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDisabling(user.disabled !== true);
                              setOpenToggleStatus(true);
                            }}
                          >
                            {user.disabled === true ? "Enable" : "Disable"}
                          </Button>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </Table>
        </Sheet>

        {/* Infinite Scroll Status */}
        {users.items.length > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 2,
              px: 1,
              gap: 2,
            }}
          >
            {isLoadingMore ? (
              <>
                <CircularProgress size="sm" />
                <Typography level="body-sm">Loading more...</Typography>
              </>
            ) : hasMore ? (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing {users.items.length} of {users.total} items • Scroll for
                more
              </Typography>
            ) : (
              <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                Showing all {users.total} items
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <ToggleUserStatusModal
        open={openToggleStatus}
        title={`${isDisabling ? "Disable" : "Enable"} User: ${selectedUser?.full_name ?? ""}`}
        setOpen={setOpenToggleStatus}
        onToggleStatus={handleToggleUserStatus}
        isDisabling={isDisabling}
      />
    </>
  );
};

export default ViewUsers;
