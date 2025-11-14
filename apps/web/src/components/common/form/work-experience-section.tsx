/** @format */

import { BadgeItemsList } from "@/components/common/badge-list";
import { FormBadgeList } from "@/components/common/form/badge-list-field";
import { FormDateRangePicker } from "@/components/common/form/date-picker";
import FormSwitchToggle from "@/components/common/form/switch-toggle";
import {
	FormFieldErrorAndLabelWrapper,
	FormProviderWrapper,
} from "@/components/common/form/wrapper";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SingleWorkExperienceSchema } from "@/lib/schemas/work-experience";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	ArrayPath,
	Control,
	FieldArray,
	FieldValues,
	useFieldArray,
	useForm,
} from "react-hook-form";
import { z } from "zod";

export type SingleWorkExperience = z.infer<typeof SingleWorkExperienceSchema>;

interface ExperienceCardProps {
	experience: SingleWorkExperience;
	onEdit?: () => void;
	onDelete?: () => void;
	isForm?: boolean;
}

export function ExperienceCard({
	experience,
	onEdit,
	onDelete,
	isForm = true,
}: ExperienceCardProps) {
	const {
		title,
		company,
		companyEmail,
		companyPhone,
		startDate,
		endDate,
		current,
		remote,
		skills,
		tools,
		responsibilities,
	} = experience;

	const showEmployerContact = !!companyEmail || !!companyPhone;

	const badgeLists = useMemo(
		() =>
			[
				{ label: "Responsibilities", list: responsibilities },
				{ label: "Skills", list: skills },
				{ label: "Tools", list: tools },
			] satisfies { label: string; list: string[] | undefined }[],
		[responsibilities, skills, tools],
	);

	return (
		<Card className="border border-gray-200">
			<CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
				<div className="space-y-1">
					<h3 className="text-lg font-semibold">
						{title} | {company}
					</h3>
					<div className="flex gap-2">
						<p className="text-sm text-gray-500">
							{format(startDate, "MMM dd, yyyy")} -{" "}
							{current
								? "Present"
								: endDate && format(endDate, "MMM dd, yyyy")}
						</p>{" "}
						{remote && (
							<p className="text-sm text-gray-600">(Remote)</p>
						)}
					</div>
				</div>
				{isForm && (
					<div className="flex gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}
							className="h-8 w-8">
							<Pencil className="h-4 w-4" />
							<span className="sr-only">Edit experience</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={onDelete}
							className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600">
							<Trash2 className="h-4 w-4" />
							<span className="sr-only">Delete experience</span>
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent className="flex flex-wrap gap-4">
				{badgeLists.map((item, index) => (
					<div key={index} className="space-y-2">
						<h4 className="text-sm font-medium">{item.label}:</h4>
						{item.list && (
							<BadgeItemsList
								items={item.list}
								variant="secondary"
							/>
						)}
					</div>
				))}
			</CardContent>

			{showEmployerContact && (
				<CardFooter>
					<div>
						<h4 className="text-sm font-medium">
							Employer Contact:
						</h4>
						<div className="mt-2 space-y-3 border-l-2 border-blue-200 pl-6 text-sm">
							<p>Email: {companyEmail}</p>
							<p>Phone: {companyPhone}</p>
						</div>
					</div>
				</CardFooter>
			)}
		</Card>
	);
}

interface ExperienceFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: SingleWorkExperience) => void;
	defaultValues?: Partial<SingleWorkExperience>;
}

