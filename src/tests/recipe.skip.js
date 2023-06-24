import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'
import { genSalt, hash } from 'bcrypt'
import generateToken from '../util/generateToken.js'

const request = supertest.agent(app)

describe('/recipes', () => {
    beforeAll(async () => {
        const newUser = {
            name: 'John Doe',
            username: 'johndoe',
            password: 'password123',
        }

        const response = await request.post('/api/users/register').send(newUser)
    })

    afterAll(async () => {
        await prisma.userRecipe.deleteMany()
        await prisma.recipe.deleteMany()
        await prisma.user.deleteMany()
        await prisma.$disconnect()
    })

    const recipeData = {
        title: 'Test Recipe',
        color: 'bg-red-400',
    }

    describe('POST', () => {
        it('should create a recipe and return it', async () => {
            const response = await request.post('/api/recipes').send(recipeData)

            expect(response.status).toBe(201)
            expect(response.body).toEqual(expect.objectContaining(recipeData))
        })

        it('should return an error if required fields are missing', async () => {
            const response = await request.post('/api/recipes').send({})

            expect(response.status).toBe(400)
            expect(response.body).toEqual({
                msg: 'title is required',
            })
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
            expect(response.body).toEqual({
                msg: 'invalidQuery is not allowed',
            })
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
                expect(response.body).toEqual({
                    msg: 'You are not authorized to update this recipe',
                })
            })

            it('should return an error if the request body is invalid', async () => {
                const response = await request
                    .put(`/api/recipes/${updatedRecipe.id}`)
                    .send({
                        ...updatedRecipe,
                        title: '',
                    })
                expect(response.status).toBe(400)
                expect(response.body).toEqual({
                    msg: 'title is not allowed to be empty',
                })
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
                expect(response.body).toEqual({
                    msg: 'You are not authorized to delete this recipe',
                })
            })
        })

        describe('/share', () => {
            let sharedRecipe
            let sharedUrl
            let sharedUser

            const shareBody = {
                canEdit: true,
                title: 'Test Recipe',
            }

            beforeAll(async () => {
                const response2 = await request
                    .post('/api/users/register')
                    .send({
                        name: 'Test User',
                        username: 'testuser',
                        password: 'password123',
                    })

                sharedUser = response2.body
                const response = await request
                    .post('/api/recipes')
                    .send(recipeData)
                sharedRecipe = response.body
            })

            describe('POST', () => {
                it('should create and return a shareable recipe link', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id}/share`)
                        .send(shareBody)
                    expect(response.status).toBe(200)
                    sharedUrl = response.text
                })

                it('should return an error if the request body is invalid', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id}/share`)
                        .send({ title: 'Test Recipe' })
                    expect(response.status).toBe(400)
                    expect(response.body).toEqual(
                        expect.objectContaining({
                            msg: 'canEdit is required',
                        })
                    )
                })

                it('should return an error if the requester does not have access to share the recipe', async () => {
                    const response = await request
                        .post(`/api/recipes/${sharedRecipe.id + 1}/share`)
                        .send(shareBody)
                    expect(response.status).toBe(403)
                    expect(response.body).toEqual({
                        msg: 'You are not authorized to share this recipe',
                    })
                })
            })
            describe('PUT', () => {
                let updateShareBody
                beforeAll(async () => {
                    updateShareBody = {
                        canEdit: false,
                        userId: sharedUser.id,
                    }
                })

                it('should update a the sharing permissions of a recipe', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id}/share`)
                        .send(updateShareBody)

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('Permissions updated')
                })

                it('should return and error if the request body is invalid', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id}/share`)
                        .send({})
                    expect(response.status).toBe(400)
                    expect(response.body).toEqual({
                        msg: 'userId is required',
                    })
                })

                it('should return an error if the requester does not have access to share the recipe', async () => {
                    const response = await request
                        .put(`/api/recipes/${sharedRecipe.id + 1}/share`)
                        .send(updateShareBody)
                    expect(response.status).toBe(403)
                    expect(response.body).toEqual({
                        msg: 'Unauthorized',
                    })
                })
            })
            describe('DELETE', () => {
                it('should delete the access of designated user from designated recipe', async () => {
                    const response = await request
                        .delete(`/api/recipes/${sharedRecipe.id}/share`)
                        .send({
                            userId: sharedUser.id,
                        })

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('User removed')
                })

                it('should return and error if the request body is invalid', async () => {
                    const response = await request
                        .delete(`/api/recipes/${sharedRecipe.id}/share`)
                        .send({})
                    expect(response.status).toBe(400)
                    expect(response.body).toEqual({
                        msg: 'userId is required',
                    })
                })

                it('should return an error if the requester does not have access to share the recipe', async () => {
                    const response = await request
                        .delete(`/api/recipes/${sharedRecipe.id + 1}/share`)
                        .send({
                            userId: sharedUser.id,
                        })
                    expect(response.status).toBe(403)
                    expect(response.body).toEqual({
                        msg: 'Unauthorized',
                    })
                })
            })

            describe('/share/:url', () => {
                describe('POST', () => {
                    it('should add a user to the recipe', async () => {
                        const response = await request.post(
                            `/api/recipes/join/${sharedUrl}`
                        )

                        expect(response.status).toBe(201)
                        expect(response.text).toEqual('Successfully joined')
                    })

                    it('should return an error if url is not valid JWT', async () => {
                        const response = await request.post(
                            `/api/recipes/join/${'fakeUrl'}`
                        )
                        expect(response.status).toBe(400)
                        expect(response.body).toEqual({
                            msg: 'Link is not valid',
                        })
                    })

                    it('should return an error if user already has access to the recipe', async () => {
                        const response = await request.post(
                            `/api/recipes/join/${sharedUrl}`
                        )
                        const response2 = await request.post(
                            `/api/recipes/join/${sharedUrl}`
                        )

                        expect(response2.status).toBe(400)
                        expect(response2.body).toEqual({
                            msg: 'Already joined',
                        })
                    })
                })
            })
        })
    })
})
