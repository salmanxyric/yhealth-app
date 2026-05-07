import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

interface ContentSkeletonProps {
  loading: boolean;
  fixture: React.ReactNode;
  children: React.ReactNode;
  name?: string;
  animate?: string;
  darkColor?: string;
  className?: string;
}

function ContentSkeleton({ loading, fixture, children }: ContentSkeletonProps) {
  return <>{loading ? fixture : children}</>
}

export { Skeleton, ContentSkeleton }