export function ExperienceForm({
	open,
	onOpenChange,
	onSubmit,
	defaultValues,
}: ExperienceFormProps) {
	const formDefaultValues = useMemo(
		() =>
			defaultValues
				? {
						...defaultValues,
						startDate: defaultValues?.startDate
							? defaultValues.startDate
							: new Date().toISOString(),
						endDate: defaultValues?.endDate,
					}
				: {
						title: "",
						company: "",
						startDate: new Date().toISOString(),
						endDate: undefined,
						current: false,
						remote: false,
						responsibilities: [],
						skills: [],
						tools: [],
					},
		[defaultValues],
	) satisfies ExperienceFormProps["defaultValues"];

	const form = useForm({
		resolver: zodResolver(SingleWorkExperienceSchema),
		defaultValues: formDefaultValues as z.input<
			typeof SingleWorkExperienceSchema
		>,
		mode: "onChange",
	});

	const { reset, clearErrors } = form;

	useEffect(() => {
		if (open && !defaultValues) {
			reset(formDefaultValues);
		}
	}, [open, defaultValues, reset, formDefaultValues]);

	const { register, control, watch } = form;
	const isCurrentPosition = watch("current");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 sm:max-w-[500px] h-xs:max-h-[90vh] h-sm:max-h-[85vh] h-md:max-h-[80vh]">
				<DialogHeader className="px-6 pb-2 pt-6">
					<DialogTitle>
						{defaultValues
							? "Edit Experience"
							: "Add your work Experience"}
					</DialogTitle>
				</DialogHeader>

				<ScrollArea className="h-xs:max-h-[calc(90vh-8rem)] h-sm:max-h-[calc(85vh-8rem)] h-md:max-h-[calc(80vh-8rem)]">
					<FormProviderWrapper
						form={form}
						onSubmit={onSubmit}
						className="space-y-12 px-6 py-4">
						<FormFieldErrorAndLabelWrapper
							label="Role"
							control={control}
							path="title">
							<Input {...register("title")} />
						</FormFieldErrorAndLabelWrapper>

						<FormFieldErrorAndLabelWrapper
							label="Company"
							control={control}
							path="company">
							<Input {...register("company")} />
						</FormFieldErrorAndLabelWrapper>

						<FormFieldErrorAndLabelWrapper
							label="Company Phone Number - optional"
							control={control}
							path="companyPhone">
							<Input
								{...register("companyPhone")}
								type="number"
							/>
						</FormFieldErrorAndLabelWrapper>

						<FormFieldErrorAndLabelWrapper
							label="Company Email - optional"
							control={control}
							path="companyEmail">
							<Input {...register("companyEmail")} />
						</FormFieldErrorAndLabelWrapper>

						<FormBadgeList
							control={form.control}
							path="responsibilities"
							label="Add Responsibilities"
							emptyMessage="No responsibilities added yet"
						/>

						<FormBadgeList
							control={form.control}
							path="skills"
							label="Add Skills"
							emptyMessage="No skills added yet"
						/>

						<FormBadgeList
							control={form.control}
							path="tools"
							label="Add Software, tools"
							emptyMessage="No tools added yet"
						/>

						<FormDateRangePicker
							control={control}
							intervalProps={{
								start: {
									path: "startDate",
									label: "Start Date",
								},
								end: {
									path: "endDate",
									label: "End Date",
									disabled: isCurrentPosition,
								},
							}}
						/>

						<div className="space-y-2">
							<FormSwitchToggle
								control={form.control}
								path="current"
								rightLabel="This is my current position"
								onCheckedChange={(checked) => {
									if (checked) {
										form.setValue("endDate", undefined);
										clearErrors("endDate");
									}
								}}
							/>
							<FormSwitchToggle
								control={form.control}
								path="remote"
								rightLabel="This was a remote work position"
							/>
						</div>

						<div className="flex justify-end gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<Button
								type="button"
								onClick={() =>
									void form.handleSubmit(onSubmit)()
								}
								className="button">
								Save
							</Button>
						</div>
					</FormProviderWrapper>
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}

type WorkExperienceArrayPath<TFieldValues extends FieldValues> = {
	[P in ArrayPath<TFieldValues>]: SingleWorkExperience[] extends TFieldValues[P]
		? P
		: never;
}[ArrayPath<TFieldValues>];

interface WorkExperienceSectionProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	path: WorkExperienceArrayPath<TFieldValues>;
	label?: string;
	className?: string;
	showError?: boolean;
}

export function FormWorkExperiencesSection<TFieldValues extends FieldValues>({
	control,
	path,
	label = "Work Experience",
	className,
	showError = true,
}: WorkExperienceSectionProps<TFieldValues>) {
	const [open, setOpen] = useState(false);
	const [editIndex, setEditIndex] = useState<number | null>(null);

	const { fields, append, update, remove } = useFieldArray({
		control,
		name: path,
	});

	const handleSubmit = (
		data: SingleWorkExperience /* FieldArray<TFieldValues, typeof path> */,
	) => {
		const transformedData = {
			...data,
			responsibilities: data.responsibilities ?? [],
			skills: data.skills ?? [],
			tools: data.tools ?? [],
		} satisfies SingleWorkExperience;

		if (editIndex !== null) {
			update(
				editIndex,
				transformedData as FieldArray<TFieldValues, typeof path>,
			);
		} else {
			append(transformedData as FieldArray<TFieldValues, typeof path>);
		}
		setEditIndex(null);
		setOpen(false);
	};

	const handleEdit = (index: number) => {
		setEditIndex(index);
		setOpen(true);
	};

	const handleDelete = (index: number) => {
		remove(index);
	};

	return (
		<FormFieldErrorAndLabelWrapper
			control={control}
			path={path}
			label={label}
			showError={showError}
			className={className}>
			<div className="space-y-4">
				<div className="grid gap-4">
					{fields.map((field, index) => (
						<ExperienceCard
							key={field.id}
							experience={
								field as unknown as SingleWorkExperience
							}
							onEdit={() => handleEdit(index)}
							onDelete={() => handleDelete(index)}
						/>
					))}
				</div>

				<Button
					type="button"
					onClick={() => {
						setEditIndex(null);
						setOpen(true);
					}}
					className="border-input h-12 w-full border bg-gray-100 text-gray-700 hover:bg-gray-200">
					<Plus className="mr-1 h-4 w-4" />
					Add Experience
				</Button>

				<ExperienceForm
					open={open}
					onOpenChange={setOpen}
					onSubmit={(data) => handleSubmit(data)}
					defaultValues={
						editIndex !== null
							? (fields[
									editIndex
								] as unknown as SingleWorkExperience)
							: undefined
					}
				/>
			</div>
		</FormFieldErrorAndLabelWrapper>
	);
}
