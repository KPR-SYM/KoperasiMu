import Skeleton from "@shared/components/Skeleton";

export function PeriodSkeletonRow() {
    return (
        <tr className="border-b border-[var(--color-border)]/50">
            <td className="py-2.5 px-3 w-12 text-center">
                <Skeleton className="w-4 h-4 rounded-lg mx-auto" />
            </td>
            <td className="py-2.5 px-4">
                <Skeleton className="w-28 h-3.5 rounded-md" />
            </td>
            <td className="py-2.5 px-4">
                <Skeleton className="w-14 h-4 rounded-full" />
            </td>
            <td className="py-2.5 px-4">
                <Skeleton className="w-20 h-3.5 rounded-md" />
            </td>
            <td className="py-2.5 px-4">
                <Skeleton className="w-18 h-4 rounded-full" />
            </td>
            <td className="py-2.5 px-4 text-center w-32">
                <div className="flex gap-1 justify-center">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                </div>
            </td>
        </tr>
    );
}

export function PeriodSkeletonCard() {
    return (
        <div className="rounded-2xl border border-[var(--color-border)]/50 p-3 bg-[var(--color-surface)]">
            <div className="flex items-center gap-3 mb-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                    <Skeleton className="w-3/4 h-3.5 rounded-md" />
                    <Skeleton className="w-1/2 h-2.5 rounded-md" />
                </div>
            </div>
            <div className="flex gap-2 mb-2">
                <Skeleton className="w-14 h-4 rounded-full" />
                <Skeleton className="w-10 h-4 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex gap-1">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                </div>
            </div>
        </div>
    );
}
