import type { ReactNode } from "react";
import Image from "next/image";
import { pageArtwork, type PageArtworkKey } from "@/lib/page-artwork";

interface PageArtworkBandProps {
  art: PageArtworkKey;
  className?: string;
  children?: ReactNode;
}

export function PageArtworkBand({ art, className = "", children }: PageArtworkBandProps) {
  const artwork = pageArtwork[art];
  const objectPosition = "objectPosition" in artwork ? artwork.objectPosition : "center";

  return (
    <section className={`relative isolate overflow-hidden ${className}`}>
      <Image
        src={artwork.src}
        alt={artwork.alt}
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 -z-20 object-cover opacity-56 saturate-[0.96] contrast-[1.08]"
        style={{ objectPosition }}
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(10,8,20,0.18),rgba(10,8,20,0.68)_68%,rgba(10,8,20,0.94))]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#060410]/62 via-[#060410]/62 to-[#060410]/94" />
      <div className="absolute inset-0 -z-10 opacity-20 mix-blend-overlay bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:18px_18px]" />
      {children}
    </section>
  );
}

interface PageArtworkBackdropProps {
  art: PageArtworkKey;
  className?: string;
}

export function PageArtworkBackdrop({ art, className = "" }: PageArtworkBackdropProps) {
  const artwork = pageArtwork[art];
  const objectPosition = "objectPosition" in artwork ? artwork.objectPosition : "center";

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}>
      <Image
        src={artwork.src}
        alt=""
        fill
        sizes="100vw"
        loading="eager"
        fetchPriority="high"
        className="object-cover opacity-30 saturate-[0.92]"
        style={{ objectPosition }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#060410]/60 via-[#060410]/80 to-[#060410]" />
    </div>
  );
}
