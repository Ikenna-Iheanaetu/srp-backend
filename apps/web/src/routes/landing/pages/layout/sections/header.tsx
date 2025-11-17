/** @format */

import SiteLogo from "@/components/common/site-logo";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { href, Link } from "react-router";

const navLinks = [
	{ name: "Home", url: "/" },
	{ name: "About Us", url: "/about" },
	{
		name: "Features",
		url: "#",
		features: [
			{
				name: "Recruitment board",
				url: "/features/recruitment-board",
			},
			{ name: "Leader board", url: "/features/leader-board" },
			{ name: "Partners", url: "/features/partners" },
			{ name: "Clubs", url: "/features/clubs" },
		],
	},
	{ name: "FAQ", url: href("/faq") },
	{ name: "Contact", url: "/contact-us" },
];

function Navbar() {
	return (
		<nav className="bg-blue-800 text-slate-50 flex items-center justify-center sticky top-0 z-50 shadow-md">
			<div className="w-full flex items-center justify-between max-w-7xl px-6 py-4">
				<SiteLogo
					classNames={{
						logoText: "text-white",
					}}
				/>

				{/* Desktop Navigation */}
				<div className="hidden md:flex items-center justify-center gap-2">
					<div className="flex items-center justify-center gap-2">
						{navLinks.map((item, index) => {
							if (
								typeof item === "object" &&
								item.name &&
								item.url &&
								!item.features
							) {
								return (
									<Link
										to={item.url}
										key={index}
										className="mx-2 text-sm font-semibold hover:text-blue-200 transition-colors">
										{item.name}
									</Link>
								);
							}
						})}
					</div>

					<div className="flex gap-2 items-center ml-2">
						<Button asChild className="button">
							<Link to={"/login"}>Login</Link>
						</Button>

						<Button asChild className="button">
							<Link to={"/signup"}>Sign up</Link>
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				<div className="md:hidden">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="text-white">
								<Menu className="h-6 w-6 text-current" />
							</Button>
						</SheetTrigger>
						<SheetContent
							side="right"
							className="w-[300px] bg-white">
							<div className="flex flex-col gap-4 mt-8">
								{navLinks.map((item, index) => {
									if (
										typeof item === "object" &&
										item.name &&
										item.url &&
										!item.features
									) {
										return (
											<Link
												to={item.url}
												key={index}
												className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
												{item.name}
											</Link>
										);
									}
									if (item.features) {
										return (
											<Accordion
												type="single"
												collapsible
												key={index}
												className="w-full">
												<AccordionItem
													value="features"
													className="border-none">
													<AccordionTrigger className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2">
														{item.name}
													</AccordionTrigger>
													<AccordionContent>
														<div className="flex flex-col gap-2 pl-4">
															{item.features.map(
																(
																	feature,
																	i
																) => (
																	<Link
																		key={i}
																		to={
																			feature.url
																		}
																		className="text-base text-gray-600 hover:text-blue-600 transition-colors py-1">
																		{
																			feature.name
																		}
																	</Link>
																)
															)}
														</div>
													</AccordionContent>
												</AccordionItem>
											</Accordion>
										);
									}
								})}
								<div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
									<Button asChild className="button w-full">
										<Link to={"/login"}>Login</Link>
									</Button>
									<Button asChild className="button w-full">
										<Link to={"/signup"}>Sign up</Link>
									</Button>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
