import type { Metadata } from "next";
import { redirect } from "next/navigation";
import OwnerRunSheet from "@/booking/OwnerRunSheet";
import { ownerSignedIn } from "@/booking/server/session";

export const metadata: Metadata = {
  title: "Run sheet",
};

export default async function RunSheetPage() {
  // Gated before it renders, not after: the console carries guests' names and
  // phone numbers, so it must never reach a browser that has not been checked.
  if (!(await ownerSignedIn())) redirect("/owners");

  return (
    <div className="container pt-page">
      <div className="pt-root pt-console">
        <OwnerRunSheet />
      </div>
    </div>
  );
}
