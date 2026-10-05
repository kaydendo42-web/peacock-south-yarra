import type { ReactNode } from "react";
import { BreadcrumbSchema } from "@/components/structured-data";

/** Shared frame for the plain-reading pages: privacy and booking policy. */
export function PolicyPage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  path: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: title, path },
        ]}
      />
      <header className="page-masthead container">
        <p className="eyebrow">Last updated {updated}</p>
        <h1>{title}</h1>
      </header>
      <article className="policy container">{children}</article>
    </>
  );
}
