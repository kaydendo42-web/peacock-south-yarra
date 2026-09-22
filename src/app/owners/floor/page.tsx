import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerFloor from "@/booking/OwnerFloor";
import { ownerSignedIn } from "@/booking/server/session";

export const metadata: Metadata = {
  title: "Floor",
};

export default async function FloorPage() {
  if (!(await ownerSignedIn())) redirect("/owners");

  return (
    <div className="container pt-page">
      <div className="pt-root pt-frame pt-frame--tall">
        <OwnerFloor />
      </div>
    </div>
  );
}
