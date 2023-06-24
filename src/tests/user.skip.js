import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'
import { hash, genSalt } from 'bcrypt'

const request = supertest(app)

describe('/users', () => {
    afterAll(async () => {
        await prisma.$disconnect()
    })

    afterEach(async () => {
        await prisma.user.deleteMany()
    })

    describe('POST', () => {
        describe('/register', () => {
            test('should register a new user and set access token cookie', async () => {
                const userData = {
                    username: 'testuser',
                    password: 'testpassword',
                    name: 'Test User',
                }

                const response = await request
                    .post('/api/users/register')
                    .send(userData)

                const cookies = response.headers['set-cookie']
                expect(cookies).toBeDefined()

                const accessTokenCookie = cookies.find((cookie) =>
                    cookie.includes('access_token')
                )
                expect(accessTokenCookie).toBeDefined()

                expect(response.status).toBe(201)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        id: expect.any(Number),
                        username: userData.username,
                        name: userData.name,
                    })
                )
            })

            test('should return an error when registering with an existing username', async () => {
                const salt = await genSalt(10)
                const hashedPassword = await hash('existingpassword', salt)

                const existingUser = {
                    username: 'existinguser',
                    password: 'existingpassword',
                    name: 'Existing User',
                }

                await prisma.user.create({
                    data: { ...existingUser, password: hashedPassword },
                })

                const response = await request
                    .post('/api/users/register')
                    .send({
                        username: existingUser.username,
                        password: 'newpassword',
                        name: 'New User',
                    })

                expect(response.status).toBe(409)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        msg: 'Username taken',
                    })
                )
            })
        })

        describe('/login', () => {
            test('should log in an existing user and set access token cookie', async () => {
                const salt = await genSalt(10)
                const hashedPassword = await hash('existingpassword', salt)

                const existingUser = {
                    username: 'existinguser',
                    password: 'existingpassword',
                    name: 'Existing User',
                }

                await prisma.user.create({
                    data: { ...existingUser, password: hashedPassword },
                })

                const response = await request.post('/api/users/login').send({
                    username: existingUser.username,
                    password: existingUser.password,
                })

                const cookies = response.headers['set-cookie']
                expect(cookies).toBeDefined()

                const accessTokenCookie = cookies.find((cookie) =>
                    cookie.includes('access_token')
                )
                expect(accessTokenCookie).toBeDefined()

                expect(response.status).toBe(200)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        id: expect.any(Number),
                        username: existingUser.username,
                        name: existingUser.name,
                    })
                )
            })

            test('should return an error when logging in with the wrong password', async () => {
                const salt = await genSalt(10)
                const hashedPassword = await hash('existingpassword', salt)

                const existingUser = {
                    username: 'existinguser',
                    password: 'existingpassword',
                    name: 'Existing User',
                }

                await prisma.user.create({
                    data: { ...existingUser, password: hashedPassword },
                })

                const response = await request.post('/api/users/login').send({
                    username: existingUser.username,
                    password: 'wrongpassword',
                })

                expect(response.status).toBe(401)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        msg: 'invalid credentials',
                    })
                )
            })
        })
    })
})
