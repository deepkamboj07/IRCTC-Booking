import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Train, ArrowLeft, ArrowRight, CalendarDays, Search } from "lucide-react";
import { useSearchTrains } from "../../../../shared/api/trains.api";
import type { SearchParams } from "../../../../shared/api/trains.api";
import { TrainCard } from "../../components/search-results/TrainCard";
import { TrainListFilters } from "../../components/search-results/TrainListFilters";
import { Skeleton } from "../../../../shared/components/ui/skeleton";
import { PaginationRow } from "../../../../shared/components/ui/TablePagination";

const LIMIT = 10;

type TrainType = "ALL" | "EXPRESS" | "SUPERFAST" | "LOCAL";
type SortBy    = "departure" | "duration" | "availability";

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center gap-4 px-5 py-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex-1 space-y-2 flex flex-col items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-0.5 w-full" />
        </div>
        <div className="space-y-2 flex flex-col items-end">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="px-5 pb-4 flex gap-2.5">
        {[1, 2, 3, 4].map((j) => (
          <Skeleton key={j} className="h-[74px] w-[84px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SearchResultsPage() {
  const [urlParams]  = useSearchParams();
  const navigate     = useNavigate();

  const from = urlParams.get("from") ?? "";
  const to   = urlParams.get("to")   ?? "";
  const date = urlParams.get("date") ?? "";

  const [trainType,       setTrainType]     = useState<TrainType>("ALL");
  const [sortBy,          setSortBy]        = useState<SortBy>("departure");
  const [showAvailOnly,   setAvailOnly]     = useState(false);
  const [page,            setPage]          = useState(1);

  // Build the API params object — all filtering/sorting/pagination happens on the server
  const searchParams: SearchParams = {
    from,
    to,
    date,
    ...(trainType !== "ALL" ? { type: trainType as SearchParams["type"] } : {}),
    sortBy,
    availableOnly: showAvailOnly,
    page,
    limit: LIMIT,
  };

  const { data, isLoading, isError, isFetching } = useSearchTrains(searchParams);

  const trains     = data?.data ?? [];
  const meta       = data?.meta;
  const totalFound = meta?.total ?? 0;

  // Reset to page 1 whenever a filter/sort changes
  function handleTrainType(type: TrainType) { setTrainType(type); setPage(1); }
  function handleSortBy(sort: SortBy)       { setSortBy(sort);    setPage(1); }
  function handleAvailOnly(v: boolean)      { setAvailOnly(v);    setPage(1); }
  function handleClear() {
    setTrainType("ALL");
    setSortBy("departure");
    setAvailOnly(false);
    setPage(1);
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-8 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </button>
            <span>/</span>
            <span className="text-slate-600 font-medium">{from} → {to}</span>
          </nav>

          {/* Route + meta */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <span>{from}</span>
                <ArrowRight className="w-5 h-5 text-brand-accent" />
                <span>{to}</span>
              </h1>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {date}
                </span>
                {!isLoading && (
                  <span className="font-semibold text-slate-700">
                    {totalFound} train{totalFound !== 1 ? "s" : ""} found
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-brand-primary border border-brand-primary/30 bg-brand-light rounded-lg px-4 py-2 hover:bg-brand-primary hover:text-white transition-all font-medium flex-shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              Modify Search
            </button>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="max-w-[1440px] mx-auto w-full px-6 py-6 flex gap-6 items-start">

        {/* Left sidebar */}
        <aside className="w-[272px] flex-shrink-0 sticky top-[4.5rem]">
          <TrainListFilters
            trainType={trainType}
            sortBy={sortBy}
            showAvailableOnly={showAvailOnly}
            onTrainTypeChange={handleTrainType}
            onSortByChange={handleSortBy}
            onAvailableOnlyChange={handleAvailOnly}
            onClear={handleClear}
          />
        </aside>

        {/* Results column */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Stale-data overlay while next page/filter loads */}
          <div className={`transition-opacity ${isFetching && !isLoading ? "opacity-60 pointer-events-none" : ""}`}>

            {/* Loading skeletons — only on initial load */}
            {isLoading && [1, 2, 3].map((i) => <CardSkeleton key={i} />)}

            {/* Error */}
            {isError && (
              <div className="bg-white rounded-xl border border-red-200 p-8 text-center shadow-sm">
                <p className="font-semibold text-red-600">Failed to load trains.</p>
                <p className="text-slate-400 text-sm mt-1">
                  Please check your connection and try again.
                </p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && trains.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 py-20 text-center shadow-sm">
                <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Train className="w-8 h-8 text-slate-300" />
                </div>
                <p className="font-semibold text-slate-700">No trains found</p>
                <p className="text-slate-400 text-sm mt-1">
                  {trainType !== "ALL" || showAvailOnly
                    ? "Try adjusting or clearing your filters"
                    : `No trains run on ${from} → ${to} for ${date}`}
                </p>
              </div>
            )}

            {/* Train cards */}
            {trains.map((result, i) => (
              <TrainCard key={i} result={result} fromCode={from} toCode={to} date={date} />
            ))}
          </div>

          {/* Pagination — only shown when there are results */}
          {!isLoading && !isError && (meta?.totalPages ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-3.5 shadow-sm">
              <PaginationRow
                page={page}
                totalPages={meta?.totalPages ?? 1}
                total={totalFound}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
