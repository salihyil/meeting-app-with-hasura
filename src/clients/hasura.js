import dotent from "dotenv";
import { GraphQLClient } from "graphql-request";

dotent.config();

const headers = {
  "Content-Type": "application/json",
  "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET,
};

export default new GraphQLClient("http://localhost:8080/v1/graphql", {
  headers,
});
