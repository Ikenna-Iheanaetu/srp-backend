/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import {
	FormDropdownMenuCheckboxItem,
	FormDropdownMenuTrigger,
} from "@/components/common/form/dropdown-menu";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MAX_WORK_LOCATIONS_FOR_PLAYER } from "@/constants";
import REGIONS from "@/data/regions.json";
import { PencilLine, Plus } from "lucide-react";
import React from "react";
import { Path, useFormContext, useWatch } from "react-hook-form";
import { PlayerProfileSettingsForm } from "./form-schema";

interface SelectedRegionsSubMenuProps {
	selectedRegions: PlayerProfileSettingsForm["workLocations"];
}
const SelectedRegionsSubMenu: React.FC<SelectedRegionsSubMenuProps> = ({
	selectedRegions,
}) => {
	const { control } = useFormContext<PlayerProfileSettingsForm>();

	return (
		!!selectedRegions?.length && (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					Selected regions: {selectedRegions.length}
				</DropdownMenuSubTrigger>

				<DropdownMenuPortal>
					<DropdownMenuSubContent>
						<DropdownMenuLabel>Selected regions</DropdownMenuLabel>

						{selectedRegions.map((item) => {
							if (!item) {
								return null;
							}

							const actualIndex = REGIONS.findIndex(
								(region) => region === item
							);

							if (actualIndex === -1) {
								return null;
							}

							const path =
								`workLocations.${actualIndex}` as const satisfies Path<PlayerProfileSettingsForm>;
							return (
								<FormDropdownMenuCheckboxItem
									key={path}
									control={control}
									path={path}
									value={item}
									onSelect={(e) => {
										e.preventDefault();
									}}>
									{item}
								</FormDropdownMenuCheckboxItem>
							);
						})}
					</DropdownMenuSubContent>
				</DropdownMenuPortal>
			</DropdownMenuSub>
		)
	);
};

export const FormMultiWorkRegionsSelect = () => {
	const { control } = useFormContext<PlayerProfileSettingsForm>();
	const [search, setSearch] = React.useState("");
	const filteredItems = React.useMemo(
		() =>
			REGIONS.filter((item) =>
				item.toLowerCase().includes(search.toLowerCase())
			),
		[search]
	);

	const selectedRegions = useWatch({
		control,
		name: "workLocations",
	})?.filter(Boolean) as string[] | undefined;

	return (
		<FormFieldErrorAndLabelWrapper
			control={control}
			path="workLocations"
			label="Work Regions"
			showError>
			<DropdownMenu>
				<div className="flex w-full flex-wrap gap-2">
					{!!selectedRegions?.length && (
						<BadgeItemsList items={selectedRegions} />
					)}
					<FormDropdownMenuTrigger asChild>
						<Button type="button" variant="ghost">
							{selectedRegions?.length ? (
								<>
									<PencilLine className="mr-1 h-4 w-4" />
									Update
								</>
							) : (
								<>
									<Plus className="mr-1 h-4 w-4" />
									Add region
								</>
							)}
						</Button>
					</FormDropdownMenuTrigger>
				</div>
				<DropdownMenuContent className="relative space-y-4 tw-scrollbar">
					<DropdownMenuGroup
						className="space-y-2 sticky top-0 z-[50] bg-white"
						onKeyDown={(e) => {
							// to avoid dropdown item from stealing focus from input
							e.stopPropagation();
						}}>
						<Input
							placeholder="Search regions"
							onChange={(e) => {
								setSearch(e.target.value);
							}}
						/>

						<SelectedRegionsSubMenu
							selectedRegions={selectedRegions}
						/>
						<DropdownMenuSeparator />
					</DropdownMenuGroup>

					<DropdownMenuGroup>
						<DropdownMenuLabel>Filtered regions</DropdownMenuLabel>

						{filteredItems.map((item) => {
							const actualIndex = REGIONS.findIndex(
								(region) => region === item
							);

							if (actualIndex === -1) {
								return null;
							}

							const path =
								`workLocations.${actualIndex}` as const satisfies Path<PlayerProfileSettingsForm>;

							const isSelected = selectedRegions?.includes(item);
							const shouldDisable = !!(
								!isSelected &&
								selectedRegions &&
								selectedRegions.length >=
									MAX_WORK_LOCATIONS_FOR_PLAYER
							);

							return (
								<FormDropdownMenuCheckboxItem
									key={path}
									control={control}
									path={path}
									value={item}
									onSelect={(e) => {
										e.preventDefault();
									}}
									disabled={shouldDisable}>
									{item}
								</FormDropdownMenuCheckboxItem>
							);
						})}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</FormFieldErrorAndLabelWrapper>
	);
};
