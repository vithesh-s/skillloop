"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateSystemConfig, type ConfigFormState } from "@/actions/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RiLoader4Line, RiSaveLine } from "@remixicon/react";
import { toast } from "sonner";
import { useEffect } from "react";

interface SystemConfigFormProps {
  config: Record<string, string>;
}

const initialState: ConfigFormState = {};

export function SystemConfigForm({ config }: SystemConfigFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateSystemConfig,
    initialState
  );
  const router = useRouter();

  // Handle success
  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      router.refresh();
    }
  }, [state.success, state.message, router]);

  // Handle errors
  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  return (
    <form action={formAction} className="space-y-6">
      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="organizationName">Organization Name *</Label>
            <Input
              id="organizationName"
              name="organizationName"
              defaultValue={config.organizationName}
              placeholder="My Organization"
              required
            />
            {state.errors?.organizationName && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.organizationName[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="organizationEmail">Organization Email *</Label>
            <Input
              id="organizationEmail"
              name="organizationEmail"
              type="email"
              defaultValue={config.organizationEmail}
              placeholder="contact@organization.com"
              required
            />
            {state.errors?.organizationEmail && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.organizationEmail[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="organizationWebsite">Website</Label>
            <Input
              id="organizationWebsite"
              name="organizationWebsite"
              type="url"
              defaultValue={config.organizationWebsite}
              placeholder="https://organization.com"
            />
            {state.errors?.organizationWebsite && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.organizationWebsite[0]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Enable system email notifications
              </p>
            </div>
            <Switch
              name="enableEmailNotifications"
              defaultChecked={config.enableEmailNotifications === "true"}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                name="smtpHost"
                defaultValue={config.smtpHost}
                placeholder="smtp.example.com"
              />
            </div>

            <div>
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                name="smtpPort"
                type="number"
                defaultValue={config.smtpPort}
                placeholder="587"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="smtpUser">SMTP Username</Label>
            <Input
              id="smtpUser"
              name="smtpUser"
              defaultValue={config.smtpUser}
              placeholder="username@example.com"
            />
          </div>

          <div>
            <Label htmlFor="smtpFrom">From Email Address</Label>
            <Input
              id="smtpFrom"
              name="smtpFrom"
              type="email"
              defaultValue={config.smtpFrom}
              placeholder="noreply@organization.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>OTP Authentication</Label>
              <p className="text-sm text-gray-500">
                Enable one-time password authentication
              </p>
            </div>
            <Switch
              name="enableOtpAuth"
              defaultChecked={config.enableOtpAuth === "true"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Training & Assessment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Training & Assessment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="assessmentPassPercentage">
              Assessment Pass Percentage (%)
            </Label>
            <Input
              id="assessmentPassPercentage"
              name="assessmentPassPercentage"
              type="number"
              min="0"
              max="100"
              defaultValue={config.assessmentPassPercentage || "70"}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum percentage required to pass assessments
            </p>
            {state.errors?.assessmentPassPercentage && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.assessmentPassPercentage[0]}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="trainingDaysBeforeReminder">
              Training Reminder (Days)
            </Label>
            <Input
              id="trainingDaysBeforeReminder"
              name="trainingDaysBeforeReminder"
              type="number"
              min="0"
              defaultValue={config.trainingDaysBeforeReminder || "7"}
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of days before training to send reminders
            </p>
            {state.errors?.trainingDaysBeforeReminder && (
              <p className="mt-1 text-sm text-red-600">
                {state.errors.trainingDaysBeforeReminder[0]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <RiLoader4Line className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <RiSaveLine className="mr-2 h-5 w-5" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
