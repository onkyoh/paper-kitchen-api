import supertest from 'supertest'
import app from '../app.js'
import prisma from '../config/db.js'
import { genSalt, hash } from 'bcrypt'
import generateToken from '../util/generateToken.js'

const request = supertest.agent(app)

describe('/groceryLists', () => {
    beforeAll(async () => {
        const newUser = {
            name: 'John Doe',
            username: 'johndoe',
            password: 'password123',
        }

        const response = await request.post('/api/users/register').send(newUser)
    })

    afterAll(async () => {
        await prisma.userGroceryList.deleteMany()
        await prisma.groceryList.deleteMany()
        await prisma.user.deleteMany()
        await prisma.$disconnect()
    })

    const groceryData = {
        title: 'Test GroceryList',
        color: 'bg-red-400',
    }

    describe('POST', () => {
        it('should create a grocery list and return it', async () => {
            const response = await request
                .post('/api/grocery-lists')
                .send(groceryData)

            expect(response.status).toBe(201)
            expect(response.body).toEqual(expect.objectContaining(groceryData))
        })

        it('should return an error if required fields are missing', async () => {
            const response = await request.post('/api/grocery-lists').send({})

            expect(response.status).toBe(400)
            expect(response.body).toEqual({
                msg: 'title is required',
            })
        })
    })
    describe('GET', () => {
        it('should return all grocery lists', async () => {
            const response = await request.get('/api/grocery-lists')

            expect(response.status).toBe(200)
            expect(response.body.length).toBe(1)
            expect(response.body[0]).toEqual(
                expect.objectContaining(groceryData)
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
                expect(response.body).toEqual(updatedGroceryList)
            })

            it('should return an error if the grocery list does not exist', async () => {
                const response = await request
                    .put(`/api/grocery-lists/${updatedGroceryList.id + 1}`)
                    .send(updatedGroceryList)

                expect(response.status).toBe(403)
                expect(response.body).toEqual({
                    msg: 'You are not authorized to update this grocery list',
                })
            })

            it('should return an error if the request body is invalid', async () => {
                const response = await request
                    .put(`/api/grocery-lists/${updatedGroceryList.id}`)
                    .send({
                        ...updatedGroceryList,
                        title: '',
                    })
                expect(response.status).toBe(400)
                expect(response.body).toEqual({
                    msg: 'title is not allowed to be empty',
                })
            })
        })

        // describe('DELETE', () => {
        //     it('should delete a grocery list', async () => {
        //         const response = await request.delete(
        //             `/api/grocery-lists/${updatedGroceryList.id}`
        //         )

        //         expect(response.status).toBe(200)
        //     })

        //     it('should return an error if the grocery list does not exist', async () => {
        //         const response = await request.delete(
        //             `/api/grocery-lists/${updatedGroceryList.id + 1}`
        //         )
        //         expect(response.status).toBe(403)
        //         expect(response.body).toEqual({
        //             msg: 'You are not authorized to delete this grocery list',
        //         })
        //     })
        // })

        // describe('/share', () => {
        //     let sharedGroceryList
        //     let sharedUrl
        //     let sharedUser

        //     const shareBody = {
        //         canEdit: true,
        //         title: 'Test GroceryList',
        //     }

        //     beforeAll(async () => {
        //         const response2 = await request
        //             .post('/api/users/register')
        //             .send({
        //                 name: 'Test User',
        //                 username: 'testuser',
        //                 password: 'password123',
        //             })

        //         sharedUser = response2.body
        //         const response = await request
        //             .post('/api/grocery-lists')
        //             .send(groceryData)
        //         sharedGroceryList = response.body
        //     })

        //     describe('POST', () => {
        //         it('should create and return a shareable grocery list link', async () => {
        //             const response = await request
        //                 .post(
        //                     `/api/grocery-lists/${sharedGroceryList.id}/share`
        //                 )
        //                 .send(shareBody)
        //             expect(response.status).toBe(200)
        //             sharedUrl = response.text
        //         })

        //         it('should return an error if the request body is invalid', async () => {
        //             const response = await request
        //                 .post(
        //                     `/api/grocery-lists/${sharedGroceryList.id}/share`
        //                 )
        //                 .send({ title: 'Test GroceryList' })
        //             expect(response.status).toBe(400)
        //             expect(response.body).toEqual(
        //                 expect.objectContaining({
        //                     msg: 'canEdit is required',
        //                 })
        //             )
        //         })

        //         it('should return an error if the requester does not have access to share the grocery list', async () => {
        //             const response = await request
        //                 .post(
        //                     `/api/grocery-lists/${
        //                         sharedGroceryList.id + 1
        //                     }/share`
        //                 )
        //                 .send(shareBody)
        //             expect(response.status).toBe(403)
        //             expect(response.body).toEqual({
        //                 msg: 'You are not authorized to share this grocery list',
        //             })
        //         })
        //     })
        //     describe('PUT', () => {
        //         let updateShareBody
        //         beforeAll(async () => {
        //             updateShareBody = {
        //                 canEdit: false,
        //                 userId: sharedUser.id,
        //             }
        //         })

        //         it('should update a the sharing permissions of a grocery list', async () => {
        //             const response = await request
        //                 .put(`/api/grocery-lists/${sharedGroceryList.id}/share`)
        //                 .send(updateShareBody)

        //             expect(response.status).toBe(200)
        //             expect(response.text).toEqual('Permissions updated')
        //         })

        //         it('should return and error if the request body is invalid', async () => {
        //             const response = await request
        //                 .put(`/api/grocery-lists/${sharedGroceryList.id}/share`)
        //                 .send({})
        //             expect(response.status).toBe(400)
        //             expect(response.body).toEqual({
        //                 msg: 'userId is required',
        //             })
        //         })

        //         it('should return an error if the requester does not have access to share the grocery list', async () => {
        //             const response = await request
        //                 .put(
        //                     `/api/grocery-lists/${
        //                         sharedGroceryList.id + 1
        //                     }/share`
        //                 )
        //                 .send(updateShareBody)
        //             expect(response.status).toBe(403)
        //             expect(response.body).toEqual({
        //                 msg: 'Unauthorized',
        //             })
        //         })
        //     })
        //     describe('DELETE', () => {
        //         it('should delete the access of designated user from designated grocery list', async () => {
        //             const response = await request
        //                 .delete(
        //                     `/api/grocery-lists/${sharedGroceryList.id}/share`
        //                 )
        //                 .send({
        //                     userId: sharedUser.id,
        //                 })

        //             expect(response.status).toBe(200)
        //             expect(response.text).toEqual('User removed')
        //         })

        //         it('should return and error if the request body is invalid', async () => {
        //             const response = await request
        //                 .delete(
        //                     `/api/grocery-lists/${sharedGroceryList.id}/share`
        //                 )
        //                 .send({})
        //             expect(response.status).toBe(400)
        //             expect(response.body).toEqual({
        //                 msg: 'userId is required',
        //             })
        //         })

        //         it('should return an error if the requester does not have access to share the grocery list', async () => {
        //             const response = await request
        //                 .delete(
        //                     `/api/grocery-lists/${
        //                         sharedGroceryList.id + 1
        //                     }/share`
        //                 )
        //                 .send({
        //                     userId: sharedUser.id,
        //                 })
        //             expect(response.status).toBe(403)
        //             expect(response.body).toEqual({
        //                 msg: 'Unauthorized',
        //             })
        //         })
        //     })

        //     describe('/share/:url', () => {
        //         describe('POST', () => {
        //             it('should add a user to the grocery list', async () => {
        //                 const response = await request.post(
        //                     `/api/grocery-lists/join/${sharedUrl}`
        //                 )

        //                 expect(response.status).toBe(201)
        //                 expect(response.text).toEqual('Successfully joined')
        //             })

        //             it('should return an error if url is not valid JWT', async () => {
        //                 const response = await request.post(
        //                     `/api/grocery-lists/join/${'fakeUrl'}`
        //                 )
        //                 expect(response.status).toBe(400)
        //                 expect(response.body).toEqual({
        //                     msg: 'Link is not valid',
        //                 })
        //             })

        //             it('should return an error if user already has access to the grocery list', async () => {
        //                 const response = await request.post(
        //                     `/api/grocery-lists/join/${sharedUrl}`
        //                 )
        //                 const response2 = await request.post(
        //                     `/api/grocery-lists/join/${sharedUrl}`
        //                 )

        //                 expect(response2.status).toBe(400)
        //                 expect(response2.body).toEqual({
        //                     msg: 'Already joined',
        //                 })
        //             })
        //         })
        //     })
        // })
    })
})
