/** @format */

import { Body, Heading } from "@react-email/components";
import { cn } from "@repo/shared";
import React from "react";

const EmailBody = ({
  className,
  ...props
}: React.ComponentProps<typeof Body>) => (
  <Body {...props} className={cn("bg-white p-8", className)} />
);

const EmailHeading = ({
  className,
  ...props
}: React.ComponentProps<typeof Heading>) => (
  <Heading {...props} className={cn("text-2xl my-8", className)} />
);

export { EmailBody, EmailHeading };
