import { graphql } from "relay-runtime";

graphql`
  query AQuery {
    me {
      id
      ...AUserFragment
    }
  }
`;

graphql`
  fragment AUserFragment on User {
    profile {
      label
    }
  }
`;

graphql`
  query BQuery($epoch: Int!) {
    me(epoch: $epoch) {
      id
      marker
    }
  }
`;
