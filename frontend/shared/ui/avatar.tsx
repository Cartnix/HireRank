import { memo } from "react";
import { initials } from "../lib/initials";

export const Avatar = memo(
  ({ name, size = 16 }: { name: string; size?: number }) => {
    return (
      <div
        role="img"
        aria-label={`Avatar of ${name}`}
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-avatar-bg text-[22px] text-background font-bold"
      >
        {initials(name)}
      </div>
    );
  },
);
