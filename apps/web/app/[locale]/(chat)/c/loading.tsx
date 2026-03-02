import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <div className="grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      {/* Empty message area — new chat */}
      <div className="flex-1" />
      {/* Composer */}
      <div className="border-t p-4">
        <Skeleton className="h-[72px] w-full rounded-xl" />
      </div>
    </div>
  )
}
