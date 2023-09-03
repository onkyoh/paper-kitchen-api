import { AWS } from 'aws-sdk'

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: 'us-west-2',
})
