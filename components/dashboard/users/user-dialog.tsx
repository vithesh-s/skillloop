"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser, updateUser, type UserFormState } from "@/actions/users";
import { getRoles } from "@/actions/roles";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RiLoader4Line, RiArrowDownSLine, RiCheckLine, RiCloseLine, RiErrorWarningLine } from "@remixicon/react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  systemRoles: string[];
  roleId?: string | null;
}

interface UserDialogProps {
  user?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const initialState: UserFormState = {};

const SYSTEM_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "TRAINER", label: "Trainer" },
  { value: "MENTOR", label: "Mentor" },
  { value: "MANAGER", label: "Manager" },
  { value: "LEARNER", label: "Learner" },
];

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [selectedSystemRoles, setSelectedSystemRoles] = useState<string[]>([]);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  
  // Wrapper for the appropriate action
  const action = user ? updateUser.bind(null, user.id) : createUser;
  
  const [state, formAction, isPending] = useActionState(action, initialState);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setSelectedSystemRoles(user.systemRoles || []);
    } else {
      setSelectedSystemRoles([]); // Reset for create mode
    }
  }, [user, open]);

  // Load job roles
  useEffect(() => {
    if (open) {
      getRoles({ pageSize: 100 }).then((data) => setRoles(data.roles));
    }
  }, [open]);

  // Handle success
  useEffect(() => {
    if (state.success && open) {
      toast.success(state.message);
      onOpenChange(false);
      router.refresh();
      if (!user) { // Reset state only on create success
           setSelectedSystemRoles([]);
      }
    }
  }, [state.success, open, user, onOpenChange, router, state.message]);

  // Handle errors
  useEffect(() => {
    if (state.message && !state.success && open) {
      toast.error(state.message);
    }
  }, [state.message, state.success, open]);

  const toggleRole = (roleValue: string) => {
    setSelectedSystemRoles((current) =>
      current.includes(roleValue)
        ? current.filter((r) => r !== roleValue)
        : [...current, roleValue]
    );
  };

  const removeRole = (roleValue: string) => {
    setSelectedSystemRoles((current) => current.filter((r) => r !== roleValue));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25 overflow-visible">
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Create New User"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="systemRoles" value={JSON.stringify(selectedSystemRoles)} />
          
          {state.message && !state.success && (
            <Alert variant="destructive">
              <RiErrorWarningLine className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name || ""}
              placeholder="John Doe"
              required
            />
            {state.errors?.name && (
              <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email || ""}
              placeholder="john@example.com"
              required
              disabled={!!user} // Email usually immutable
            />
            {state.errors?.email && (
              <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>System Roles *</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <div
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="flex min-h-10 w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                  onClick={() => setComboboxOpen(true)}
                >
                  {selectedSystemRoles.length > 0 ? (
                    selectedSystemRoles.map((role) => (
                      <Badge key={role} variant="secondary" className="mr-1 mb-1">
                        {SYSTEM_ROLES.find((r) => r.value === role)?.label || role}
                        <div
                          className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                             e.preventDefault();
                             e.stopPropagation();
                             removeRole(role);
                          }}
                        >
                          <RiCloseLine className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </div>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Select roles...</span>
                  )}
                  <div className="ml-auto flex shrink-0 opacity-50">
                     <RiArrowDownSLine className="h-4 w-4" />
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-75 p-0 z-100" align="start">
                <Command>
                  <CommandInput placeholder="Search roles..." />
                  <CommandList>
                    <CommandEmpty>No roles found.</CommandEmpty>
                    <CommandGroup>
                      {SYSTEM_ROLES.map((role) => (
                        <CommandItem
                          key={role.value}
                          value={role.label} // Command searches by value prop, usually label is better for search
                          onSelect={() => {
                            toggleRole(role.value);
                            // keep open for multiple selection
                          }}
                        >
                          <div
                            className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                              selectedSystemRoles.includes(role.value)
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <RiCheckLine className={cn("h-4 w-4")} />
                          </div>
                          {role.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {state.errors?.systemRoles && (
              <p className="mt-1 text-sm text-red-600">{state.errors.systemRoles[0]}</p>
            )}
          </div>

          <div>
            <Label htmlFor="roleId">Job Role (Optional)</Label>
            <Select name="roleId" defaultValue={user?.roleId || ""}>
              <SelectTrigger>
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent className="z-100">
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {state.errors?.roleId && (
              <p className="mt-1 text-sm text-red-600">{state.errors.roleId[0]}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  {user ? "Updating..." : "Creating..."}
                </>
              ) : (
                user ? "Update User" : "Create User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
