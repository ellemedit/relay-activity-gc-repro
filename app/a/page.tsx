"use client";

import Link from "next/link";
import { useFragment, useLazyLoadQuery } from "react-relay";

import type { AQuery as AQueryType } from "../../__generated__/AQuery.graphql";
import AQuery from "../../__generated__/AQuery.graphql";
import type { AUserFragment$key } from "../../__generated__/AUserFragment.graphql";
import AUserFragment from "../../__generated__/AUserFragment.graphql";

function Profile({ user }: { user: AUserFragment$key }) {
  const data = useFragment(AUserFragment, user);

  return <p data-testid="profile-label">{data.profile.label}</p>;
}

export default function RouteA() {
  const data = useLazyLoadQuery<AQueryType>(AQuery, {});

  return (
    <main data-testid="route-a">
      <h1>Route A</h1>
      <Profile user={data.me} />
      <Link href="/b" prefetch={false}>
        Go to route B
      </Link>
    </main>
  );
}
