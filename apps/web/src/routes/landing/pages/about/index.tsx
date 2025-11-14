/** @format */

import { BRAND_NAME } from "@/constants/brand";

export default function About() {
	return (
		<section className="flex flex-col">
			<div className="flex flex-col bg-slate-50 text-zinc-900 items-center p-8 md:p-16 lg:p-24 justify-center gap-2">
				<span className="text-sm mb-2 text-blue-600">Our Mission</span>

				<h3 className="text-2xl md:text-3xl font-semibold max-w-2xl text-center">
					&quot;Bridging Sports-Driven Talent with Global
					Opportunities.&quot;
				</h3>
				<p className="text-sm md:text-base max-w-3xl text-center mt-8">
					At {BRAND_NAME}, we know that young people and seniors
					who’ve been shaped by elite-level sports transition smoothly
					into working life. From an early age, they’ve learned that
					success requires full commitment. They show up on time, work
					well in teams, set their own goals, and carry a deep inner
					drive. We all share a connection to sports – and we believe
					both companies and supporters recognize the shared values
					and mutual respect between business and athletics.
				</p>

				<p className="text-sm md:text-base max-w-3xl text-center mt-8">
					Recruitment today is often costly and complex. That’s why
					we’ve created a smart, streamlined platform where companies
					and candidates can connect naturally. And best of all – when
					someone gets hired through our platform, a share of the
					revenue goes directly to the club they represent – either as
					a player or a supporter. Whether you’re a company looking
					for your next team member or a jobseeker ready for a new
					challenge, you’ll quickly find the right fit – while
					supporting the sports community that builds strong, driven
					individuals for the future.
				</p>
			</div>
		</section>
	);
}
