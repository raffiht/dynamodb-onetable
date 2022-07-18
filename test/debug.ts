/*
    debug.ts - Just for debug

    Edit your test case here and invoke via: "jest debug"

    Or run VS Code in the top level directory and just run.
 */
import { AWS, Client, Entity, Match, Model, Table, print, dump, delay } from "./utils/init";
import { OneSchema } from "../src/index.js";

jest.setTimeout(7200 * 1000);

//  Change with your schema
const schema: OneSchema = {
  version: "0.0.1",
  indexes: {
    primary: { hash: "pk", sort: "sk" },
    gs1: { hash: "gs1pk", sort: "gs1sk", project: ["name"] },
  },
  models: {
    User: {
      pk: { type: String, value: "${_type}#" },
      sk: { type: String, value: "${_type}#${id}" },

      gs1pk: { type: String, value: "${_type}#" },
      gs1sk: { type: String, value: "${_type}#${dob}" },

      name: { type: String },
      dob: { type: Date },
      id: { type: String, generate: "ulid" },
    },
  },
  params: {
    isoDates: true,
  },
};

//  Change your table params as required
const table = new Table({
  name: "DebugTable",
  client: Client,
  schema,
  logger: true,
});

//  This will create a local table
test("Create Table", async () => {
  if (!(await table.exists())) {
    await table.createTable();
    expect(await table.exists()).toBe(true);
  }
});

test("Test", async () => {
  const now = new Date();
  const User = table.getModel("User");
  await User.create({
    name: "Alice",
    dob: now,
  });
  const users = await User.find(
    {
      // This throws: OneTableError: Empty hash key. Check hash key and any value template variable references.
      gs1sk: { ">=": `User#${now.toISOString()}` },

      // This throws OneTableError: Value for "gs1sk" is not a primitive value
      // dob: { ">=": now },
    },
    {
      index: "gs1",
      hidden: true,
    }
  );
  expect(users).toHaveLength(1);
  expect(users[0]).toMatchObject({
    name: "Alice",
  });
});

test("Destroy Table", async () => {
  await table.deleteTable("DeleteTableForever");
  expect(await table.exists()).toBe(false);
});
