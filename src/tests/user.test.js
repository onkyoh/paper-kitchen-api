import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'

const request = supertest.agent(app)

describe('/users', () => {
    afterAll(async () => {
        await prisma.user.deleteMany({
            where: {
                username: 'testuser',
            },
        })
        await prisma.$disconnect()
    })

    const userData = {
        username: 'testuser',
        password: 'testpassword',
        name: 'Test User',
    }

    describe('/register', () => {
        describe('POST', () => {
            test('should register a new user and return a token', async () => {
                const response = await request
                    .post('/api/users/register')
                    .send(userData)

                expect(response.status).toBe(201)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        user: {
                            id: expect.any(Number),
                            username: userData.username,
                            name: userData.name,
                        },
                        token: expect.any(String),
                    })
                )
            })

            test('should return an error when registering with an existing username', async () => {
                const response = await request
                    .post('/api/users/register')
                    .send(userData)

                expect(response.status).toBe(409)
                expect(response.text).toEqual('Username taken')
            })
        })
    })

    describe('/login', () => {
        describe('POST', () => {
            test('should log in an existing user and return a token', async () => {
                const response = await request.post('/api/users/login').send({
                    username: userData.username,
                    password: userData.password,
                })

                expect(response.body).toEqual(
                    expect.objectContaining({
                        user: {
                            id: expect.any(Number),
                            username: userData.username,
                            name: userData.name,
                        },
                        token: expect.any(String),
                    })
                )
            })

            test('should return an error when logging in with the wrong password', async () => {
                const response = await request.post('/api/users/login').send({
                    username: userData.username,
                    password: 'wrongpassword',
                })

                expect(response.status).toBe(401)
                expect(response.text).toEqual('invalid credentials')
            })
        })
    })

    describe('/', () => {
        describe('GET', () => {
            test('should return the user object if the user is authenticated', async () => {
                const response = await request.post('/api/users/login').send({
                    username: userData.username,
                    password: userData.password,
                })

                const response2 = await request
                    .get('/api/users')
                    .set('Authorization', `Bearer ${response.body.token}`)

                expect(response2.status).toBe(200)

                expect(response2.body).toEqual({
                    id: expect.any(Number),
                    username: userData.username,
                    name: userData.name,
                })
            })
        })
    })
})
