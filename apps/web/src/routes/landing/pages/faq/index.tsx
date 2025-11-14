/** @format */

import React from "react";
import QuestionCard from "./components/question-card";
import data from "./utils/faq.json";
import AccordionMapper from "./components/accordion-mapper";
import { accordionData } from "./components/accordion-schema";

const Faq: React.FC = () => {
	return (
		<div className="w-full">
			<div className="flex bg-slate-50 flex-col items-center justify-center py-12 w-full">
				<h1 className="text-2xl font-bold mb-6">FAQs</h1>
				<p>
					Everything you need to know about us. can&apos;t find the
					answer you&apos;re looking for? Please contact us.
				</p>
			</div>

			<section className="w-full px-12 bg-white py-12">
				<div className="flex flex-col items-center justify-center mb-4">
					<h2 className="text-xl font-semibold text-zinc-900">
						General Questions
					</h2>
					<p>What you may want to know about us as a company</p>
				</div>
				<div className="w-full grid grid-cols-3">
					{data.generalQuestions.map((item, index) => (
						<QuestionCard
							key={index}
							question={item.question}
							answer={item.answer}
						/>
					))}
				</div>
			</section>

			<section className="w-full bg-slate-50 px-12 py-12">
				<div className="flex flex-col items-center justify-center mb-4">
					<h2 className="text-xl font-semibold text-zinc-900">
						For Players and Supporters
					</h2>
					<p>FAQ by players and supporters of this platform</p>
				</div>
				<div className="w-full grid grid-cols-3">
					{data.playersAndSupporters.map((item, index) => (
						<QuestionCard
							key={index}
							question={item.question}
							answer={item.answer}
						/>
					))}
				</div>
			</section>

			<section className="w-full bg-white px-12 py-12">
				<div className="flex flex-col items-center justify-center mb-4">
					<h2 className="text-xl font-semibold text-zinc-900">
						For Clubs
					</h2>
					<p>What you need to know as a club</p>
				</div>
				<div className="w-full grid grid-cols-3">
					{data.clubs.map((item, index) => (
						<QuestionCard
							key={index}
							question={item.question}
							answer={item.answer}
						/>
					))}
				</div>
			</section>

			<AccordionMapper data={accordionData} />
		</div>
	);
};

export default Faq;
