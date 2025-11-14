/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CircleUserRound, Headset, User } from "lucide-react";
import { FC } from "react";
import { href } from "react-router";
import { AiMatchedApplicant } from ".";

interface Props extends AiMatchedApplicant {
  className?: string;
}

const ApplicantCard: FC<Props> = ({ name, position, avatar, className }) => {
  return (
    <div className={cn("flex justify-between gap-4 p-2", className)}>
      <div>
        <LinkButton
          variant={"ghost"}
          to={href("/recruiting/shortlisted")}
          className="flex justify-between items-center gap-4 h-auto pl-0"
        >
          <Avatar className="aspect-square">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1 truncate max-w-full">
            <div className="font-semibold text-base">{name}</div>
            <p className="text-sm">Applied for {position}</p>
          </div>
        </LinkButton>
      </div>

      <div className="flex flex-col items-center gap-1 [&_svg]:text-black">
        <LinkButton variant={"ghost"} size={"icon"} to="#">
          <CircleUserRound />
        </LinkButton>

        <LinkButton variant={"ghost"} size={"icon"} to="#">
          <Headset />
        </LinkButton>
      </div>
    </div>
  );
};

export default ApplicantCard;
