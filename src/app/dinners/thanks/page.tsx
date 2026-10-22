import type { Metadata } from "next";
import { DinnerThanks } from "@/dinners/DinnerThanks";

export const metadata: Metadata = {
  title: "Your dinner order",
  robots: { index: false, follow: false },
};

export default async function DinnerThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; t?: string }>;
}) {
  const { order, t } = await searchParams;
  return (
    <section className="container dinners-thanks">
      <DinnerThanks orderId={order ?? ""} token={t} />
    </section>
  );
}
