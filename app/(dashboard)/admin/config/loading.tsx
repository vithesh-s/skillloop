import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-64 animate-pulse rounded-lg bg-gray-200"></div>
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}
