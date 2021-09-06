import { NextFunction, Request, Response } from 'express'
import { User } from '../db/entities/User'
import { userDbHelper, hobbyDbHelper } from '../db/helpers'
import { v1 } from 'uuid'
import { wwwPath } from '../env'
import { Response404Error, Response500Error } from './ResponseError'
import { Ref } from './Ref'

const userExistsForId = async (user: Partial<User>) => {
    let userForId = await userDbHelper.getUser(user.id)
    if (userForId) return true

    return false
}

const userExistsForName = async (user: Partial<User>) => {
    let userForName = await userDbHelper.getUsers({ name: user.name })
    if (userForName.length > 0) return true

    return false
}

const validateSchema = async (user: Partial<User>, flags: Partial<{ [key in keyof User]: { type?: string, required?: boolean, possibleValues?: Array<string> } }>) => {
    const keys: Array<keyof User> = [ "id", "name" ]
    for(const key of keys) {
        if (flags[key] && flags[key].required && !user[key]) {
            throw new Response500Error(`Missing parameter '${key}'`)
        }
        if (flags[key] && flags[key].type && user[key] && typeof user[key] !== flags[key].type) {
            throw new Response500Error(`Invalid schema for parameter 'name'`)        
        }
        if (flags[key] && flags[key].possibleValues && user[key] && !flags[key].possibleValues.includes(user[key] as string))
            throw new Response500Error(`Invalid schema for parameter 'passionLevel', value should be one of ${flags[key].possibleValues}`)
    }
}

export const addUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.body as User
        await validateSchema(user, {
            name: { required: true, type: 'string' }
        })
        if (await userExistsForName(user)) {
            throw new Response500Error(`User ${user.name} already exists.`)
        }
        user.id = v1()
        await userDbHelper.addUser(user)
        res.json({
            id: user.id,
            name: user.name,
            ref: `${wwwPath}/user/${user.id}`
        })
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

const getHobbies = async (userId: string) => {
    const hobbies = await hobbyDbHelper.getHobbies({ userId })
    return hobbies.map(hobby => ({
        id: hobby.id,
        name: hobby.name,
        passionLevel: hobby.passionLevel,
        userId,
        year: hobby.year,
        ref: `${wwwPath}/hobbies/${hobby.id}`
    }))
}

export const findUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const user = await userDbHelper.getUser(id)
        if (user) {
            const hobbies = await getHobbies(user.id)
            res.json({
                id: user.id,
                name: user.name,
                hobbies
            })
            res.status(200)
            res.end()
        } else {
            new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const findUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.body as User
        await validateSchema(query, {
            name: { type: 'string' }
        })
        const users = await userDbHelper.getUsers(query)
        const responseData: Array<Ref<User>> = new Array()
        for (let i = 0; i < users.length; i++) {
            const user = users[i]
            const hobbies = await getHobbies(user.id)
            responseData.push({
                id: user.id,
                name: user.name,
                hobbies,
                ref: `${wwwPath}/user/${user.id}`
            })
        }
        res.json(responseData)
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const user = { ...req.body as User, id }
        await validateSchema(user, {
            id: { required: true, type: 'string' },
            name: { required: true, type: 'string' }
        })
        const userIsFound = await userExistsForId({ id })
        if (userIsFound) {
            // TODO: Id exists check
            await userDbHelper.updateUser(user)
            res.json({
                id: user.id,
                name: user.name,
                ref: `${wwwPath}/user/${user.id}`
            })
            res.status(200)
            res.end()
        } else {
            new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const userIsFound = await userExistsForId({ id })
        if (userIsFound) {
            // TODO: Id exists check
            await userDbHelper.deleteUser(id)
            res.json({ id, message: "User has been deleted!" })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('User not found')
        }
    } catch (ex) {
        next(ex)
    }
}
