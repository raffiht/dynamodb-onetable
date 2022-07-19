/*
    debug.ts - Just for debug

    Edit your test case here and invoke via: "jest debug"

    Or run VS Code in the top level directory and just run.
 */
import { AWS, Client, Entity, Match, Model, Table, print, dump, delay, isV3 } from "./utils/init";
import { OneSchema } from "../src/index.js";

jest.setTimeout(7200 * 1000);

//  Change with your schema
const schema = {
  version: "0.1.0",
  format: "onetable:1.0.0",
  indexes: {
    primary: { hash: "pk", sort: "sk" },
  },
  params: {},
  models: {
    User: {
      pk: { type: String, value: "${_type}" },
      sk: { type: String, value: "${name}" },
      name: { type: String, required: true },
      info: {
        type: Object,
        required: false,
        schema: {
          email: { type: String, required: true },
        },
      },
    },
  } as const,
};

type User = Entity<typeof schema.models.User>;

//  Change your table params as required
const table = new Table({
  name: "DebugTable",
  client: Client,
  schema,
  logger: true,
});

const User = table.getModel<User>("User");

//  This will create a local table
beforeAll(async () => {
  if (!(await table.exists())) {
    await table.createTable();
    expect(await table.exists()).toBe(true);
  }
});

test("Test", async () => {
  await User.create({ name: "Alice" });
  const lot = await User.get({ name: "Alice" });
  expect(lot?.info).toBeUndefined();
});

afterAll(async () => {
  await table.deleteTable("DeleteTableForever");
  expect(await table.exists()).toBe(false);
});
