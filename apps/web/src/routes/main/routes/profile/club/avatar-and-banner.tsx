/** @format */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFileNameUrl } from "@/lib/helper-functions/file-helpers";
import { cn } from "@/lib/utils";
import { Image } from "lucide-react";
import { FC } from "react";
import { Link } from "react-router";
import { ClubProfileData } from "./use-fetch-profile";
type Props = Pick<ClubProfileData, "banner"> & {
	className?: string;
};

export const AvatarAndBanner: FC<Props> = ({ banner, className }) => {
	const fallbackStyles =
		"absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col justify-between items-center gap-2 !h-auto text-sm text-blue-700 hover:text-blue-700 [&:hover>svg]:text-blue-700 transition-opacity group";

	return (
		<div className={cn("h-fit relative", className)}>
			{/* profile banner */}
			<Avatar className="w-full h-auto aspect-profile-banner rounded-none bg-gray-100 relative !p-0">
				<AvatarImage
					src={getFileNameUrl(banner)}
					className="object-cover object-top"
				/>
				<AvatarFallback asChild>
					<Link
						to={"/settings/profile"}
						className={cn(
							fallbackStyles,
							"sm:top-[40%] left-[82%] sm:left-1/2 w-fit"
						)}>
						<Image className="group-hover:scale-125" />
						<span>Edit banner</span>
					</Link>
				</AvatarFallback>
			</Avatar>

			{/* profile picture */}
			{/* Might be restored later */}
			{/* <Avatar className="w-28 h-auto aspect-square bg-gray-100 border-[0.25rem] border-white absolute top-full left-1/2 -translate-y-1/2 -translate-x-1/2">
        <AvatarImage
          src={getFileNameUrl(avatar)}
          className="object-cover object-top"
        />

        <AvatarFallback asChild>
          <Link
            to={"/settings/profile"}
            className={cn(fallbackStyles, "left-1/2")}
          >
            <Image className="group-hover:scale-125" />
            <span>Edit photo</span>
          </Link>
        </AvatarFallback>
      </Avatar> */}
		</div>
	);
};
