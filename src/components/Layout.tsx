import { useEffect, useState, type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Sidebar/Sidebar";
import { useRouter } from "next/router";
import IconButton from "@mui/joy/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

const Layout = ({ children }: { children: ReactNode }): JSX.Element => {
  const router = useRouter();
  const hideSidebar = router.pathname === "/";
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(
      window.localStorage.getItem("sidebar-collapsed") === "true",
    );
  }, []);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMobileSidebarOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileSidebarOpen]);

  const toggleSidebar = (): void => {
    setIsSidebarCollapsed((collapsed) => {
      const nextValue = !collapsed;
      window.localStorage.setItem("sidebar-collapsed", String(nextValue));
      return nextValue;
    });
  };

  return (
    <div
      className={`app-shell font-inter ${
        isSidebarCollapsed ? "app-shell--sidebar-collapsed" : ""
      } ${hideSidebar ? "app-shell--auth" : ""}`}
    >
      {!hideSidebar && (
        <>
          <Sidebar
            collapsed={isSidebarCollapsed}
            mobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            onToggleCollapsed={toggleSidebar}
          />
          <button
            type="button"
            className={`sidebar-backdrop ${
              isMobileSidebarOpen ? "sidebar-backdrop--visible" : ""
            }`}
            aria-label="Close navigation menu"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <header className="mobile-app-bar">
            <IconButton
              variant="outlined"
              color="neutral"
              aria-label="Open navigation menu"
              aria-controls="app-sidebar"
              aria-expanded={isMobileSidebarOpen}
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <MenuRoundedIcon />
            </IconButton>
            <span>Stock Control System</span>
          </header>
        </>
      )}

      <main className={`app-main ${hideSidebar ? "app-main--auth" : ""}`}>
        {children}
      </main>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Layout;
