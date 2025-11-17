/** @format */

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlignJustify } from "lucide-react";
import { FC } from "react";
import { Link } from "react-router";

const ProfileAccessDropdown: FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"} size={"icon"}>
          <AlignJustify className="!size-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="capitalize">
        <DropdownMenuItem asChild>
          <Link to={"/profile"} className="cursor-pointer justify-center">
            View Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to={"/settings/profile"}
            className="cursor-pointer justify-center"
          >
            Edit Profile
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileAccessDropdown;
