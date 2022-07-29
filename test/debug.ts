/*
    debug.ts - Just for debug

    Edit your test case here and invoke via: "jest debug"

    Or run VS Code in the top level directory and just run.
 */
import { AWS, Client, Entity, Match, Model, Table, print, dump, delay } from './utils/init'
import { OneSchema, UUID } from '../src/index.js'

jest.setTimeout(7200 * 1000)

//  Change with your schema
const schema = {
    version: '0.0.1',
    indexes: {
        primary: { hash: 'pk', sort: 'sk' },
        gs1: { hash: 'gs1pk', sort: 'gs1sk', follow: true },
    },
    models: {
        FriendRequest: {
            pk: { type: String, value: 'user_id:${userId}' },
            sk: { type: String, value: 'friend_request_user_id:${friendRequestUserId}' },
            userId: { type: String, required: true },
            friendRequestUserId: { type: String, required: true },

            gs1pk: { type: String, value: 'friend_request_user_id:${friendRequestUserId}' },
            gs1sk: { type: String, value: 'friend_request_created_at' },
        } as const,
    }
}

//  Change your table params as required
const table = new Table({
    name: 'DebugTable',
    client: Client,
    schema,
    logger: true,
})

export type FriendRequestType = Entity<typeof schema.models.FriendRequest>
export const FriendRequestDataClient = table.getModel<FriendRequestType>('FriendRequest');


//  This will create a local table
test('Create Table', async () => {
    if (!(await table.exists())) {
        await table.createTable()
        expect(await table.exists()).toBe(true)
    }
})

test('Test', async () => {
    const userId = UUID()
    const friendUserId = UUID()

    const transaction = {}
    await FriendRequestDataClient.create(
        {
            userId: userId,
            friendRequestUserId: friendUserId,
        },
        {
            where: 'attribute_not_exists(pk)',
            transaction,
        },
    );

    await table.transact('write', transaction);

    console.log(`After create`)
    try {
        const friendRequests = await FriendRequestDataClient.find(
            {
                // gs1pk: `friend_request_user_id:${friendUserId}`,
                friendRequestUserId: friendUserId,
                gs1sk: { begins_with: 'friend_request_created_at' },

            },
            { index: 'gs1', reverse: true }
        );
        console.log('Find results: ' + JSON.stringify(friendRequests));
    } catch (e) {
        console.log(e)
    }

    const results = await table.scan('FriendRequest')
    console.log(`Scan results ` + JSON.stringify(results))
})

test('Destroy Table', async () => {
    await table.deleteTable('DeleteTableForever')
    expect(await table.exists()).toBe(false)
})
