/** @format */

import { LinkButton } from "@/components/common/link-btn";
import { LoadingIndicator } from "@/components/common/loading-indicator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInfiniteScrollTrigger } from "@/hooks/use-inifinite-trigger";
import { cn, getScrollFetchThresholdIndex } from "@/lib/utils";
import { CrumbsLocationState } from "@/routes/main/components/app-header/bread-crumb-navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Search, User } from "lucide-react";
import React from "react";
import { href, useLocation } from "react-router";
import { ChatAlertCount } from "../../../components/chat";
import { useResponsiveState } from "../../../hooks/use-responsive-state";
import { STATUS_TABS, StatusTab } from "./schemas";
import { useChatsListQueryConfig } from "./use-chats-list-query-config";

const OptimisticSearchInput: React.FC<
	React.ComponentProps<typeof Input> & {
		onValueChange: (value: string) => void;
		value: string;
	}
> = ({ value: externalValue, onValueChange, ...props }) => {
	const [optimisticSearch, setOptimisticSearch] = useResponsiveState({
		value: externalValue,
		onValueChange,
	});

	return (
		<Input
			{...props}
			value={optimisticSearch}
			onChange={(e) => {
				setOptimisticSearch(e.target.value);
			}}
		/>
	);
};

const OptimisticTabs: React.FC<React.ComponentProps<typeof Tabs>> = ({
	value: externalValue,
	onValueChange,
	...props
}) => {
	const [activeTab, setActiveTab] = useResponsiveState({
		value: externalValue,
		onValueChange: (value) => {
			if (!value) {
				return;
			}
			onValueChange?.(value);
		},
	});

	return <Tabs {...props} value={activeTab} onValueChange={setActiveTab} />;
};

export const ChatsList: React.FC<{ className?: string }> = ({ className }) => {
	const { searchParams, setSearchParams, queryOptions } =
		useChatsListQueryConfig();
	const { search, status } = searchParams;
	const {
		data,
		hasNextPage,
		fetchNextPage,
		isFetchingNextPage,
		isFetching,
		isPlaceholderData,
	} = useInfiniteQuery(queryOptions);

	const isFetchingNewFilters = isFetching && isPlaceholderData;

	const fetchedMessages = data?.pages.flatMap((page) => page.data);

	const thresholdIndex = getScrollFetchThresholdIndex(
		fetchedMessages?.length ?? 0,
	);
	const thresholdRef = useInfiniteScrollTrigger(
		hasNextPage,
		isFetching,
		() => void fetchNextPage(),
	);

	const location = useLocation();

	return (
		<Card className={cn("flex size-full flex-col gap-4 p-4", className)}>
			<CardHeader className="p-0">
				<div className="sr-only">
					<CardTitle>Messages list</CardTitle>
					<CardDescription>List of all messages</CardDescription>
				</div>

				<OptimisticTabs
					value={status ?? STATUS_TABS.ALL}
					onValueChange={(s) => {
						const status = s as StatusTab;
						void setSearchParams((prev) => ({
							...prev,
							status: status === STATUS_TABS.ALL ? null : status,
						}));
					}}
					className="w-full">
					<TabsList
						aria-label="Messages status tabs"
						className="grid w-full grid-cols-2 gap-2 bg-transparent">
						{[
							{
								label: "All Conversations",
								value: STATUS_TABS.ALL,
							},
							{
								label: "Unread Conversations",
								value: STATUS_TABS.UNREAD,
							},
						].map((tab) => (
							<TabsTrigger
								key={tab.value}
								value={tab.value}
								className="rounded-full border py-2 text-xs data-[state=active]:border-blue-300 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none">
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>
				</OptimisticTabs>
			</CardHeader>

			<CardContent className="flex flex-1 flex-col gap-4 p-0">
				<Label className="relative">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2" />
					<OptimisticSearchInput
						type="text"
						role="searchbox"
						placeholder="Search messages"
						value={search ?? ""}
						onValueChange={(value) =>
							void setSearchParams((prev) => ({
								...prev,
								search: value || null,
							}))
						}
						className="h-12 rounded-full py-4 pl-14 pr-4"
					/>
				</Label>

				{/* Conversation List */}
				<div
					className={cn(
						"flex-1 space-y-0",
						isFetchingNewFilters && "animate-pulse",
					)}>
					{fetchedMessages?.map((message, index) => (
						<LinkButton
							key={message.id}
							ref={
								index === thresholdIndex
									? thresholdRef
									: undefined
							}
							to={href("/messages/:id", {
								id: message.id,
							})}
							state={
								{
									crumbs: [
										{
											label: "Messages",
											to: location,
										},
										{
											label: message.name,
										},
									],
								} satisfies CrumbsLocationState
							}
							variant={"ghost"}
							disableDefaultStyles
							className={cn(
								"h-auto w-full flex-col gap-0 p-0 transition-colors hover:bg-slate-300/20 active:bg-slate-300/20",
							)}>
							<div className="relative grid w-full max-w-full flex-1 grid-cols-5 gap-3 p-4">
								{/* Avatar */}
								<Avatar className="size-12">
									<AvatarImage
										src={message.avatar}
										alt={message.name}
									/>
									<AvatarFallback className="">
										<User />
									</AvatarFallback>
								</Avatar>

								{/* Content */}
								<div className="col-span-3 space-y-2 text-left">
									<h3 className="text-foreground truncate text-sm font-semibold">
										{message.name}
									</h3>

									{/* line-clamp-2 doesn't work as expected */}
									<p className="truncate text-xs text-slate-500">
										{message.message}
									</p>
								</div>

								<div className="flex h-full min-h-full flex-col items-end justify-between gap-1">
									{(() => {
										const formattedTime = dayjs(
											message.timestamp,
										).format("hh:mm A");

										return (
											<time
												dateTime={message.timestamp}
												aria-label={`Time ${formattedTime}`}
												className="flex-shrink-0 text-xs text-slate-400">
												{formattedTime}
											</time>
										);
									})()}

									{/* Unread Badge */}
									{!!message.unreadCount && (
										<ChatAlertCount
											role="status"
											aria-label={`${message.unreadCount} unread messages`}>
											{message.unreadCount}
										</ChatAlertCount>
									)}
								</div>
							</div>

							<Separator />
						</LinkButton>
					))}
				</div>

				{isFetchingNextPage && (
					<div className="">
						Loading more
						<LoadingIndicator />
					</div>
				)}
			</CardContent>
		</Card>
	);
};
