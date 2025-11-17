/** @format */

import { Search } from "lucide-react";

import { Label } from "@/components/ui/label";
import { SidebarInput } from "@/components/ui/sidebar";
import { FC, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const SearchSchema = z.object({
	search: z.string().max(20, "Search query must be less than 20 characters"),
});

const SearchInput: FC = () => {
	const { handleSubmit, register } = useForm({
		resolver: zodResolver(SearchSchema),
		defaultValues: {
			search: "",
		},
	});

	const onSubmit = useCallback((data: z.infer<typeof SearchSchema>) => {
		console.log("onSubmit", data);
	}, []);

	return (
		<form
			onSubmit={(event) => void handleSubmit(onSubmit)(event)}
			className="w-full sm:ml-auto sm:w-auto">
			<div className="relative">
				<Label htmlFor="search" className="sr-only">
					Search
				</Label>
				<SidebarInput
					id="search"
					placeholder="Type to search..."
					className="h-8 pl-7"
					{...register("search")}
				/>
				<Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
			</div>
		</form>
	);
};

export default SearchInput;
