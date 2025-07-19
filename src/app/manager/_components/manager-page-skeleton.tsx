import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerPageSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Skeleton className="h-4 w-[120px]" />
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-4 w-[320px]" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-[200px]" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2 p-6">
                  <Skeleton className="mx-auto h-5 w-[100px]" />
                  <Skeleton className="mx-auto h-8 w-[60px]" />
                  <Skeleton className="mx-auto h-3 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
