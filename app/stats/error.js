"use client";

import { statsPageStyles } from "./styles.mjs";

export default function StatsError({ error, reset }) {
  console.error(error);

  return (
    <main className="rb-stats">
      <style>{statsPageStyles}</style>
      <div className="error-panel">
        <p className="eyebrow">workspace snapshot</p>
        <h1>Workspace stats unavailable</h1>
        <p>The workspace snapshot could not be loaded. Retry after the next refresh or reload the page.</p>
        <div className="error-actions">
          <button className="retry-btn" type="button" onClick={() => reset()}>Retry</button>
        </div>
      </div>
    </main>
  );
}
