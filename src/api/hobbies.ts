import { NextFunction, Request, Response } from 'express'
import { Hobby } from '../db/entities/Hobby'
import { PassionLevel } from '../db/entities/PassionLevel'
import { userDbHelper, hobbyDbHelper } from '../db/helpers'
import { v1 } from 'uuid'
import { wwwPath } from '../env'
import { Response500Error, Response404Error } from './ResponseError'

const hobbyExistsForId = async (hobby: Partial<Hobby>) => {
    let hobbyForId = await hobbyDbHelper.getHobby(hobby.id) as Hobby
    if (hobbyForId) return true

    return false
}

const hobbyExistsForName = async (hobby: Partial<Hobby>) => {
    let hobbyForName = await hobbyDbHelper.getHobbies({ userId: hobby.userId, name: hobby.name })
    if (hobbyForName.length > 0) return true

    return false
}

const hobbyExistsForOtherUser = async (hobby: Partial<Hobby>) => {
    if (!hobby.userId) return false
    let hobbyForId = await hobbyDbHelper.getHobby(hobby.id) as Hobby
    if (hobbyForId.userId === hobby.userId) return false
    let hobbyForName = await hobbyDbHelper.getHobbies({ userId: hobby.userId, name: hobbyForId.name })
    if (hobbyForName.length > 0) return true
    return false
}

const userExists = async (userId: string) => {
    const user = await userDbHelper.getUser(userId)
    if (user) return true
    return false
}

type HobbyValidationFlags = {
    [key in keyof Hobby]: {
        type?: string,
        required?: boolean,
        possibleValues?: Array<string>,
        regExp?: string,
        max?: number
    }
}

const validateSchema = async (hobby: Partial<Hobby>, flags: Partial<HobbyValidationFlags>) => {
    const keys: Array<keyof Hobby> = [ "id", "name", "passionLevel", "userId", "year" ]
    const isParameterMissing = (key: keyof Hobby) =>
        flags[key] &&
        flags[key].required &&
        !hobby[key]
    const isTypeMismatch = (key: keyof Hobby) => 
        flags[key] && 
        flags[key].type &&
        hobby[key] &&
        typeof hobby[key] !== flags[key].type
    const isNotFromEnum = (key: keyof Hobby) =>
        flags[key] && 
        flags[key].possibleValues &&
        hobby[key] &&
        !flags[key].possibleValues.includes(hobby[key] as string)
    const isNotRegExMatch = (key: keyof Hobby) =>
        flags[key] && 
        flags[key].regExp &&
        hobby[key] &&
        !new RegExp(flags[key].regExp).test(hobby[key] as string)
    const isBeyondMaxValue = (key: keyof Hobby) =>
        flags[key] && 
        flags[key].max &&
        hobby[key] &&
        hobby[key] > flags[key].max

    for(const key of keys) {
        if (isParameterMissing(key)) {
            throw new Response500Error(`Missing parameter '${key}'`)
        }
        if (isTypeMismatch(key)) {
            throw new Response500Error(`Invalid schema for parameter 'name'`)        
        }
        if (isNotFromEnum(key)) {
            throw new Response500Error(`Invalid schema for parameter 'passionLevel', value should be one of ${flags[key].possibleValues}`)
        }
        if (isNotRegExMatch(key)) {
            throw new Response500Error(`Regex '${flags[key].regExp}' mismatch for parameter '${key}'`)
        }
        if (isBeyondMaxValue(key)) {
            throw new Response500Error(`Parameter '${key}' exceeds max limit of ${flags[key].max}`)
        }
    }
}

