/** @format */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { FC, HtmlHTMLAttributes, useState } from "react";

interface Props extends HtmlHTMLAttributes<HTMLInputElement> {}
const PassWordInputWithVisibility: FC<Props> = (props) => {
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div className="h-fit w-full relative">
			<Input {...props} type={showPassword ? "text" : "password"} />
			<Button
				size={"icon"}
				variant={"ghost"}
				type="button"
				onClick={() => setShowPassword((prevState) => !prevState)}
				className="absolute top-1/2 right-0 -translate-y-1/2">
				{showPassword ? <EyeOff /> : <Eye />}
			</Button>
		</div>
	);
};

export default PassWordInputWithVisibility;
