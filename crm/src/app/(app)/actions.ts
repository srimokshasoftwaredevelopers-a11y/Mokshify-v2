"use server";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { currentUser, endSession } from "@/lib/auth";

export async function signOut() {
  const u = await currentUser();
  await endSession();
  if (u) await audit("logout", { actorId: u.id, entity: "user", entityId: u.id });
  redirect("/login");
}
