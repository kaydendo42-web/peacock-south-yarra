import type { Metadata } from "next";

/**
 * Nothing under /owners belongs in an index. The robots rule asks crawlers not
 * to fetch it; this is the part that binds if one does anyway.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function OwnersLayout({ children }: LayoutProps<"/owners">) {
  return children;
}
