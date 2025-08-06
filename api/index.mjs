import express from 'express'
import morgan from "morgan";
import {z} from "zod";
import 'dotenv/config'
import formData from 'form-data'
import Mailgun from 'mailgun.js'

// configure mailgun to be able to send emails
const mailgun = new Mailgun(formData)
const mailgunClient = mailgun.client({username:'api', key: process.env.MAILGUN_API_KEY})

// get access to the express object to initialize express
const app = express()

//register morgan as a middleware with Express
// middleware allows for modifying incoming requests and customizes our responses
app.use(morgan('dev'))

//setup express to use json response and parse json requests
app.use(express.json())

// create a router so that we can have custom paths for different resources in our application

const indexRoute = express.Router()

//create a simple handler to help with CORS later on
const getRouteHandler = (request, response) => {
    response.header('Access-Control-Allow-Origin', '*')

    return response.json('this thing is on')
}

const postRouteHandler = async (request, response) => {
        const schema = z.object({
            name: z.string({required_error: 'Name is required'})
                .min(1, {message: 'Name must be at least one character'})
                .max(64, {message: 'Name cannot be greater than 64 characters'})
                .trim()
                .transform(val => val.replace(/<[^>]*>/g, '')),
            email: z.string({required_error: 'Email is required'})
                .email({message: 'Invalid email address'})
                .max(128, {message: 'Email must be less than 128 characters'})
                .trim()
                .transform(val => val.replace(/<[^>]*>/g, '')),
            message: z.string({required_error: 'Message is required'})
                .min(1, {message: 'Message must be at leat one character'})
                .max(500, {message: 'Message cannot be greater than 500 characters'})
                .trim()
                .transform(val => val.replace(/<[^>]*>/g, '')),
        })
    const result = schema.safeParse(request.body)
    if (result.error) {
        return response.json({status: 418, message: result.error.issues[0].message})
    }
    if (request.body.website !== "") {
        return response.json({status: 201, message: 'email sent successfully'})
    }
    try {
        const mailgunMessage =  {
            from: `${result.data.name} <postmaster@${process.env.MAILGUN_DOMAIN}>`,
            text:  `
            from ${result.data.email}
            ${result.data.message}
            `,
            to: process.env.MAILGUN_RECIPIENT
        }
        await mailgunClient.messages.create(process.env.MAILGUN_DOMAIN, mailgunMessage)
        return response.json({status: 200, message: 'email sent successfully'})

    } catch (error) {
        console.error(error)
        return response.json({status: 500, message:'internal server error try again later'})
    }
}

indexRoute.route('/')
    .get(getRouteHandler)
    .post(postRouteHandler)

app.use('/apis', indexRoute)
app.listen(4200, () => {
    console.log('Server is running')
})

