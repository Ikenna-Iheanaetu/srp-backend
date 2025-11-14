/** @format */

import { FC } from "react";
import { Applicant, columns } from "./columns";
import { DataTable } from "./data-table";

interface Props {
	title?: string;
	applicants: Applicant[];
}

const NewApplicantsTable: FC<Props> = ({ applicants, title }) => {
	// console.log(applicants);
	return (
		<div className="">
			<DataTable columns={columns} data={applicants} title={title} />
		</div>
	);
};

export default NewApplicantsTable;
