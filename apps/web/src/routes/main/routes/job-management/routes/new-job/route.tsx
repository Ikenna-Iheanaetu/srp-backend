/** @format */

import { PreviewNewJob } from "./components/preview";
import { NewJobForm } from "./components/form";
import { useJobPreviewState } from "./hooks/use-job-preview-state";

export default function PostNewJobRoute() {
	const { previewState, setPreviewState } = useJobPreviewState();

	return previewState.isPreviewing ? (
		<PreviewNewJob
			onEdit={(existingJobdata) =>
				setPreviewState({
					isPreviewing: false,
					jobData: existingJobdata,
				})
			}
		/>
	) : (
		<NewJobForm
			existingJobdata={previewState.jobData}
			onPreview={(data) =>
				setPreviewState({
					isPreviewing: true,
					jobData: data,
				})
			}
		/>
	);
}
