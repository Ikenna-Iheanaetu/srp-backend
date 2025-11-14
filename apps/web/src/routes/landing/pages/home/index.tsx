/** @format */

import { lazy } from "react";
const FeaturedClubs = lazy(
	() => import("@/routes/landing/pages/about/sections/featured-clubs")
);

export default function Landing() {
	return (
		<>
			<div>
				<section className="grid md:grid-cols-[40%_1fr] grid-cols-1 relative bg-gradient-to-tr from-blue-800 from-20% via-blue-700 via-80% to-blue-600 to-12%">
					<div className="grid mr-2 grid-rows-[70%_1fr] text-white py-8">
						<div className="flex flex-col items-start px-4 md:px-14 py-12 md:py-24 justify-start">
							<h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-2">
								Hire Talent that&apos;s Built to Win
							</h1>
							<p className="text-sm md:text-base">
								Recruit professionals with the determination and
								focus of true champions
							</p>
						</div>
					</div>
					<img
						src="/assets/images/landing/landingpage-firstImg.webp"
						loading="lazy"
						width={500}
						height={500}
						className="w-full h-auto hidden md:block object-cover"
					/>
				</section>

				<FeaturedClubs />
				<Services />
			</div>
		</>
	);
}

function Services() {
	const services = [
		{
			id: 1,
			title: "Targeted Recruitment",
			text: "We connect companies with professionals who bring the discipline, teamwork, and leadership learned in sports.",
		},
		{
			id: 2,
			title: "Dynamic Candidate Profiles",
			text: "Our dynamic cards showcase key achievements, traits, and goals, making the hiring process seamless.",
		},
		{
			id: 3,
			title: "AI-Powered Matching",
			text: "Advanced AI connects employers with candidates whose skills and values align perfectly with their needs",
		},
		{
			id: 4,
			title: "Revenue sharing Opportunities for Clubs",
			text: "Empower sports clubs with revenue-sharing opportunities every time their players/supporters get hired",
		},
	];
	return (
		<section className="flex flex-col bg-lime-100 py-8 md:py-12">
			<div className="flex flex-col text-zinc-900 items-center py-4 md:py-6 justify-center">
				<h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-center">
					Our Services
				</h3>
				<p className="text-sm md:text-base lg:text-lg text-center mt-2">
					Export our tailored solutions
				</p>
			</div>

			<div className="flex items-center justify-center w-full py-4 md:py-8 px-4 md:px-8">
				<ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl mx-auto">
					{services.map((service) => (
						<li
							key={service.id}
							className="flex flex-col min-h-[20rem] sm:min-h-[24rem] md:min-h-[28rem] h-full w-full text-slate-50 rounded-ee-3xl p-4 md:p-6 rounded-ss-3xl bg-zinc-900 items-start gap-3 md:gap-4 justify-start hover:shadow-lg transition-shadow duration-300">
							<img
								src={
									service.id % 2 === 0
										? "/assets/icons/hero-services-blue.svg"
										: "/assets/icons/hero-services-lime.svg"
								}
								alt={`${service.title} icon`}
								className="size-8 md:size-10 lg:size-12"
							/>
							<div className="flex flex-col items-start mt-auto justify-end w-full space-y-3 md:space-y-5 h-full">
								<span className="text-xl md:text-2xl lg:text-3xl font-semibold">
									{service.title}
								</span>
								<span className="text-sm md:text-base lg:text-lg text-slate-200">
									{service.text}
								</span>
								
							</div>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
