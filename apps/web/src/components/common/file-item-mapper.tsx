/** @format */

import {
	getFileNameUrl,
	truncateFilename,
} from "@/lib/helper-functions/file-helpers";
import { FileIcon } from "lucide-react";
import React, { useMemo, type FC } from "react";

const viewableExtensions = [
	"pdf",
	"jpg",
	"jpeg",
	"png",
	"gif",
	"svg",
	"txt",
	"html",
	"mp4",
	"webm",
] as const;

const isViewableInBrowser = (extension: string) => {
	return viewableExtensions.some((ext) => ext === extension);
};

const getFileExtension = (filename: string): string => {
	return filename.split(".").pop()?.toLowerCase() ?? "";
};

interface FileItemProps {
	/**
	 * The name of the file to display
	 */
	filename: string;
	maxLength?: number;
}

export const FileItem: FC<FileItemProps> = ({ filename, maxLength = 10 }) => {
	const fileUrl = getFileNameUrl(filename);
	const extension = getFileExtension(filename);

	return (
		<a
			href={fileUrl}
			target={"_blank"}
			download
			className="flex items-center  gap-2 rounded-md p-2 hover:bg-muted transition-colors group"
			rel="noreferrer">
			<FileIcon className="min-h-4 max-h-4 min-w-4 max-w-4 text-muted-foreground" />
			<span className="text-sm font-medium group-hover:underline truncate">
				{truncateFilename(filename, maxLength)}
			</span>
			<span className="sr-only text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
				{isViewableInBrowser(extension) ? "View" : "Download"}
			</span>
		</a>
	);
};

interface FileListMapperProps {
	fileNames: string[];

	/**
	 * Optional title for the file list
	 */
	title?: React.ReactNode;

	/**
	 * Optional description for the file list
	 */
	description?: React.ReactNode;

	className?: string;
}

export const FileListMapper: FC<FileListMapperProps> = ({
	fileNames: externalFileNames,
	title = "Files",
	description,
	className,
}) => {
	const fileNames = useMemo(
		() => externalFileNames.filter(Boolean),
		[externalFileNames]
	);

	if (!fileNames.length) {
		return (
			<div className={`rounded-lg border p-4 ${className}`}>
				{<h3 className="text-lg font-medium">{title}</h3>}
				{description && (
					<p className="text-sm text-muted-foreground">
						{description}
					</p>
				)}
				<p className="mt-2 text-sm text-muted-foreground">
					No files available.
				</p>
			</div>
		);
	}

	return (
		<div className={`rounded-lg border p-4 ${className}`}>
			<h3 className="text-lg font-medium">{title}</h3>
			{description && (
				<p className="text-sm text-muted-foreground">{description}</p>
			)}
			<ul className="mt-3 space-y-2">
				{fileNames.map((filename, index) => (
					<li key={filename + index}>
						<FileItem filename={filename} />
					</li>
				))}
			</ul>
		</div>
	);
};
