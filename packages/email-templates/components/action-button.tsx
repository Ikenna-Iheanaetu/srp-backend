/** @format */

import { Button } from "@react-email/components";

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  variant?: "primary" | "secondary";
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  className,
  variant = "primary",
  ...props
}) => (
  <Button
    {...props}
    className={`rounded-md text-black text-base font-bold no-underline text-center block w-full p-[10px] ${
      variant === "primary"
        ? "bg-lime-400"
        : "bg-white border border-solid border-gray-200"
    } ${className}`}
  />
);
