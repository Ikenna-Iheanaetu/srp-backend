/** @format */

import { useLocation, useNavigate } from "react-router";
import { NewJobFormData } from "../form-schema";
import React from "react";

type PreviewState =
	| { isPreviewing: true; jobData: NewJobFormData }
	| {
			isPreviewing: false;
			jobData?: NewJobFormData;
	  };

export interface StateWithJobPreview {
	jobPreview: PreviewState;
}

const isStateWithJobPreview = (state: unknown): state is StateWithJobPreview =>
	!!state &&
	typeof state === "object" &&
	"jobPreview" in state &&
	!!state.jobPreview &&
	typeof state.jobPreview === "object";

export const useJobPreviewState = () => {
	const currentLocation = useLocation();

	const previewState: PreviewState = React.useMemo(() => {
		if (isStateWithJobPreview(currentLocation.state)) {
			return currentLocation.state.jobPreview;
		}
		return {
			isPreviewing: false,
		};
	}, [currentLocation.state]);

	const navigate = useNavigate();
	const setPreviewState = React.useCallback(
		(state: PreviewState) => {
			void navigate(".", {
				replace: true,
				state: { jobPreview: state } satisfies StateWithJobPreview,
			});
		},
		[navigate],
	);

	return {
		previewState,
		setPreviewState,
	};
};
