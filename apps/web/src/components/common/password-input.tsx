/** @format */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SafeOmit } from "@/types";
import { Eye, EyeOff } from "lucide-react";
import React, { useState } from "react";

type PasswordInputProps = SafeOmit<React.ComponentProps<typeof Input>, "type">;

const PasswordInput: React.FC<PasswordInputProps> = (props) => {
	const [isPasswordShown, setIsPasswordShown] = useState(false);

	return (
		<div className="relative">
			<Input {...props} type={isPasswordShown ? "text" : "password"} />

			<Button
				type="button"
				variant="ghost"
				size="sm"
				className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
				onClick={() => setIsPasswordShown((prev) => !prev)}>
				{isPasswordShown ? <EyeOff /> : <Eye />}
				<span className="sr-only">
					{isPasswordShown ? "hide password" : "show password"}
				</span>
			</Button>
		</div>
	);
};

export { PasswordInput };
export type { PasswordInputProps };
