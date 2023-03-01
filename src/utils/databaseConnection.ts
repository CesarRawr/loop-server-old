import { MongoClient, Db } from 'mongodb';

const url: string = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.6.2";
const client: MongoClient = new MongoClient(url);

const dbName: string = 'loop';

await client.connect();
const db: Db = client.db(dbName);

export {db};
