/** @format */

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { BRAND_NAME } from "@/constants/brand";
import { runInDevOnly } from "@/lib/helper-functions/run-only-in-dev-mode";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, DownloadIcon } from "lucide-react";
import QRCode, { QRCodeRenderersOptions } from "qrcode";
import React, { useRef } from "react";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CopyToClipboardButton } from "./copy-to-clipboard-button";
interface QRCodeGeneratorProps extends QRCodeRenderersOptions {
	value: string;
	className?: string;
	/**Callback to fire when an error occurs generating the QRCode. */
	onError?: (error: unknown) => void;
	/**Use this to get an instance of the rendered canvas element. */
	ref?: React.RefObject<HTMLCanvasElement | null>;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
	value,
	width = 200,
	margin = 1,
	color = {
		dark: "#000000",
		light: "#FFFFFF",
	},
	onError,
	className,
	ref,
	...otherRendererProps
}) => {
	const internalRef = useRef<HTMLCanvasElement>(null);

	const canvasRef = ref ?? internalRef;

	React.useEffect(() => {
		if (canvasRef.current) {
			QRCode.toCanvas(
				canvasRef.current,
				value,
				{
					...otherRendererProps,
					width,
					margin,
					color,
				},
				(error) => {
					runInDevOnly(
						() =>
							error &&
							console.error(
								`Error generating QR code for "${value}": `,
								error
							)
					);
					onError?.(error);
				}
			);
		}

		return () => {
			canvasRef.current = null;
		};
	}, [value, width, onError, otherRendererProps, margin, color, canvasRef]);

	return <canvas ref={canvasRef} className={className} />;
};

interface QRDownloadDropdownProps {
	filename: string;
	canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const QR_DOWNLOAD_FORMAT = "PNG";

const QRDownloadDropdown: React.FC<QRDownloadDropdownProps> = ({
	filename,
	canvasRef,
}) => {
	const downloadURLRef = React.useRef<string>(null);
	React.useEffect(() => {
		return () => {
			if (downloadURLRef.current) {
				URL.revokeObjectURL(downloadURLRef.current);
			}
		};
	}, []);
	const downloadQRCode = () => {
		const canvas = canvasRef.current;
		if (canvas) {
			const refinedFormat = QR_DOWNLOAD_FORMAT.toLowerCase();
			canvas.toBlob((blob) => {
				if (blob) {
					const link = document.createElement("a");
					downloadURLRef.current = URL.createObjectURL(blob);
					link.download = `${filename}.${refinedFormat}`;
					link.href = downloadURLRef.current;
					link.click();

					// Cleanup the object URL after a while
					setTimeout(() => {
						if (downloadURLRef.current) {
							URL.revokeObjectURL(downloadURLRef.current);
						}
					}, 100);
				} else {
					toast.error("Failed to download QR Code", {
						description: "Unable to create blob from canvas.",
						id: "qr-code-download-error" + filename,
					});
				}
			}, `image/${refinedFormat}`);
		}
	};

	const getClipboardItem = () => {
		return new Promise<[ClipboardItem]>((resolve, reject) => {
			const canvas = canvasRef.current;

			if (canvas) {
				const imageFormat = `image/${QR_DOWNLOAD_FORMAT.toLowerCase()}`;
				canvas.toBlob((blob) => {
					if (blob) {
						try {
							const clipboardItem = new ClipboardItem({
								[imageFormat]: blob,
							});
							resolve([clipboardItem]);
						} catch (error) {
							reject(error as Error);
						}
					} else {
						reject(new Error("Unable to create blob from canvas"));
					} // CopyToClipboardButton component handles error reporting
				}, imageFormat);
			}
		});
	};

	const [isOpen, setIsOpen] = React.useState(false);
	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button type="button" className="button !px-4 w-full">
					Download
					<ChevronDownIcon className="ml-1" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={downloadQRCode}>
					<DownloadIcon className="mr-1" />
					Download
				</DropdownMenuItem>

				<DropdownMenuItem
					onSelect={
						(e) => e.preventDefault() // prevent closing the dropdown so that user gets the copied state feedback
					}
					asChild>
					<CopyToClipboardButton
						clipboardItem={getClipboardItem}
						className="w-full justify-start font-normal"
					/>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

interface QRCodeWithDownloadProps extends QRCodeGeneratorProps {
	label?: string;
	description?: string;
	/**Please prefix with {@link BRAND_NAME} for branding purposes.*/
	filename?: string;
}

const QRCodeWithDownload: React.FC<QRCodeWithDownloadProps> = ({
	className,
	label = "QR code",
	description = "Scan code or download.",
	filename = `${BRAND_NAME}_qr_code`,
	...props
}) => {
	// ref cleanup is handled by QRCodeGenerator internally
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	return (
		<Card className={cn("w-fit", className)}>
			<CardHeader>
				<CardTitle>{label}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<QRCodeGenerator {...props} key={props.value} ref={canvasRef} />
			</CardContent>
			<CardFooter className="gap-2 w-full">
				<QRDownloadDropdown filename={filename} canvasRef={canvasRef} />
			</CardFooter>
		</Card>
	);
};

export { QR_DOWNLOAD_FORMAT, QRCodeGenerator, QRCodeWithDownload };
export type { QRCodeGeneratorProps, QRCodeWithDownloadProps };
