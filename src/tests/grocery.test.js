import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'

const request = supertest.agent(app)

let testUsers = []
let testGroceryLists = []

describe('/groceryLists', () => {
    const groceryOwner = {
        name: 'John Doe',
        username: 'groceryTest',
        password: 'password123',
    }

    testUsers.push(groceryOwner.username)

    beforeAll(async () => {
        const response = await request
            .post('/api/users/register')
            .send(groceryOwner)

        request.set('Authorization', `Bearer ${response.body.token}`)
    })

    afterAll(async () => {
        await prisma.userGroceryList.deleteMany({
            where: {
                groceryListId: {
                    in: testGroceryLists,
                },
            },
        })
        await prisma.groceryList.deleteMany({
            where: {
                id: {
                    in: testGroceryLists,
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

    const groceryListData = {
        title: 'Test GroceryList',
        color: 'bg-red-400',
    }

    describe('POST', () => {
        it('should create a grocery list and return it', async () => {
            const response = await request
                .post('/api/grocery-lists')
                .send(groceryListData)

            testGroceryLists.push(response.body.id)

            expect(response.status).toBe(201)
            expect(response.body).toEqual(
                expect.objectContaining(groceryListData)
            )
        })

        it('should return an error if required fields are missing', async () => {
            const response = await request.post('/api/grocery-lists').send({})

            expect(response.status).toBe(400)
            expect(response.text).toEqual('title is required')
        })
    })
    describe('GET', () => {
        it('should return all grocery lists', async () => {
            const response = await request.get('/api/grocery-lists')

            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
            expect(response.body[0]).toEqual(
                expect.objectContaining(groceryListData)
            )
        })
    })

    describe('/:id', () => {
        let updatedGroceryList

        beforeAll(async () => {
            const groceryListResponse = await request.get('/api/grocery-lists')
            updatedGroceryList = {
                title: 'Updated GroceryList',
                ...groceryListResponse.body[0],
            }
        })
        describe('PUT', () => {
            it('should update a grocery list', async () => {
                const response = await request
                    .put(`/api/grocery-lists/${updatedGroceryList.id}`)
                    .send(updatedGroceryList)
                expect(response.status).toBe(200)
                expect(response.body).toEqual(
                    expect.objectContaining({
                        ...updatedGroceryList,
                        updatedAt: expect.any(String),
                    })
                )
            })

            it('should return an error if the grocery list does not exist', async () => {
                const response = await request
                    .put(`/api/grocery-lists/${updatedGroceryList.id + 1}`)
                    .send(updatedGroceryList)

                expect(response.status).toBe(403)
                expect(response.text).toEqual(
                    'You are not authorized to update this grocery list'
                )
            })

            it('should return an error if the request body is invalid', async () => {
                const response = await request
                    .put(`/api/grocery-lists/${updatedGroceryList.id}`)
                    .send({
                        ...updatedGroceryList,
                        title: '',
                    })
                expect(response.status).toBe(400)
                expect(response.text).toEqual(
                    'title is not allowed to be empty'
                )
            })
        })

        describe('DELETE', () => {
            it('should delete a grocery list', async () => {
                const response = await request.delete(
                    `/api/grocery-lists/${updatedGroceryList.id}`
                )

                expect(response.status).toBe(200)
            })

            it('should return an error if the grocery list does not exist', async () => {
                const response = await request.delete(
                    `/api/grocery-lists/${updatedGroceryList.id + 1}`
                )
                expect(response.status).toBe(403)
                expect(response.text).toEqual(
                    'You are not authorized to delete this grocery list'
                )
            })
        })

        describe('/permissions', () => {
            let sharedGroceryList
            let sharedUrl
            let sharedBody

            const groceryGuest = {
                name: 'Shared User',
                username: 'groceryListTestShared',
                password: 'password123',
            }

            testUsers.push(groceryGuest.username)

            beforeAll(async () => {
                const response = await request
                    .post('/api/grocery-lists')
                    .send(groceryListData)

                sharedGroceryList = response.body
                testGroceryLists.push(sharedGroceryList.id)
            })

            describe('POST', () => {
                it('should create and return a shareable grocery list link', async () => {
                    const response = await request.post(
                        `/api/grocery-lists/${sharedGroceryList.id}/permissions`
                    )

                    expect(response.status).toBe(200)
                    expect(response.text).toBeDefined()
                    sharedUrl = response.text
                })

                it('should return an error if the request body is invalid', async () => {
                    const response = await request.post(
                        `/api/grocery-lists/invalid/permissions`
                    )
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('Id is required')
                })

                it('should return an error if the requester does not have access to share the groceryList', async () => {
                    const response = await request
                        .post(
                            `/api/grocery-lists/${
                                sharedGroceryList.id + 1
                            }/permissions`
                        )
                        .send(sharedBody)
                    expect(response.status).toBe(403)
                    expect(response.text).toEqual(
                        'You are not authorized to share this grocery list'
                    )
                })
            })
            describe('PUT', () => {
                let sharedUser

                beforeAll(async () => {
                    const response = await request
                        .post('/api/users/register')
                        .send(groceryGuest)

                    sharedUser = response.body.user

                    await request
                        .post(`/api/join/${sharedUrl}`)
                        .set('Authorization', `Bearer ${response.body.token}`)

                    await request.post('/api/users/login').send({
                        username: groceryOwner.username,
                        password: groceryOwner.password,
                    })
                })

                it('should update a editing permissions of designated users for a groceryList', async () => {
                    const response = await request
                        .put(
                            `/api/grocery-lists/${sharedGroceryList.id}/permissions`
                        )
                        .send({ editingIds: [sharedUser.id], deletingIds: [] })

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('Permissions updated')
                })

                it('should remove designated users access for a groceryList', async () => {
                    const response = await request
                        .put(
                            `/api/grocery-lists/${sharedGroceryList.id}/permissions`
                        )
                        .send({ editingIds: [], deletingIds: [sharedUser.id] })

                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('Permissions updated')
                })

                it('should return and error if the request body is invalid', async () => {
                    const response = await request
                        .put(
                            `/api/grocery-lists/${sharedGroceryList.id}/permissions`
                        )
                        .send({})
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('editingIds is required')
                })

                it('should return an error if the requester is not the groceryList owner', async () => {
                    const response = await request
                        .put(
                            `/api/grocery-lists/${
                                sharedGroceryList.id + 1
                            }/permissions`
                        )
                        .send({ editingIds: [], deletingIds: [] })
                    expect(response.status).toBe(403)
                    expect(response.text).toEqual('Unauthorized')
                })
            })
            describe('DELETE', () => {
                beforeAll(async () => {
                    await request.post('/api/users/login').send({
                        username: groceryGuest.username,
                        password: groceryGuest.password,
                    })
                })

                it('should allow user to remove their access from groceryList', async () => {
                    const response = await request.delete(
                        `/api/grocery-lists/${sharedGroceryList.id}/permissions`
                    )
                    expect(response.status).toBe(200)
                    expect(response.text).toEqual('You have been removed')
                })

                it('should return and error if id is invalid', async () => {
                    const response = await request.delete(
                        `/api/grocery-lists/invalid/permissions`
                    )
                    expect(response.status).toBe(400)
                    expect(response.text).toEqual('Id is invalid')
                })
            })
        })
    })
})
