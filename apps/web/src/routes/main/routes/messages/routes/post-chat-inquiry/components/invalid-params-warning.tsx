/** @format */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export const InvalidParamsWarning = () => (
	<Alert className="border-orange-200 bg-orange-50">
		<AlertCircle className="h-4 w-4 text-orange-600" />
		<AlertDescription className="text-orange-800">
			Missing or invalid inquiry parameters. Please use the link from your
			email.
		</AlertDescription>
	</Alert>
);
