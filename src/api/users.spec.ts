import { addUser } from './users'
import { Request, Response, NextFunction } from 'express'
import { InsertOneResult, Document, ObjectId } from 'mongodb'
import * as helpers from '../db/helpers'
import { v1 } from 'uuid'
import { User } from '../db/entities/User'

jest.mock('../db/helpers')

const mockedAddUser = helpers.userDbHelper.addUser as jest.MockedFunction<typeof helpers.userDbHelper.addUser>
const mockedGetUsers = helpers.userDbHelper.getUsers as jest.MockedFunction<typeof helpers.userDbHelper.getUsers>
const mockUser = {
    id: v1(),
    name: "Siddharth"
}
const mockRequest = {
    body: {
        name: "Siddharth"
    }
} as Request
let actualResult: User & { _id: string }
let actualStatus: number
let responseEnded: boolean
const mockResponse = {
    json: (data: User) => {
        actualResult = data as (User & { _id: string })
    },
    status: (statusCode: number) => {
        actualStatus = statusCode
    },
    end: () => {
        responseEnded = true
    }
} as Response
const mockNextFn = (() => {}) as NextFunction
const mockObjectId = new ObjectId()

beforeEach(() => {
    mockedAddUser.mockImplementation(async (user: User) => {
        const userResponse = user as (User & { _id: ObjectId })
        userResponse._id = mockObjectId
        return { acknowledged: true, insertedId: new ObjectId() }
    })
    mockedGetUsers.mockImplementation(async (query: User) => {
        return []
    })
})

describe('Add user', () => {
    test('tc01 - happy path scenario', async () => {
        await addUser(mockRequest, mockResponse, mockNextFn)
        expect(actualResult.id).toBeDefined()
        expect(actualResult.name).toBe(mockUser.name)
        expect(actualStatus).toBe(200)
        expect(responseEnded).toBe(true)
    })
})