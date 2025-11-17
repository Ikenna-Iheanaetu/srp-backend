import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TableErrorProps {
  onRetry: () => void;
}

export default function TableError({ onRetry }: TableErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        There was an error loading the job postings. Please try again.
      </AlertDescription>
      <Button onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </Alert>
  );
}
