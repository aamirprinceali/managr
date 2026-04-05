// Root page — redirects to the Dashboard
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
