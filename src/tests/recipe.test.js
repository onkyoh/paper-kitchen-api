import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'

const request = supertest.agent(app)

let testUsers = []
let testRecipes = []

describe('/recipes', () => {
    const newUser = {
        name: 'John Doe',
        username: 'recipeTest',
        password: 'password123',
    }

    testUsers.push(newUser.username)

    beforeAll(async () => {
        const response = await request.post('/api/users/register').send(newUser)
    })

    afterAll(async () => {
        await prisma.userRecipe.deleteMany()
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

    const recipeData = {
        title: 'Test Recipe',
        color: 'bg-red-400',
    }

    describe('POST', () => {
        it('should create a recipe and return it', async () => {
            const response = await request.post('/api/recipes').send(recipeData)
            testRecipes.push(response.body.id)

            expect(response.status).toBe(201)
            expect(response.body).toEqual(expect.objectContaining(recipeData))
        })

        it('should return an error if required fields are missing', async () => {
            const response = await request.post('/api/recipes').send({})

            expect(response.status).toBe(400)
            expect(response.text).toEqual('title is required')
        })
    })
    describe('GET', () => {
        it('should return all recipes', async () => {
            const response = await request.get('/api/recipes')

            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
            expect(response.body[0]).toEqual(
                expect.objectContaining(recipeData)
            )
        })

        it('should return recipes with filtered query', async () => {
            const response = await request.get('/api/recipes')

            const updatedRecipe = {
                ...response.body[0],
                favourite: true,
                serves: 4,
                ingredients: [
                    {
                        id: 'ingredient1',
                        amount: '1',
                        name: 'Apple',
                    },
                ],
            }

            const response2 = await request
                .put(`/api/recipes/${updatedRecipe.id}`)
                .send(updatedRecipe)

            const response3 = await request.get(`/api/recipes/`).query({
                favourite: true,
                serves: 4,
                ingredients: ['Apple', 'ingredient2'],
            })

            expect(response3.status).toBe(200)
            expect(response3.body[0]).toEqual(
                expect.objectContaining({
                    ...updatedRecipe,
                    ingredientsQuery: ['Apple'],
                })
            )
        })

        it('should return an error if the request query is invalid', async () => {
            const response = await request.get('/api/recipes?invalidQuery=123')

            expect(response.status).toBe(400)
            expect(response.text).toEqual('invalidQuery is not allowed')
        })
    })

    describe('/:id', () => {
        let updatedRecipe

        beforeAll(async () => {
            const recipeResponse = await request.get('/api/recipes')
            updatedRecipe = {
                title: 'Updated Recipe',
                ...recipeResponse.body[0],
            }
        })
        describe('PUT', () => {
            it('should update a recipe', async () => {
                const response = await request
                    .put(`/api/recipes/${updatedRecipe.id}`)
                    .send(updatedRecipe)
                expect(response.status).toBe(200)
                expect(response.body).toEqual(updatedRecipe)
            })

            it('should return an error if the recipe does not exist', async () => {
                const response = await request
                    .put(`/api/recipes/${updatedRecipe.id + 1}`)
                    .send(updatedRecipe)

                expect(response.status).toBe(403)
                expect(response.text).toEqual(
                    'You are not authorized to update this recipe'
                )
            })

            it('should return an error if the request body is invalid', async () => {
                const response = await request
                    .put(`/api/recipes/${updatedRecipe.id}`)
                    .send({
                        ...updatedRecipe,
                        title: '',
                    })
                expect(response.status).toBe(400)
                expect(response.text).toEqual(
                    'title is not allowed to be empty'
                )
            })
        })

        describe('DELETE', () => {
            it('should delete a recipe', async () => {
                const response = await request.delete(
                    `/api/recipes/${updatedRecipe.id}`
                )

                expect(response.status).toBe(200)
            })

            it('should return an error if the recipe does not exist', async () => {
                const response = await request.delete(
                    `/api/recipes/${updatedRecipe.id + 1}`
                )
                expect(response.status).toBe(403)
                expect(response.text).toEqual(
                    'You are not authorized to delete this recipe'
                )
            })
        })

        describe('/permissions', () => {
            let sharedRecipe
            let sharedUrl
            let sharedBody

            const newShareUser = {
                name: 'Shared User',
                username: 'recipeTestShared',
                password: 'password123',
            }

            testUsers.push(newShareUser.username)

            beforeAll(async () => {
                const response = await request
                    .post('/api/recipes')
                    .send(recipeData)

                sharedRecipe = response.body
                testRecipes.push(sharedRecipe.id)

                sharedBody = {
                    owner: newUser.name,
                    title: sharedRecipe.title,
                }
            })

            describe('POST', () => {
                it('should create and return a shareable recipe link', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id}/permissions`)
                        .send(sharedBody)
                    expect(response.status).toBe(200)
                    expect(response.text).toBeDefined()
                    sharedUrl = response.text
                })

                it('should return an error if the request body is invalid', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id}/permissions`)
                        .send({ owner: sharedBody.owner })
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('title is required')
                })

                it('should return an error if the requester does not have access to share the recipe', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id + 1}/permissions`)
                        .send(sharedBody)
                    expect(response.status).toBe(403)
                    expect(response.text).toEqual(
                        'You are not authorized to share this recipe'
                    )
                })
            })
            describe('PUT', () => {
                let sharedUser

                beforeAll(async () => {
                    const response = await request
                        .post('/api/users/register')
                        .send(newShareUser)

                    sharedUser = response.body

                    await request.post(`/api/join/${sharedUrl}`)

                    await request.post('/api/users/login').send({
                        username: newUser.username,
                        password: newUser.password,
                    })
                })

                it('should update a editing permissions of designated users for a recipe', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id}/permissions`)
                        .send({ editingIds: [sharedUser.id], deletingIds: [] })

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('Permissions updated')
                })

                it('should remove designated users access for a recipe', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id}/permissions`)
                        .send({ editingIds: [], deletingIds: [sharedUser.id] })

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('Permissions updated')
                })

                it('should return and error if the request body is invalid', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id}/permissions`)
                        .send({})
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('editingIds is required')
                })

                it('should return an error if the requester is not the recipe owner', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id + 1}/permissions`)
                        .send({ editingIds: [], deletingIds: [] })
                    expect(response.status).toBe(403)
                    expect(response.text).toEqual('Unauthorized')
                })
            })
            describe('DELETE', () => {
                beforeAll(async () => {
                    await request.post('/api/users/login').send({
                        username: newShareUser.username,
                        password: newShareUser.password,
                    })
                })

                it('should allow user to remove their access from recipe', async () => {
                    const response = await request.delete(
                        `/api/recipes/${sharedRecipe.id}/permissions`
                    )
                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('You have been removed')
                })

                it('should return and error if id is invalid', async () => {
                    const response = await request.delete(
                        `/api/recipes/invalid/permissions`
                    )
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('Id is invalid')
                })
            })
        })
    })
})
