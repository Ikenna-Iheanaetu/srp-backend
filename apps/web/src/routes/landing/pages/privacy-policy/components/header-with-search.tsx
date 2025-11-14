/** @format */

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import policy from "@/routes/landing/pages/privacy-policy/privacy-policy.json";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Search } from "lucide-react";

interface SubItem {
  text?: string;
  sub?: string[];
}

interface Item {
  index: string;
  text: string;
  subItems?: SubItem[];
}

interface Section {
  title: string;
  content: Item[];
}

interface HeaderWithSearchProps {
  setPolicy: (policy: Section[]) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function HeaderWithSearch({
  setPolicy,
  open,
  setOpen,
}: HeaderWithSearchProps) {
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-40" />}
      <section className="bg-slate-50 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 px-4 sm:px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-24 w-full max-w-7xl">
          <div className="flex flex-col space-y-3 items-start">
            <span className="text-blue-600 text-xs sm:text-sm">
              Current as of 20 Jan 2025
            </span>
            <h3 className="text-2xl sm:text-3xl md:text-4xl text-zinc-900 font-bold">
              Terms and Conditions
            </h3>
            <div className="flex items-center w-full">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full relative max-w-lg pl-8 flex justify-start z-50 items-center text-sm sm:text-base"
                  >
                    {value ? value : "Search"}

                    <Search className="absolute left-2 size-4 text-gray-700" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] max-w-2xl p-0 z-50"
                  align="center"
                >
                  <Command className="w-full">
                    <CommandInput
                      className="w-full max-w-lg"
                      placeholder="Search..."
                    />
                    <CommandList>
                      <CommandEmpty>No policy found.</CommandEmpty>
                      <CommandGroup>
                        {policy?.sections.map((section, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              setValue(section.title);
                              setOpen(false);
                              setPolicy([section]);
                            }}
                            className="text-sm sm:text-base"
                          >
                            {section.title}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-700 md:ml-auto max-w-sm">
            By accessing our website, you are agreeing to be bound by these
            terms of service, and agree that you are responsible for compliance
            with any applicable local laws.
          </p>
        </div>
      </section>
    </>
  );
}
