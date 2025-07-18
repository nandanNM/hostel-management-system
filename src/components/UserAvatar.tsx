import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import { cn } from "@/lib/utils";
import Image from "next/image";
interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  size?: number;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  size,
  className,
}) => {
  return (
    <Image
      src={avatarUrl || avatarPlaceholder}
      alt="User avatar"
      width={size ?? 48}
      height={size ?? 48}
      className={cn(
        "bg-secondary aspect-square h-fit flex-none rounded-full object-cover",
        className,
      )}
    />
  );
};

export default UserAvatar;
