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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import axiosInstance from "../../utils/axiosConfig";
import type { User } from "../../pages/login";
import { authHelpers } from "../../supabase/supabaseClient";
import { CompanySelector } from "../CompanySelector";

import SidebarLink from "./SidebarLink";

export default function Sidebar(): JSX.Element | null {
  const router = useRouter();
  const currentPath = router.pathname;

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // avoids SSR localStorage errors
  const [mounted, setMounted] = useState(false);

  const [expanded, setExpanded] = useState({
    configuration: true,
    purchasing: true,
    sales: true,
    userManagement: true,
  });

  const isAdmin = currentUser?.is_admin === true;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMounted(true);

    axiosInstance
      .get<User>("/api/users/me/")
      .then((response) => setCurrentUser(response.data))
      .catch((error) => console.error("Error fetching user ID:", error));
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

  if (!mounted) return null;

  const isConfig = currentPath.includes("/configuration");
  const isPurchasing = currentPath.includes("/purchasing");
  const isSales = currentPath.includes("/sales");
  const isUserManagement = currentPath.includes("/admin");

  return (
    <Box
      component="nav"
      sx={{
        p: 2,
        height: "100vh",
        width: "250px",
        position: "fixed",
        bgcolor: "background.surface",
        borderRight: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography sx={{ mt: 0.5, px: 1, fontWeight: "bold", fontSize: "18px" }}>
        Hi, {currentUser?.full_name || ""}!
      </Typography>

      {isAdmin ? (
        <Typography
          sx={{
            mt: 0.5,
            px: 1,
            fontSize: "12px",
            color: "primary.500",
            fontWeight: "600",
          }}
        >
          Role: Administrator
        </Typography>
      ) : (
        <Typography
          sx={{
            mt: 0.5,
            px: 1,
            fontSize: "12px",
            color: "primary.500",
            fontWeight: "600",
          }}
        >
          Role: Regular User
        </Typography>
      )}

      <Box sx={{ mb: 2, px: 1 }}>
        <CompanySelector />
      </Box>
      <Divider />

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List
          size="sm"
          sx={{ "--ListItem-radius": "8px", "--List-gap": "4px", fontSize: 13 }}
        >
          {/* Configuration */}
          <Section
            title="Configuration"
            active={isConfig}
            open={expanded.configuration}
            onToggle={() => toggle("configuration")}
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
            {isAdmin && (
              <SidebarLink
                Icon={TuneRoundedIcon}
                label="Stock Adjustment"
                link="/configuration/stock-adjustment"
              />
            )}
          </Section>
          {/* Purchasing */}
          <Section
            title="Purchasing"
            active={isPurchasing}
            open={expanded.purchasing}
            onToggle={() => toggle("purchasing")}
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
            {isAdmin && (
              <SidebarLink
                Icon={SwapHorizontalCircleRoundedIcon}
                label="Stock Transfer"
                link="/purchasing/stock-transfer"
              />
            )}
          </Section>
          {/* Sales */}
          <Section
            title="Sales"
            active={isSales}
            open={expanded.sales}
            onToggle={() => toggle("sales")}
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
          </Section>
          {/* User Management (Admin Only) */}
          {isAdmin && (
            <Section
              title="User Management"
              active={isUserManagement}
              open={expanded.userManagement}
              onToggle={() => toggle("userManagement")}
            >
              <SidebarLink
                Icon={PeopleIcon}
                label="View Users"
                link="/admin/users"
              />
              <SidebarLink
                Icon={PersonAddIcon}
                label="Register User"
                link="/admin/register"
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
      >
        Logout
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
  children,
}: {
  title: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ListItem nested sx={{ my: 1 }}>
      <Box
        onClick={onToggle}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          py: 1,
          borderRadius: "8px",
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <ListSubheader
          sx={{
            letterSpacing: "1px",
            fontWeight: 800,
            cursor: "pointer",
            p: 0,
            pl: 1,
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
      </Box>
      {open && children}
    </ListItem>
  );
}
