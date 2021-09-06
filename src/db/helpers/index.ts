import { mongoDbUrl, dbName } from '../../env'
import { createUserDbHelper } from './users'
import { createHobbyDbHelper } from './hobbies'

export const userDbHelper = createUserDbHelper(mongoDbUrl, dbName)
export const hobbyDbHelper = createHobbyDbHelper(mongoDbUrl, dbName)