import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import SiteLogo from "./site-logo"

interface ConfirmationScreenProps {
  title: string
  message: string
  actionButtonText: string
  onActionButtonClick: () => void

}

export function ConfirmationScreen({
  title,
  message,
  actionButtonText,
  onActionButtonClick,
}: ConfirmationScreenProps) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
      {/* Logo */}
      <div className="mb-8 flex items-center">
      <SiteLogo
					classNames={{
						logoText: "!bg-none text-black",
						icon: "grayscale brightness-0",
					}}
				/>
     
      </div>

      {/* Confirmation Card */}
      <Card className="w-full max-w-md mx-auto shadow-lg border border-gray-100">
        <CardHeader className="flex justify-center items-center pt-8 pb-4">
          <CheckCircle className="h-16 w-16 text-blue-500" />
        </CardHeader>

        <CardContent className="text-center px-6 pb-4">
          <h1 className="text-xl font-medium text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{message}</p>

          
        </CardContent>

        <CardFooter>
          <Button 
            className="w-full bg-[#a4e052] hover:bg-[#93ca49] text-black font-medium py-2"
            onClick={onActionButtonClick}
          >
            {actionButtonText}
          </Button>
        </CardFooter>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">© {new Date().getFullYear()} Sports&Rekryteing</div>
    </div>
  )
}