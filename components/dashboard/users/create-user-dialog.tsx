"use client";

import { useState } from "react";
import { UserDialog } from "./user-dialog";
import { Button } from "@/components/ui/button";
import { RiAddLine } from "@remixicon/react";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <RiAddLine className="mr-2 h-4 w-4" />
        Create User
      </Button>
      <UserDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
