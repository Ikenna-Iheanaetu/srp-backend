/** @format */

import { DataTableAdvanced } from "@/components/common/data-table/data-table";
import { useServerTableQuery } from "@/hooks/data-table/use-server-table-query";
import { parseAsString, useQueryState } from "nuqs";
import React from "react";
import {
	ClubSelect,
	SelectedClub,
} from "../../company-management/index/components/invite-company-dialog/club-select";
import { columns } from "./columns";
import { affiliateManagementQueries } from "./query-factory";

const useSelectedClubIdSearchParams = () => {
	return useQueryState("clubId", parseAsString);
};

const useAffiliatesTableConfig = () => {
	const [clubId] = useSelectedClubIdSearchParams();

	return useServerTableQuery({
		getQueryOptions: (params) =>
			affiliateManagementQueries.affiliates({
				...params,
				clubId: clubId ?? undefined,
			}),
		tableColumnsDef: columns,
	});
};

const AffiliatesDataTable = () => {
	const [selectedClub, setSelectedClub] = React.useState<SelectedClub | null>(
		null,
	);

	const [clubId, setClubId] = useSelectedClubIdSearchParams();
	if (selectedClub && selectedClub.id !== clubId) {
		void setClubId(selectedClub.id);
	} else if (!selectedClub && clubId) {
		void setClubId(null);
	}

	const { dataTableAdvancedProps } = useAffiliatesTableConfig();

	return (
		<DataTableAdvanced
			{...dataTableAdvancedProps}
			toolbar={{
				...dataTableAdvancedProps.toolbar,
				children: (
					<ClubSelect
						selectedClub={selectedClub}
						onSelectClub={setSelectedClub}
					/>
				),
			}}
		/>
	);
};

export { AffiliatesDataTable, useAffiliatesTableConfig };
