import { type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Sidebar/Sidebar";
import { useRouter } from "next/router";

const Layout = ({ children }: { children: ReactNode }): JSX.Element => {
  const router = useRouter();
  const hideSidebar = router.pathname === "/";

  return (
    <div className="font-inter">
      {!hideSidebar && <Sidebar />}

      <main
        className={`${!hideSidebar ? "ml-[18%] w-[82%]" : "w-full"} py-8 px-20`}
      >
        {children}
      </main>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Layout;
