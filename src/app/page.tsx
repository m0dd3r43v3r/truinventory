import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function HomePage() {
  // Check if setup is required
  const userCount = await db.user.count();
  
  if (userCount === 0) {
    redirect("/setup");
  }
  
  redirect("/inventory");
}
