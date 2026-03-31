// Root page — immediately redirects to the Homes screen
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/homes");
}
