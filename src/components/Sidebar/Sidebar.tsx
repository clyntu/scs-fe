import { useState } from "react";
import { useRouter } from "next/router";
import Box from "@mui/joy/Box";
import { Divider, Typography } from "@mui/joy";
import List from "@mui/joy/List";
import ListSubheader from "@mui/joy/ListSubheader";
import ListItem from "@mui/joy/ListItem";
import Button from "@mui/joy/Button";
import WarehouseRoundedIcon from "@mui/icons-material/WarehouseRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import WidgetsRoundedIcon from "@mui/icons-material/WidgetsRounded";
import MoveUpRoundedIcon from "@mui/icons-material/MoveUpRounded";
import MoveDownRoundedIcon from "@mui/icons-material/MoveDownRounded";
import AssignmentReturnRoundedIcon from "@mui/icons-material/AssignmentReturnRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";
import SwapHorizontalCircleRoundedIcon from "@mui/icons-material/SwapHorizontalCircleRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import axiosInstance from "../../utils/axiosConfig";
import SidebarLink from "./SidebarLink";

export default function Sidebar(): JSX.Element {
  const router = useRouter();
  const currentPath = router.pathname;

  // Determine active sections based on currentPath (for styling purposes)
  const isConfigActive = currentPath.includes("/configuration");
  const isPurchasingActive = currentPath.includes("/purchasing");
  const isSalesActive = currentPath.includes("/sales");

  // Set default expanded state:
  // Configuration: collapsed by default (false)
  // Purchasing & Sales: expanded by default (true)
  const [expandedSections, setExpandedSections] = useState({
    configuration: false,
    purchasing: true,
    sales: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/logout");
      localStorage.removeItem("accessToken");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem("accessToken");
      router.push("/");
    }
  };

  return (
    <Box
      component="nav"
      className="Navigation"
      sx={[
        {
          p: 2,
          height: "100vh",
          width: "250px",
          position: "fixed",
          bgcolor: "background.surface",
          borderRight: "1px solid",
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // Prevent sidebar from scrolling
        },
      ]}
    >
      <Typography
        level="h4"
        sx={{ py: 1, px: 2, fontSize: "1.2rem", fontWeight: "bold" }}
      >
        Peterson Parts Trading
      </Typography>
      <Divider />

      {/* Make List scrollable while keeping header and footer fixed */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "neutral.400",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
        }}
      >
        <List
          size="sm"
          sx={{
            "--ListItem-radius": "8px",
            "--List-gap": "4px",
            fontSize: 13,
          }}
        >
          {/* Configuration Section */}
          <ListItem nested sx={{ my: 1 }}>
            <Box
              onClick={() => toggleSection("configuration")}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                py: 1,
                borderRadius: "8px",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListSubheader
                component="div"
                sx={{
                  letterSpacing: "1px",
                  fontWeight: "800",
                  cursor: "pointer",
                  p: 0,
                  pl: 1,
                  flex: 1,
                  color: isConfigActive ? "primary.500" : "inherit",
                }}
              >
                Configuration
              </ListSubheader>
              {expandedSections.configuration ? (
                <ExpandMoreIcon color={isConfigActive ? "primary" : "action"} />
              ) : (
                <ChevronRightIcon
                  color={isConfigActive ? "primary" : "action"}
                />
              )}
            </Box>

            {expandedSections.configuration && (
              <List
                aria-labelledby="nav-list-browse"
                sx={{ transition: "all 0.3s ease" }}
              >
                <SidebarLink
                  Icon={WidgetsRoundedIcon}
                  label="Stocks"
                  link="/configuration/item"
                />
                <SidebarLink
                  Icon={GroupsRoundedIcon}
                  label="Suppliers"
                  link="/configuration/supplier"
                />
                <SidebarLink
                  Icon={GroupsRoundedIcon}
                  label="Customers"
                  link="/configuration/customer"
                />
                <SidebarLink
                  Icon={WarehouseRoundedIcon}
                  label="Warehouses"
                  link="/configuration/warehouse"
                />
              </List>
            )}
          </ListItem>

          {/* Purchasing Section */}
          <ListItem nested sx={{ my: 1 }}>
            <Box
              onClick={() => toggleSection("purchasing")}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                py: 1,
                borderRadius: "8px",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListSubheader
                component="div"
                sx={{
                  letterSpacing: "1px",
                  fontWeight: "800",
                  cursor: "pointer",
                  p: 0,
                  pl: 1,
                  flex: 1,
                  color: isPurchasingActive ? "primary.500" : "inherit",
                }}
              >
                Purchasing
              </ListSubheader>
              {expandedSections.purchasing ? (
                <ExpandMoreIcon
                  color={isPurchasingActive ? "primary" : "action"}
                />
              ) : (
                <ChevronRightIcon
                  color={isPurchasingActive ? "primary" : "action"}
                />
              )}
            </Box>

            {expandedSections.purchasing && (
              <List
                aria-labelledby="nav-list-tags"
                size="sm"
                sx={{
                  "--ListItemDecorator-size": "32px",
                  transition: "all 0.3s ease",
                }}
              >
                <SidebarLink
                  Icon={ShoppingCartIcon}
                  label="Purchase Order"
                  link="/purchasing/purchase-order"
                />
                <SidebarLink
                  Icon={LocalShippingIcon}
                  label="Supplier Delivery"
                  link="/purchasing/delivery-receipt"
                />
                <SidebarLink
                  Icon={InventoryRoundedIcon}
                  label="Receiving Report"
                  link="/purchasing/receiving-report"
                />
                <SidebarLink
                  Icon={SwapHorizontalCircleRoundedIcon}
                  label="Stock Transfer"
                  link="/purchasing/stock-transfer"
                />
              </List>
            )}
          </ListItem>

          {/* Sales Section */}
          <ListItem nested sx={{ my: 1 }}>
            <Box
              onClick={() => toggleSection("sales")}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                py: 1,
                borderRadius: "8px",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListSubheader
                component="div"
                sx={{
                  letterSpacing: "1px",
                  fontWeight: "800",
                  cursor: "pointer",
                  p: 0,
                  pl: 1,
                  flex: 1,
                  color: isSalesActive ? "primary.500" : "inherit",
                }}
              >
                Sales
              </ListSubheader>
              {expandedSections.sales ? (
                <ExpandMoreIcon color={isSalesActive ? "primary" : "action"} />
              ) : (
                <ChevronRightIcon
                  color={isSalesActive ? "primary" : "action"}
                />
              )}
            </Box>

            {expandedSections.sales && (
              <List
                aria-labelledby="nav-list-tags"
                size="sm"
                sx={{
                  "--ListItemDecorator-size": "32px",
                  transition: "all 0.3s ease",
                }}
              >
                <SidebarLink
                  Icon={ShoppingCartIcon}
                  label="Customer PO"
                  link="/sales/customer-purchase-order"
                />
                <SidebarLink
                  Icon={MoveDownRoundedIcon}
                  label="Allocation"
                  link="/sales/allocation"
                />
                <SidebarLink
                  Icon={MoveUpRoundedIcon}
                  label="De-Allocation"
                  link="/sales/deallocation"
                />
                <SidebarLink
                  Icon={LocalShippingIcon}
                  label="Delivery Planning"
                  link="/sales/delivery-planning"
                />
                <SidebarLink
                  Icon={LocalShippingIcon}
                  label="Delivery Receipt"
                  link="/sales/delivery-receipt"
                />
                <SidebarLink
                  Icon={AssignmentReturnRoundedIcon}
                  label="Customer Return"
                  link="/sales/customer-return"
                />
                <SidebarLink
                  Icon={PaidRoundedIcon}
                  label="A.R. Receipts"
                  link="/sales/ar-receipts"
                />
              </List>
            )}
          </ListItem>
        </List>
      </Box>

      {/* Logout button at the bottom */}
      <Divider sx={{ mt: "auto", mb: 2 }} />
      <Button
        startDecorator={<LogoutIcon />}
        color="danger"
        variant="soft"
        onClick={handleLogout}
        size="sm"
        sx={{ mx: 1 }}
      >
        Logout
      </Button>
    </Box>
  );
}
