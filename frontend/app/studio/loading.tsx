import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StudioLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Skeleton Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-3 w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/5" />
            <div className="h-8 bg-white/5 rounded-md w-64" />
          </div>
          <div className="h-4 bg-white/5 rounded-md w-full" />
          <div className="h-4 bg-white/5 rounded-md w-4/5" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 bg-white/5 rounded-md w-32" />
          <div className="h-10 bg-white/10 rounded-md w-40" />
        </div>
      </div>

      {/* Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-[#09090b] border-white/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-white/5 rounded w-24" />
                <div className="w-8 h-8 bg-white/5 rounded-full" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-white/5 rounded w-16 mb-2" />
              <div className="h-3 bg-white/5 rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Skeleton Content Area */}
      <Card className="bg-[#09090b] border-white/5 min-h-[400px]">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-4 bg-white/5 rounded w-32" />
            <div className="h-4 bg-white/5 rounded w-24" />
            <div className="h-4 bg-white/5 rounded w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-4/5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
