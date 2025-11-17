/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { FC, ReactNode } from "react";
import { useMemo } from "react";

export interface StackedAvatarItem {
  src: string;
  alt?: string;
  fallback?: ReactNode;
}

type Size = "default" | "sm" | "lg";

interface StackedAvatarsProps {
  avatars: StackedAvatarItem[];
  max?: number;
  size?: Size;
  classNames?: {
    root?: string;
    avatar?: string;
    remaining?: string;
  };
}

const avatarSizeMap = {
  sm: "size-8 text-xs",
  default: "size-10 text-sm",
  lg: "size-12 text-base",
} satisfies Record<Size, string>;

const remainingSizeMap = {
  sm: "size-6 text-xs",
  lg: "size-8 text-sm",
  default: "size-7 text-xs",
} satisfies Record<Size, string>;

export const StackedAvatars: FC<StackedAvatarsProps> = ({
  avatars,
  max = 5,
  size = "default",
  classNames,
}) => {
  if (!avatars?.length) {
    return (
      <div className={cn("text-muted-foreground", classNames?.root)}>----</div>
    );
  }
  const { displayAvatars, remainingCount } = useMemo(() => {
    const displayCount = Math.min(max, avatars?.length);
    return {
      displayAvatars: avatars?.slice(0, displayCount),
      remainingCount: avatars?.length - displayCount,
    };
  }, [avatars, max]);

  const avatarElements = useMemo(() => {
    return displayAvatars?.map((avatar, index) => {
      const altText = avatar.alt ?? `${index + 1}`;

      return (
        <Avatar
          key={index}
          className={cn(
            "border-2 border-white ring-0",
            avatarSizeMap[size],
            classNames?.avatar
          )}
        >
          <AvatarImage src={getFileNameUrl(avatar.src)} alt={altText} />
          <AvatarFallback>{avatar.fallback ?? <User />}</AvatarFallback>
        </Avatar>
      );
    });
  }, [displayAvatars, size, classNames?.avatar]);

  return (
    <div className={cn("inline-flex items-center relative", classNames?.root)}>
      <div className="flex -space-x-4">{avatarElements}</div>

      {/* Show remaining count if there are more avatars than max - positioned on top */}
      {remainingCount > 0 && (
        <div
          className={cn(
            "absolute -top-2 -right-2 flex items-center justify-center rounded-full bg-muted border-2 border-white z-10",
            remainingSizeMap[size],
            classNames?.remaining
          )}
        >
          <span className="font-medium">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
};
