import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'

const request = supertest.agent(app)

let testUsers = []
let testRecipes = []
let token

describe('/join', () => {
    let url
    let recipe
    let owner
    let joiner

    beforeAll(async () => {
        const response = await request.post('/api/users/register').send({
            name: 'Owner',
            email: 'owneremail@fake.ca',
            username: 'joinTestOwner',
            password: 'password123',
        })

        request.set('Authorization', `Bearer ${response.body.token}`)

        owner = response.body.user

        testUsers.push(owner.username)

        const newRecipe = {
            title: 'Test Recipe',
            color: 'bg-red-400',
        }

        const response2 = await request.post('/api/recipes').send(newRecipe)

        recipe = response2.body
        testRecipes.push(recipe.id)

        const response3 = await request.post(
            `/api/recipes/${recipe.id}/permissions`
        )

        url = response3.text
    })

    afterAll(async () => {
        await prisma.userRecipe.deleteMany({
            where: {
                recipeId: {
                    in: testRecipes,
                },
            },
        })
        await prisma.recipe.deleteMany({
            where: {
                id: {
                    in: testRecipes,
                },
            },
        })

        await prisma.user.deleteMany({
            where: {
                username: {
                    in: testUsers,
                },
            },
        })
        await prisma.$disconnect()
    })
    describe('/:url', () => {
        describe('GET', () => {
            it('should return decoded url', async () => {
                const response = await request.get(`/api/join/${url}`)

                expect(response.status).toBe(200)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        ...recipe,
                    })
                )
            })

            it('should return an error if the url is invalid', async () => {
                const response = await request.get('/api/join/invalid')

                expect(response.status).toBe(400)
                expect(response.text).toEqual('Link is not valid')
            })
        })
        describe('POST', () => {
            beforeAll(async () => {
                const response = await request
                    .post('/api/users/register')
                    .send({
                        name: 'Joiner',
                        username: 'joinTestJoiner',
                        email: 'joineremail@fake.ca',
                        password: 'password123',
                    })

                request.set('Authorization', `Bearer ${response.body.token}`)

                joiner = response.body.user

                testUsers.push(joiner.username)
            })

            it('should grant access to user for the recipe', async () => {
                const response = await request.post(`/api/join/${url}`)

                expect(response.status).toBe(201)
                expect(response.text).toEqual('/recipes')
            })

            it('should return an error if the user already has access', async () => {
                const response = await request.post(`/api/join/${url}`)

                expect(response.status).toBe(400)
                expect(response.text).toEqual('Already joined')
            })
            it('should return an error if link is invalid', async () => {
                const response = await request.post(`/api/join/invalid`)

                expect(response.status).toBe(400)
                expect(response.text).toEqual('Link is not valid')
            })
        })
    })
})
