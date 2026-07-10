import { statsPageStyles } from "./styles.mjs";

function SummarySkeleton() {
  return (
    <div className="summary summary-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="panel" key={index}>
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line medium" />
        </div>
      ))}
    </div>
  );
}

function TrafficSkeleton() {
  return (
    <div className="traffic-grid" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div className="traffic-widget traffic-skeleton-card" key={index}>
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton row" style={{ height: "5.5rem", borderRadius: "10px" }} />
        </div>
      ))}
    </div>
  );
}

function ProjectSkeleton({ count = 4 }) {
  return (
    <div className="projects" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article className="project project-skeleton" key={index}>
          <div className="project-skeleton-head">
            <div style={{ display: "grid", gap: ".55rem" }}>
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line medium" />
              <div className="skeleton skeleton-line long" />
            </div>
            <div className="project-skeleton-metrics">
              {Array.from({ length: 3 }).map((__, metricIndex) => (
                <div className="metric" key={metricIndex}>
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line medium" />
                </div>
              ))}
            </div>
          </div>
          <div className="skeleton skeleton-line medium" />
          <div className="table-skeleton">
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div className="skeleton row" key={rowIndex} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export default function LoadingStatsPage() {
  return (
    <main className="rb-stats">
      <style>{statsPageStyles}</style>
      <section className="hero">
        <div>
          <p className="eyebrow">workspace snapshot</p>
          <h1>Tracked package stats</h1>
          <p>Latest budget and completion data from manifest-linked sidecar files in the current Worker snapshot.</p>
        </div>
        <SummarySkeleton />
      </section>
      <section className="traffic">
        <TrafficSkeleton />
      </section>
      <ProjectSkeleton />
    </main>
  );
}
