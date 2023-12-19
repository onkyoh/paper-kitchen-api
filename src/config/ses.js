import { SES } from '@aws-sdk/client-ses'

// Create SES object
const ses = new SES({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
})

export default ses
