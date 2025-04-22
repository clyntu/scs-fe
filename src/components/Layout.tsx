import { type ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./Sidebar/Sidebar";
import { useRouter } from "next/router";

const Layout = ({ children }: { children: ReactNode }): JSX.Element => {
  const router = useRouter();
  return (
    <div className="font-inter">
      {router.pathname !== "/" && <Sidebar />}

      <main
        className={`ml-[18%] py-8 px-20 ${
          router.pathname !== "/" ? "w-[82%]" : "w-[63%]"
        }`}
      >
        {children}
      </main>
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Layout;
