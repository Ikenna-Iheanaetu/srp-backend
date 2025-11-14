/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { EntityProfileParams } from "@/routes/main/routes/entity/schemas";
import { User } from "lucide-react";
import { href, useLocation } from "react-router";
import { ChatRecipient } from "../../../../types";

type RecipientProfileCardProps = Pick<
	ChatRecipient,
	"avatar" | "name" | "location" | "club"
>;
export const RecipientProfileCard = ({
	avatar,
	name,
	location,
	club,
}: RecipientProfileCardProps) => {
	const currentLocation = useLocation();
	return (
		<Item
			variant={"outline"}
			className="rounded-2xl border-slate-100 bg-slate-50">
			<ItemMedia
				variant={"image"}
				className="rounded-full border border-white shadow">
				<Avatar className="size-16">
					<AvatarImage src={avatar} alt={name} />
					<AvatarFallback>
						<User />
					</AvatarFallback>
				</Avatar>
			</ItemMedia>

			<ItemContent>
				<ItemTitle>{name}</ItemTitle>
				<ItemDescription className="text-left">
					{location}
				</ItemDescription>

				<LinkButton
					to={href("/:userType/:id", {
						userType: "club" as EntityProfileParams["userType"], // TODO: Add club third party profile viewing
						id: club.id,
					} satisfies EntityProfileParams)}
					state={
						{
							crumbs: [
								{
									label: `Chat with ${name}`,
									to: currentLocation,
								},
								{
									label: `Club: ${club.name}`,
								},
							],
						} satisfies CrumbsLocationState
					}
					variant={"link"}
					className="w-fit p-0 text-xs underline">
					Club: {club.name}
				</LinkButton>
			</ItemContent>
		</Item>
	);
};
