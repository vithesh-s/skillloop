import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8 text-emerald-600" />
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
