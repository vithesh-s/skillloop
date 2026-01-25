import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSystemConfig } from "@/actions/config";
import { SystemConfigForm } from "@/components/dashboard/config/system-config-form";

export default async function ConfigPage() {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    redirect("/unauthorized");
  }

  const config = await getSystemConfig();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          System Configuration
        </h1>
        <p className="text-gray-600">
          Manage system-wide settings and preferences
        </p>
      </div>

      <SystemConfigForm config={config} />
    </div>
  );
}
