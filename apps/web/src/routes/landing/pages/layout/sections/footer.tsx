/** @format */

import SiteLogo from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router";

const navlinks = {
	QuickLinks: [
		{ name: "Home", href: "/" },
		{ name: "Features", href: "/features" },
		{ name: "Benefits", href: "/benefits" },
		{ name: "Contact Us", href: "/contact-us" },
		{ name: "Sign Up", href: "/signup" },
	],
	Legal: [
		{ name: "Terms of Service", href: "/terms-of-service" },
		{ name: "Privacy Policy", href: "/privacy-policy" },
	],

	Company: [
		{ name: "About Us", href: "/about" },
		{ name: "FAQ", href: "/faq" },
	],
};

const socials = [
	{ name: "linkedin", href: "https://linkedin.com" },
	{ name: "instagram", href: "https://instagram.com" },
	{ name: "facebook", href: "https://facebook.com" },
	{ name: "x", href: "https://x.com" },
];

export default function Footer() {
	const { pathname } = useLocation();
	const routesToShowCTA = ["/", "/about"];
	const routesToShowContactUs = ["/faq", "/privacy-policy"];
	return (
		<>
			{routesToShowCTA.includes(pathname) && (
				<section className="bg-slate-50 flex items-center justify-center">
					<div className="flex flex-col items-center py-8 sm:py-10 px-4 sm:px-8 text-center max-w-7xl w-full">
						<h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">
							Ready to Transform Your Recruitment Process
						</h2>
						<p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
							Sign up now to access top-tier, sports-driven
							professionals
						</p>
					</div>
				</section>
			)}
			{routesToShowContactUs.includes(pathname) && (
				<div className=" flex items-center justify-center">
					<div className="px-4 sm:px-6 md:px-12 py-8 sm:py-12 w-full flex items-center justify-center max-w-7xl">
						<div className="flex flex-col sm:flex-row bg-slate-50 w-full justify-between items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-6 rounded-lg mx-2 mt-8 sm:mt-14">
							<div className="text-center sm:text-left max-w-md">
								<h2 className="text-base sm:text-lg text-slate-800 font-semibold mb-1 sm:mb-2">
									Still have Questions?
								</h2>
								<p className="text-sm text-gray-500">
									Can&apos;t find the answer you&apos;re
									looking for? Please contact our team.
								</p>
							</div>
							<Button
								asChild
								className="button w-full sm:w-auto whitespace-nowrap">
								<Link to={"/contact-us"}>Get in touch</Link>
							</Button>
						</div>
					</div>
				</div>
			)}

			<footer className="bg-slate-50 p-4 sm:p-6 md:p-10 flex items-center justify-center py-12 md:py-18 px-4 sm:px-6 md:px-16">
				<div className="bg-zinc-900 w-full max-w-7xl flex flex-col rounded-3xl py-6 px-4 sm:px-6">
					<section className="text-slate-50 flex flex-col md:flex-row justify-between w-full h-full gap-8 md:gap-4">
						<div className="flex max-w-xs flex-col items-start justify-start gap-1">
							<SiteLogo
								classNames={{
									logoText: "text-white text-lg",
									icon: "size-8",
								}}
							/>

							<span className="text-sm mt-2 px-1">
								Långgatan 13, 541 30 Skövde, Sweden.
							</span>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 w-full">
							{Object.entries(navlinks).map(
								([category, items]) => (
									<div key={category} className="w-auto">
										<h3 className="font-semibold mb-4 text-lime-400">
											{category}
										</h3>
										<ul className="space-y-2 text-slate-50">
											{items.map((item, index) => (
												<li
													key={index}
													className="text-sm">
													<a
														href={item.href}
														className="hover:text-gray-300">
														{item.name}
													</a>
												</li>
											))}
										</ul>
									</div>
								)
							)}
						</div>
					</section>
					<section className="flex flex-col sm:flex-row items-center mt-8 md:mt-6 pr-4 sm:pr-6 justify-between gap-4 sm:gap-0">
						<span className="text-lime-400 text-sm">
							&copy; {new Date().getFullYear()} Sports &
							Rekryteing
						</span>

						<div className="flex items-center justify-center gap-4 sm:gap-2">
							{socials.map((social) => (
								<a
									key={social.name}
									href={social.href}
									aria-label={`Visit our ${social.name} page`}>
									<img
										src={`/assets/logos/footer-${social.name}.svg`}
										alt={`${social.name} icon`}
										className="size-6"
										loading="lazy"
									/>
								</a>
							))}
						</div>
					</section>
				</div>
			</footer>
		</>
	);
}
