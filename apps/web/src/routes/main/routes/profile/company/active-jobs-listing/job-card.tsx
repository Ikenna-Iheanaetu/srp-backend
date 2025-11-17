/** @format */

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChartNoAxesColumn } from "lucide-react";
import { FC } from "react";

interface Props {
	className?: string;
	title: string;
	status: string;
	applicants: number | unknown[];
}

const JobCard: FC<Props> = ({ title, status, applicants, className }) => {
	return (
		<Card
			className={cn(
				"text-white [&_svg]:text-white grid grid-cols-3 grid-rows-2 gap-10 [&>*]:!p-0 p-6",
				"hover:shadow-md transition-opacity duration-200 hover:shadow-gray-400",
				status === "inactive" && "bg-slate-500",
				className
			)}
			style={{
				background:
					status === "active"
						? "linear-gradient(218.9deg, #504AC2 3.19%, #27245E 84.45%, #26235C 102.22%)"
						: undefined,
			}}>
			<CardHeader className="col-start-2 col-span-2 row-start-2">
				<CardTitle className="whitespace-pre">{title}</CardTitle>
				<CardDescription className="text-white">
					Status:{" "}
					<strong
						className={cn(
							status === "active" && "text-lime-300",
							"capitalize"
						)}>
						{status}
					</strong>
				</CardDescription>
			</CardHeader>

			<CardContent className="col-start-1 row-start-1 row-span-2 flex flex-col justify-between items-start gap-8">
				<ChartNoAxesColumn className="stroke-[0.25rem] size-12" />

				<div className="flex flex-col">
					<strong className="text-5xl">
						{Array.isArray(applicants)
							? applicants.length
							: applicants}
					</strong>
					<span>Applications</span>
				</div>
			</CardContent>

			<CardFooter className="col-start-2 col-span-2 row-start-1 justify-end gap-4">
				{/* <Link to="#">View</Link>

				<div className="flex justify-end gap-1">
					{[
						{ link: "#", icon: Pencil },
						{ link: "#", icon: Trash2 },
					].map((item, index) => {
						return (
							<Button
								asChild
								key={index}
								size={"icon"}
								variant={"ghost"}
								className="hover:bg-transparent group">
								<Link to={item.link}>
									<item.icon className="group-hover:scale-125 transition-transform" />
								</Link>
							</Button>
						);
					})}
				</div> */}
			</CardFooter>
		</Card>
	);
};

export default JobCard;
