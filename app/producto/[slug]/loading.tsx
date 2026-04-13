export default function Loading() {
  return (
    <div className="container-edge py-10 sm:py-16">
      <div className="grid animate-pulse gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="aspect-[4/5] bg-celeste-50" />
        <div className="space-y-4">
          <div className="h-3 w-24 bg-celeste-100" />
          <div className="h-10 w-3/4 bg-celeste-100" />
          <div className="h-6 w-32 bg-celeste-100" />
          <div className="mt-6 h-4 w-full bg-celeste-50" />
          <div className="h-4 w-2/3 bg-celeste-50" />
          <div className="mt-6 flex gap-2">
            <div className="h-10 w-16 bg-celeste-50" />
            <div className="h-10 w-16 bg-celeste-50" />
            <div className="h-10 w-16 bg-celeste-50" />
          </div>
          <div className="mt-6 h-12 w-full bg-celeste-100" />
        </div>
      </div>
    </div>
  );
}
