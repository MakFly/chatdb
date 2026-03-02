import { Skeleton } from "@/components/ui/skeleton";

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-3 overflow-hidden p-4">
      {/* Assistant bubble */}
      <div className="max-w-[70%] self-start">
        <Skeleton className="h-14 w-full rounded-2xl rounded-bl-sm" />
      </div>
      {/* User bubble */}
      <div className="max-w-[50%] self-end">
        <Skeleton className="h-10 w-full rounded-2xl rounded-br-sm" />
      </div>
      {/* Assistant bubble */}
      <div className="max-w-[60%] self-start">
        <Skeleton className="h-20 w-full rounded-2xl rounded-bl-sm" />
      </div>
      {/* User bubble */}
      <div className="max-w-[40%] self-end">
        <Skeleton className="h-10 w-full rounded-2xl rounded-br-sm" />
      </div>
    </div>
  );
}

/** @deprecated Use MessageListSkeleton instead */
export const ChatShellSkeleton = MessageListSkeleton;
