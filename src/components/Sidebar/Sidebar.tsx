import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Box from "@mui/joy/Box";
import {
  Divider,
  Typography,
  List,
  ListSubheader,
  ListItem,
  Button,
  IconButton,
  Skeleton,
  Tooltip,
} from "@mui/joy";
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
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LogoutIcon from "@mui/icons-material/Logout";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../../interface";
import { authHelpers } from "../../supabase/supabaseClient";
import { CompanySelector } from "../CompanySelector";

import SidebarLink from "./SidebarLink";

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps): JSX.Element {
  const router = useRouter();
  const currentPath = router.pathname;

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const [expanded, setExpanded] = useState({
    configuration: true,
    purchasing: true,
    sales: true,
    userManagement: true,
  });

  const isAdmin = currentUser?.is_admin === true;

  useEffect(() => {
    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setCurrentUser(response.data))
      .catch((error) => console.error("Error fetching user ID:", error))
      .finally(() => setIsUserLoading(false));
  }, []);

  const toggle = (key: keyof typeof expanded): void =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = async (): Promise<void> => {
    try {
      // Sign out from single Supabase client
      await authHelpers.signOut();

      // Redirect to login page
      await router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect to login even if there was an error
      window.location.href = "/";
    }
  };

  const isConfig = currentPath.includes("/configuration");
  const isPurchasing = currentPath.includes("/purchasing");
  const isSales = currentPath.includes("/sales");
  const isUserManagement = currentPath.includes("/admin");

  return (
    <Box
      id="app-sidebar"
      component="nav"
      aria-label="Primary navigation"
      className={`app-sidebar ${
        collapsed ? "app-sidebar--collapsed" : ""
      } ${mobileOpen ? "app-sidebar--mobile-open" : ""}`}
      sx={{
        p: 2,
        bgcolor: "background.surface",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box className="sidebar-heading">
        <Box className="sidebar-identity">
          {isUserLoading ? (
            <>
              <Skeleton variant="text" level="title-md" width="75%" />
              <Skeleton variant="text" level="body-xs" width="55%" />
            </>
          ) : (
            <>
              <Typography sx={{ fontWeight: "bold", fontSize: "18px" }}>
                Hi, {currentUser?.full_name ?? "there"}!
              </Typography>
              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: "12px",
                  color: "primary.500",
                  fontWeight: "600",
                }}
              >
                Role: {isAdmin ? "Administrator" : "Regular User"}
              </Typography>
            </>
          )}
        </Box>
        <Tooltip
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          placement="right"
        >
          <IconButton
            className="sidebar-collapse-button"
            size="sm"
            variant="outlined"
            color="neutral"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={onToggleCollapsed}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftRoundedIcon />}
          </IconButton>
        </Tooltip>
        <IconButton
          className="sidebar-mobile-close"
          size="sm"
          variant="outlined"
          color="neutral"
          aria-label="Close navigation menu"
          onClick={onCloseMobile}
        >
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <Box className="sidebar-company" sx={{ mb: 2, px: 1 }}>
        <CompanySelector />
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List
          size="sm"
          sx={{ "--ListItem-radius": "8px", "--List-gap": "4px", fontSize: 13 }}
        >
          <SidebarLink
            Icon={SpaceDashboardRoundedIcon}
            label="Operations"
            link="/"
            collapsed={collapsed}
          />
          {/* Configuration */}
          <Section
            title="Configuration"
            active={isConfig}
            open={expanded.configuration}
            onToggle={() => toggle("configuration")}
            collapsed={collapsed}
          >
            <SidebarLink
              Icon={WidgetsRoundedIcon}
              label="Stocks"
              link="/configuration/item"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={GroupsRoundedIcon}
              label="Suppliers"
              link="/configuration/supplier"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={GroupsRoundedIcon}
              label="Customers"
              link="/configuration/customer"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={WarehouseRoundedIcon}
              label="Warehouses"
              link="/configuration/warehouse"
              collapsed={collapsed}
            />
            {isAdmin && (
              <SidebarLink
                Icon={TuneRoundedIcon}
                label="Stock Adjustment"
                link="/configuration/stock-adjustment"
                collapsed={collapsed}
              />
            )}
          </Section>
          {/* Purchasing */}
          <Section
            title="Purchasing"
            active={isPurchasing}
            open={expanded.purchasing}
            onToggle={() => toggle("purchasing")}
            collapsed={collapsed}
          >
            <SidebarLink
              Icon={ShoppingCartIcon}
              label="Purchase Order"
              link="/purchasing/purchase-order"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={LocalShippingIcon}
              label="Supplier Delivery"
              link="/purchasing/delivery-receipt"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={InventoryRoundedIcon}
              label="Receiving Report"
              link="/purchasing/receiving-report"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={SwapHorizontalCircleRoundedIcon}
              label="Stock Transfer"
              link="/purchasing/stock-transfer"
              collapsed={collapsed}
            />
          </Section>
          {/* Sales */}
          <Section
            title="Sales"
            active={isSales}
            open={expanded.sales}
            onToggle={() => toggle("sales")}
            collapsed={collapsed}
          >
            <SidebarLink
              Icon={ShoppingCartIcon}
              label="Customer PO"
              link="/sales/customer-purchase-order"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={MoveDownRoundedIcon}
              label="Allocation"
              link="/sales/allocation"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={MoveUpRoundedIcon}
              label="De-Allocation"
              link="/sales/deallocation"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={LocalShippingIcon}
              label="Delivery Planning"
              link="/sales/delivery-planning"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={LocalShippingIcon}
              label="Delivery Receipt"
              link="/sales/delivery-receipt"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={AssignmentReturnRoundedIcon}
              label="Customer Return"
              link="/sales/customer-return"
              collapsed={collapsed}
            />
            <SidebarLink
              Icon={PaidRoundedIcon}
              label="A.R. Receipts"
              link="/sales/ar-receipts"
              collapsed={collapsed}
            />
          </Section>
          {/* User Management (Admin Only) */}
          {isAdmin && (
            <Section
              title="User Management"
              active={isUserManagement}
              open={expanded.userManagement}
              onToggle={() => toggle("userManagement")}
              collapsed={collapsed}
            >
              <SidebarLink
                Icon={PeopleIcon}
                label="View Users"
                link="/admin/users"
                collapsed={collapsed}
              />
              <SidebarLink
                Icon={PersonAddIcon}
                label="Register User"
                link="/admin/register"
                collapsed={collapsed}
              />
            </Section>
          )}
        </List>
      </Box>
      <Divider sx={{ mt: "auto", mb: 2 }} />
      <Button
        startDecorator={<LogoutIcon />}
        color="danger"
        variant="soft"
        onClick={handleLogout}
        size="sm"
        sx={{ mx: 1 }}
        aria-label="Log out"
      >
        <span className="sidebar-control-label">Logout</span>
      </Button>
    </Box>
  );
}

/* helper accordion component */
function Section({
  title,
  active,
  open,
  onToggle,
  collapsed,
  children,
}: {
  title: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  collapsed: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ListItem nested sx={{ my: 1 }}>
      <Button
        className="sidebar-section-toggle"
        variant="plain"
        color={active ? "primary" : "neutral"}
        onClick={onToggle}
        aria-expanded={open}
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          py: 1,
          px: 1,
          borderRadius: "8px",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <ListSubheader
          className="sidebar-section-title"
          sx={{
            letterSpacing: "1px",
            fontWeight: 800,
            p: 0,
            flex: 1,
            color: active ? "primary.500" : "inherit",
          }}
        >
          {title}
        </ListSubheader>
        {open ? (
          <ExpandMoreIcon color={active ? "primary" : "action"} />
        ) : (
          <ChevronRightIcon color={active ? "primary" : "action"} />
        )}
      </Button>
      {(open || collapsed) && children}
    </ListItem>
  );
}
