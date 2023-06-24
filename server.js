import app from './src/app.js'

const port = process.env.PORT

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})
