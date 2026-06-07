import { Hono } from 'hono'
import { handle } from 'hono/vercel'


const app = new Hono().basePath('/api')

const routes = app
    .get('/hello', (c) => c.json({ message: 'Hello, World!' }))
export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type AppType = typeof routes