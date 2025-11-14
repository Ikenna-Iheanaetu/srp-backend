/** @format */

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { FC } from "react";
import { AccordionList } from "./accordion-schema";

interface Props {
	data: AccordionList;
}
const AccordionMapper: FC<Props> = ({ data }) => {
	return (
		<div className="bg-gray-50">
			<Accordion type="single" collapsible className="max-w-3xl mx-auto">
				{data.map((item, index) => {
					return (
						<AccordionItem key={index} value={`item-${index}`}>
							<AccordionTrigger>{item.question}</AccordionTrigger>

							<AccordionContent className="text-slate-600">
								{item.answer}
							</AccordionContent>
						</AccordionItem>
					);
				})}
			</Accordion>
		</div>
	);
};

export default AccordionMapper;
