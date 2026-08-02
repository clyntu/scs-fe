import Dashboard from "../components/Dashboard/Dashboard";
import { useSupabase } from "../supabase/SupabaseProvider";
import Login from "./Login";

export default function Home(): JSX.Element {
  const { ready, session } = useSupabase();

  if (!ready) return <></>;
  return session === null ? <Login /> : <Dashboard />;
}
