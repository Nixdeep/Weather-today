import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? <Redirect href="/dashboard" /> : <Redirect href="/login" />;
}
