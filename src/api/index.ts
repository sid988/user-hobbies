import { urlencoded, json } from 'body-parser'
import express from 'express'
import { addUser, findUser, findUsers, updateUser, deleteUser } from './users'
import { wwwPort } from '../env'
import { addHobby, findHobby, findHobbies, updateHobby, deleteHobby } from './hobbies'
import { ResponseError } from './ResponseError'

const app = express()
app.use(urlencoded({ extended: true }))
app.use(json())

app.get("/ping", (req, res) => {
    res.write("pong")
    res.status(200)
    res.end()
})

app.post("/users", addUser)
app.post("/users/search", findUsers)
app.get("/user/:id", findUser)
app.patch("/user/:id", updateUser)
app.delete("/user/:id", deleteUser)

app.post("/hobbies", addHobby)
app.post("/hobbies/search", findHobbies)
app.get("/hobby/:id", findHobby)
app.patch("/hobby/:id", updateHobby)
app.delete("/hobby/:id", deleteHobby)

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    let message: string, statusCode: number
    if (!(err instanceof ResponseError)) {
        message = 'Internal Server Error'
        statusCode = 500
    } else {
        message = err.message
        statusCode = err.statusCode
    }
    if (res.headersSent) {
        return next(err)
    }
    res.status(statusCode)
    res.json({ message })
    res.end()
    console.log(`Error found: `, err)
})

app.listen(wwwPort, () => {
    console.log(`App is listening on port ${wwwPort}`)
})