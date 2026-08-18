import { memo } from "react";
import { initials } from "../lib/initials";

export const Avatar = memo(
  ({ name, size = 32 }: { name?: string; size?: number }) => {
    const displayName = name || "";

    return (
      <div
        role="img"
        aria-label={`Avatar of ${displayName}`}
        style={{ 
          width: size, 
          height: size,
          fontSize: size * 0.4 
        }}
        className="flex shrink-0 items-center justify-center rounded-full bg-avatar-bg text-background font-bold"
      >
        {initials(displayName)}
      </div>
    );
  },
);