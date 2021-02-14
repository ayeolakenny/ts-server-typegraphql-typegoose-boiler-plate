import "reflect-metadata";
import { connect } from "mongoose";
import { ObjectId } from "mongodb";
import * as path from "path";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import express from "express";

import { RecipeResolver } from "./resolvers/recipe-resolver";
import { RateResolver } from "./resolvers/rate-resolver";
import { User } from "./entities/user";
import { seedDatabase } from "./helpers";
import { TypegooseMiddleware } from "./typegoose-middleware";
import { ObjectIdScalar } from "./object-id.scalar";

export interface Context {
  user: User;
}

// replace with your values if needed
const MONGO_DB_URL = "mongodb://localhost:27017/type-graphql";

const main = async () => {
  try {
    const app = express();

    // create mongoose connection
    const mongoose = await connect(MONGO_DB_URL);

    // clean and seed database with some data
    await mongoose.connection.db.dropDatabase();
    const { defaultUser } = await seedDatabase();

    const apolloServer = new ApolloServer({
      // build TypeGraphQL executable schema
      schema: await buildSchema({
        resolvers: [RecipeResolver, RateResolver],
        emitSchemaFile: path.resolve(__dirname, "schema.gql"),
        // use document converting middleware
        globalMiddlewares: [TypegooseMiddleware],
        // use ObjectId scalar mapping
        scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }],
        validate: false,
      }),
      context: { user: defaultUser },
    });

    apolloServer.applyMiddleware({ app });

    // Start the server
    app.listen(4000, () => console.log("Server started on localhost:4000"));
  } catch (err) {
    console.error(err);
  }
};

main().catch((err) => console.log(err));
