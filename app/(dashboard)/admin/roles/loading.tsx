import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="h-16 w-64 animate-pulse rounded-lg bg-gray-200"></div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200"></div>
      </div>
      <div className="flex gap-4">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-200"></div>
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200"></div>
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-gray-200"></div>
    </div>
  );
}
