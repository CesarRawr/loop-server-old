import {ObjectID, Collection} from 'mongodb';

const saveOne = async (collection: Collection, data: any): Promise<DbServiceResponse> => {
  try {
    await collection.insertOne({...data});
    return {
      error: false,
    };
  } catch(e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

const getOne = async (collection: Collection, option: any, projection: any = {}): Promise<DbServiceResponse> => {
  try {
    const query = typeof option === 'string' ? {
      _id: new ObjectID(option),
    }: option;
    
    const data: any = await collection.findOne(query, projection);
    return {
      error: false,
      data,
    };
  } catch(e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

const getAll = async (collection: Collection, query?: any): Promise<DbServiceResponse> => {
  try {
    const condition = !!query ? query: {};
    const data: any = await collection.find(condition).toArray();
    return {
      error: false,
      data,
    };
  } catch(e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

const updateOne = async (collection: Collection, query: any, modifier: any): Promise<DbServiceResponse> => {
  try {
    const filter = typeof query === 'string' ? {
      _id: new ObjectID(query),
    }: query;

    await collection.updateOne(filter, modifier);
    return {
      error: false,
    };
  } catch(e) {
    console.log(e);
    return {
      error: true,
    };
  }
}

export {
  saveOne,
  getOne,
  getAll,
  updateOne,
}

export interface DbServiceResponse {
  error: boolean;
  data?: any;
}
