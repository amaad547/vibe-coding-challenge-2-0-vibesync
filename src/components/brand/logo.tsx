import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  showTagline?: boolean;
  priority?: boolean;
}

const sizeMap = {
  sm: { width: 120, height: 32 },
  md: { width: 160, height: 42 },
  lg: { width: 200, height: 53 },
  xl: { width: 260, height: 69 },
};

export function SportSyncLogo({
  className,
  size = "md",
  href,
  showTagline = false,
  priority = false,
}: LogoProps) {
  const { width, height } = sizeMap[size];

  const logoImage = (
    <div className={cn("inline-flex flex-col items-start gap-1", className)}>
      <Image
        src="/images/sportsync-logo.png"
        alt="SportSync Logo"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto object-contain"
      />
      {showTagline && (
        <span className="text-[11px] font-medium tracking-tight text-brand-muted">
          Your Academy. Your Performance. Your Future.
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}
