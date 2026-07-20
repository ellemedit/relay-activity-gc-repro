"use client";

import type { ReactNode } from "react";
import { RelayEnvironmentProvider } from "react-relay";
import {
  Environment,
  Network,
  RecordSource,
  RelayFeatureFlags,
  Store,
} from "relay-runtime";

const USER_ID = "user:1";
const PROFILE_ID = "profile:1";
const gcQueue: Array<() => void> = [];
const routeARetains = new Set<{ dispose(): void }>();

RelayFeatureFlags.ENABLE_ACTIVITY_COMPATIBILITY = true;

const network = Network.create((request, variables) => {
  if (request.name === "AQuery") {
    return Promise.resolve({
      data: {
        me: {
          __typename: "User",
          id: USER_ID,
          profile: {
            __typename: "Profile",
            id: PROFILE_ID,
            label: "Profile survived",
          },
        },
      },
    });
  }

  if (request.name === "BQuery") {
    return Promise.resolve({
      data: {
        me: {
          __typename: "User",
          id: USER_ID,
          marker: variables.epoch,
        },
      },
    });
  }

  return Promise.reject(new Error(`Unexpected operation: ${request.name}`));
});

const storeOptions: ConstructorParameters<typeof Store>[1] & {
  shouldRetainWithinTTL_EXPERIMENTAL: boolean;
} = {
  gcReleaseBufferSize: 0,
  gcScheduler: (collect) => {
    gcQueue.push(collect);
  },
  queryCacheExpirationTime: 0,
  shouldRetainWithinTTL_EXPERIMENTAL: true,
};
const store = new Store(new RecordSource(), storeOptions);

export const environment = new Environment({ network, store });
const originalRetain = environment.retain.bind(environment);
environment.retain = (operation) => {
  const disposable = originalRetain(operation);
  if (operation.request.node.params.name !== "AQuery") {
    return disposable;
  }

  let disposed = false;
  const trackedDisposable = {
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      routeARetains.delete(trackedDisposable);
      disposable.dispose();
    },
  };
  routeARetains.add(trackedDisposable);
  return trackedDisposable;
};

export type StoreState = {
  pendingGC: number;
  profile: boolean;
  user: boolean;
};

export function inspectStore(): StoreState {
  const source = store.getSource();
  return {
    pendingGC: gcQueue.length,
    profile: source.has(PROFILE_ID),
    user: source.has(USER_ID),
  };
}

export function flushScheduledGC(): StoreState {
  let runs = 0;
  while (gcQueue.length > 0) {
    const collect = gcQueue.shift();
    collect?.();
    runs += 1;
    if (runs > 100) {
      throw new Error("Relay GC scheduler did not settle");
    }
  }
  return inspectStore();
}

export function releaseRouteAAndFlushScheduledGC(): StoreState {
  for (const retain of [...routeARetains]) {
    retain.dispose();
  }
  return flushScheduledGC();
}

export function RelayProvider({ children }: { children: ReactNode }) {
  return (
    <RelayEnvironmentProvider environment={environment}>
      {children}
    </RelayEnvironmentProvider>
  );
}
