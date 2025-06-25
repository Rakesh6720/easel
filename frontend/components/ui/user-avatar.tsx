import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
};

export function UserAvatar({
  firstName,
  lastName,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial =
    firstName?.charAt(0)?.toUpperCase() ||
    lastName?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {imageUrl && (
        <AvatarImage src={imageUrl} alt={`${firstName} ${lastName}`} />
      )}
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}
