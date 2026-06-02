export function AppointmentSkeleton() {
  return (
    <div className="appointment-skeleton">
      <div className="skeleton-line small" />
      <div className="skeleton-line large" />
      <div className="skeleton-line medium" />
      <div className="skeleton-line small" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, index) => (
        <AppointmentSkeleton key={index} />
      ))}
    </div>
  );
}