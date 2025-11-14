/** @format */

import { FC, useEffect, useState } from "react";
import { Control, useWatch, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { FormFieldErrorAndLabelWrapper } from "@/components/common/form/wrapper";

interface Props<TForm extends Record<string, any>> {
  control: Control<TForm>;
  path: string;
  label?: string;
}

const PhoneInput: FC<Props<any>> = ({
  control,
  path,
  label = "Phone Number",
}) => {
  const phoneValue = useWatch({ control, name: path });
  const [formattedValue, setFormattedValue] = useState("");
  const { setValue } = useFormContext();

  useEffect(() => {
    if (!phoneValue) {
      setFormattedValue("");
      return;
    }

    // Remove all non-digit characters
    const digits = phoneValue.replace(/\D/g, "");

    // Format the number based on length
    let formatted = "";
    if (digits.length <= 3) {
      formatted = digits;
    } else if (digits.length <= 6) {
      formatted = `+${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length <= 10) {
      formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6
      )}`;
    } else if (digits.length <= 13) {
      formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6,
        10
      )} ${digits.slice(10)}`;
    } else {
      formatted = `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6,
        10
      )} ${digits.slice(10, 13)} ${digits.slice(13)}`;
    }

    setFormattedValue(formatted);
  }, [phoneValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 15) {
      // Increased to allow for country code + 12 digits
      setValue(path, digits, { shouldValidate: true });
    }
  };

  return (
    <FormFieldErrorAndLabelWrapper control={control} path={path} label={label}>
      <Input
        value={formattedValue}
        onChange={handleChange}
        type="tel"
        placeholder="Enter phone number with country code (e.g., +234 916 560 9345)"
        maxLength={20}
      />
    </FormFieldErrorAndLabelWrapper>
  );
};

export default PhoneInput;
