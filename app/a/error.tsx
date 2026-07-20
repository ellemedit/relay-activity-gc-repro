"use client";

export default function RouteAError({ error }: { error: Error }) {
  return (
    <main data-testid="route-error">
      <h1>Route A error boundary</h1>
      <p>{error.name}</p>
      <pre>{error.message}</pre>
    </main>
  );
}
