import type { AppProps } from "next/app";
import "../styles/globals.css";
import Layout from "../components/Layout";
import { SupabaseProvider } from "../supabase/SupabaseProvider";
import { CompanyProvider } from "../hooks/useCompanyContext";
import { useEffect } from "react";
import axiosInstance, { setupAxiosInterceptors } from "../utils/axiosConfig";

const isInterceptorInitialized =
  typeof window !== "undefined"
    ? window.localStorage.getItem("interceptorsInitialized") === "true"
    : false;

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  useEffect(() => {
    if (!isInterceptorInitialized && typeof window !== "undefined") {
      setupAxiosInterceptors(axiosInstance);
      window.localStorage.setItem("interceptorsInitialized", "true");
    }
  }, []);
  return (
    <CompanyProvider>
      <SupabaseProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </SupabaseProvider>
    </CompanyProvider>
  );
}
