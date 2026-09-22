import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerSignIn from "@/booking/OwnerSignIn";
import { ownerSignedIn } from "@/booking/server/session";

export const metadata: Metadata = {
  title: "Owners",
};

export default async function OwnersPage() {
  if (await ownerSignedIn()) redirect("/owners/bookings");

  return (
    <div className="container pt-page">
      <OwnerSignIn />
    </div>
  );
}
