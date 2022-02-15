/*
   Unmarshall DynamoDB notation and transform schema attribute types
 */

import { AWS, Client, Table, print, dump, delay, Model } from "./utils/init";

const table = new Table({
    name: "UnmarshallTest",
    client: Client,
    schema: {
        format: "onetable:1.1.0",
        version: "0.0.1",
        indexes: {
            primary: { hash: "pk", sort: "sk" },
        },
        models: {
            User: {
                pk: { type: String, value: "${_type}#${id}" },
                sk: { type: String, value: "${_type}#" },
                name: { type: String },
                registered: { type: Date },
                profile: {
                    type: Object,
                    schema: {
                        dob: { type: Date },
                    },
                },
            },
        },
        params: {
            isoDates: true,
            timestamps: true,
        },
    },
});
const User = table.getModel("User");
const json = {
    name: { S: "alice" },
    registered: { S: "2022-01-01Z" },
    profile: {
        M: {
            dob: { S: "2000-01-01Z" },
        },
    },
} as const;

const unmarshallModel = <T>(model: Model<T>, item: any): T => {
    const json = (table as any).unmarshall(item, {});
    const obj = (model as any).transformReadItem("get", json, {}, {});
    return obj;
};

test("Unmarshall model", async () => {
    const obj = unmarshallModel(User, json);
    expect(obj).toEqual(
        expect.objectContaining({
            name: "alice",
            registered: new Date("2022-01-01Z"),
        })
    );
});

test("Unmarshall nested model", async () => {
    const obj = unmarshallModel(User, json);
    expect(obj).toEqual(
        expect.objectContaining({
            name: "alice",
            registered: new Date("2022-01-01Z"),
            profile: {
                dob: new Date("2000-01-01Z"),
            },
        })
    );
});
