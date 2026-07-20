"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLazyLoadQuery } from "react-relay";

import type { BQuery as BQueryType } from "../__generated__/BQuery.graphql";
import BQuery from "../__generated__/BQuery.graphql";
import {
  inspectStore,
  releaseRouteAAndFlushScheduledGC,
  type StoreState,
} from "./relay";

export function ChurnRoute({
  epoch,
  nextHref,
}: {
  epoch: number;
  nextHref: string | null;
}) {
  const [storeState, setStoreState] = useState<StoreState | null>(null);
  const data = useLazyLoadQuery<BQueryType>(
    BQuery,
    { epoch },
    { fetchPolicy: "network-only" },
  );

  useEffect(() => {
    setStoreState(inspectStore());
  }, [epoch]);

  return (
    <main data-testid={`churn-route-${epoch}`}>
      <h1>Churn route — owner {epoch}</h1>
      <p data-testid="churn-state">owner churn complete: {data.me.marker}</p>
      {nextHref == null && (
        <button
          onClick={() => setStoreState(releaseRouteAAndFlushScheduledGC())}
          type="button"
        >
          Release route A and flush scheduled Relay GC
        </button>
      )}
      <output data-testid="store-state">
        {storeState == null ? "not inspected" : JSON.stringify(storeState)}
      </output>
      <p>
        {nextHref == null ? (
          <Link href="/a" prefetch={false}>
            Restore route A
          </Link>
        ) : (
          <Link href={nextHref} prefetch={false}>
            Churn next route owner
          </Link>
        )}
      </p>
    </main>
  );
}
