/*
    debug.ts - Just for debug

    Edit your test case here and invoke via: "jest debug"

    Or run VS Code in the top level directory and just run.
 */
import { AWS, Client, Entity, Match, Model, Table, print, dump, delay } from "./utils/init";
import { OneSchema } from "../src/index.js";

jest.setTimeout(7200 * 1000);

//  Change with your schema
const schema = {
  version: "0.0.1",
  format: "onetable:1.0.0",
  indexes: {
    primary: { hash: "pk", sort: "sk" },
    gs1: { hash: "gs1pk", sort: "gs1sk", project: "keys", follow: false },
  },
  params: {
    timestamps: true,
    isoDates: true,
  },
  models: {
    User: {
      pk: { type: String, value: "${_type}" },
      sk: { type: String, value: "${id}" },

      gs1pk: { type: String, value: "${_type}" },
      gs1sk: { type: String, value: "${status}#${appointment}" },

      id: { type: String, required: true },
      status: { type: String, required: true },
      appointment: { type: Date, required: true },
    },
  } as const,
};

//  Change your table params as required
const table = new Table({
  name: "DebugTable",
  client: Client,
  schema,
  logger: (...args) => console.dir(args, { depth: 32, colors: true }),
});

//  This will create a local table
test("Create Table", async () => {
  if (!(await table.exists())) {
    await table.createTable();
    expect(await table.exists()).toBe(true);
  }
});

test("Test", async () => {
  type UserEntity = Entity<typeof schema.models.User>;
  const users = table.getModel<UserEntity>("User");
  const user: UserEntity = { id: "123", status: "ACTIVE", appointment: new Date() };

  await users.create(user, { exists: null });
  await users.update({ id: user.id, status: "CANCELLED" });
  const u1 = await users.get({ id: user.id }, { hidden: true });
  expect(u1?.gs1sk).toMatch(/^CANCELLED#/);
});

test("Destroy Table", async () => {
  await table.deleteTable("DeleteTableForever");
  expect(await table.exists()).toBe(false);
});
