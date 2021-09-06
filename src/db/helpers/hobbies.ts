import { MongoClient, Collection, Document, InsertOneResult, FindCursor, UpdateResult, DeleteResult } from 'mongodb'
import { Hobby } from '../entities/Hobby'

const collectionName = 'Hobbies'
export const createHobbyDbHelper = (mongoDbUrl: string, dbName: string) => {
    const dbUrl = `${mongoDbUrl}/${dbName}`

    const connect = async (task: (collection: Collection<Document>) => void) => {
        let client: MongoClient
        try {
            client = await MongoClient.connect(dbUrl)
            const db = client.db(dbName)
            let collection = db.collection(collectionName)
            if (!collection) {
                collection = await db.createCollection(collectionName)
            }
            await task(collection)
        } finally {
            if (client) {
                client.close()
            }
        }
        
    }

    const addHobby = async (hobby: Hobby) => {
        let result: InsertOneResult<Document>
        await connect(async collection => {
            result = await collection.insertOne(hobby)
        })
        return result
    }

    const getHobby = async (id: string) => {
        let result: Document
        await connect(async collection => {
            result = await collection.findOne({ id })
        })
        return result
    }

    type HobbyFindQuery = {
        [key in keyof Hobby]: string | number | {
            $regex?: string,
            $options?: string
        }
    }

    const getHobbies = async (query: Partial<Hobby>) => {
        let result: Array<Hobby> = []
        await connect(async collection => {
            let findQuery: Partial<HobbyFindQuery> = {}
            if (query.userId) {
                findQuery.userId = query.userId
            }
            if (query.name) {
                findQuery.name = { $regex: query.name, $options: 'i' }
            }
            if (query.passionLevel) {
                findQuery.passionLevel = query.passionLevel
            }
            if (query.year) {
                findQuery.year = query.year
            }
            const cursor = await collection.find(findQuery)
            await cursor.forEach((document: Document) => {
                result.push(document as Hobby)
            })
        })
        return result
    }

    const updateHobby = async (hobby: Partial<Hobby>) => {
        const newValues = {
            $set: {
                ...(hobby.name ? { name: hobby.name } : {}),
                ...(hobby.passionLevel ? { passionLevel: hobby.passionLevel } : {}),
                ...(hobby.year ? { year: hobby.year } : {})
            }
        }
        let result: UpdateResult
        await connect(async collection => {
            result = await collection.updateOne({ id: hobby.id }, newValues)
        })
        return result
    }

    const deleteHobby = async (id: string) => {
        let result: DeleteResult
        await connect(async collection => {
            result = await collection.deleteOne({ id })
        })
        return result
    }

    return { addHobby, getHobby, getHobbies, updateHobby, deleteHobby }
}