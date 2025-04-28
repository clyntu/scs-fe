import type { AppProps } from "next/app";
import "../styles/globals.css";
import Layout from "../components/Layout";
import { SupabaseProvider } from "../supabase/SupabaseProvider";

export default function App({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <SupabaseProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SupabaseProvider>
  );
}