export const addHobby = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hobby = req.body as Hobby
        await validateSchema(hobby, {
            name: { required: true, type: 'string' },
            passionLevel: { required: true, type: 'string', possibleValues: [
                PassionLevel.Low,
                PassionLevel.Medium,
                PassionLevel.High,
                PassionLevel.VeryHigh
            ] },
            userId: { required: true, type: 'string' },
            year: { required: true, type: 'number', regExp: '^[0-9]{4}$', max: new Date().getFullYear() }
        })
        if (await hobbyExistsForName(hobby)) {
            throw new Response500Error(`Hobby ${hobby.name} already exists for user ${hobby.userId}.`)
        }
        hobby.id = v1()
        await hobbyDbHelper.addHobby(hobby)
        res.json({
            id: hobby.id,
            name: hobby.name,
            userId: hobby.userId,
            passionLevel: hobby.passionLevel,
            year: hobby.year,
            ref: `${wwwPath}/hobby/${hobby.id}`
        })
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const findHobby = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const hobby = await hobbyDbHelper.getHobby(id) as Hobby
        if (hobby) {
            res.json({
                id: hobby.id,
                name: hobby.name,
                userId: hobby.userId,
                passionLevel: hobby.passionLevel,
                year: hobby.year
            })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('Hobby not found')
        }
    } catch (ex) {
        next(ex)
    }
}

export const findHobbies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.body as Hobby
        await validateSchema(query, {
            name: { type: 'string' },
            passionLevel: { type: 'string', possibleValues: [
                PassionLevel.Low,
                PassionLevel.Medium,
                PassionLevel.High,
                PassionLevel.VeryHigh
            ] },
            userId: { type: 'string' },
            year: { type: 'number', regExp: '^[0-9]{4}$', max: new Date().getFullYear() }
        })
        const hobbies = await hobbyDbHelper.getHobbies(query)
        const responseData = hobbies.map(hobby => ({
            id: hobby.id,
            name: hobby.name,
            userId: hobby.userId,
            passionLevel: hobby.passionLevel,
            year: hobby.year,
            ref: `${wwwPath}/hobby/${hobby.id}`
        }))
        res.json(responseData)
        res.status(200)
        res.end()
    } catch (ex) {
        next(ex)
    }
}

export const updateHobby = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        if (Object.getOwnPropertyNames(req.body).length === 0) {
            throw new Error(`No parameters found for the patch request`)
        }
        const hobby = { ...req.body as Hobby, id }
        await validateSchema(hobby, {
            id: { required: true, type: 'string' },
            name: { type: 'string' },
            passionLevel: { type: 'string', possibleValues: [
                PassionLevel.Low,
                PassionLevel.Medium,
                PassionLevel.High,
                PassionLevel.VeryHigh
            ] },
            userId: { type: 'string' },
            year: { type: 'number', regExp: '^[0-9]{4}$', max: new Date().getFullYear() }
        })
        if (hobby.userId && !await userExists(hobby.userId)) {
            throw new Error(`User ${hobby.userId} does not exist`)
        }
        if (await hobbyExistsForOtherUser(hobby)) {
            throw new Error(`Hobby already exists for the new user ${hobby.userId}`)
        }

        const hobbyIsFound = await hobbyExistsForId(hobby)
        if (hobbyIsFound) {
            // TODO: Id exists check
            await hobbyDbHelper.updateHobby(hobby)
            res.json({
                id: hobby.id,
                name: hobby.name,
                userId: hobby.userId,
                passionLevel: hobby.passionLevel,
                year: hobby.year,
                ref: `${wwwPath}/hobby/${hobby.id}`
            })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('Hobby not found')
        }    
    } catch (ex) {
        console.log('Error while adding a hobby: ', ex)
        next(ex)
    }
}

export const deleteHobby = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        await validateSchema({ id }, {
            id: { required: true, type: 'string' }
        })
        const hobbyIsFound = await hobbyExistsForId({ id })
        if (hobbyIsFound) {
            // TODO: Id exists check
            await hobbyDbHelper.deleteHobby(id)
            res.json({ id, message: "Hobby has been deleted!" })
            res.status(200)
            res.end()
        } else {
            throw new Response404Error('Hobby not found')
        }
    } catch (ex) {
        next(ex)
    }
}
