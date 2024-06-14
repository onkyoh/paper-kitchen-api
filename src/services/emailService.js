import ses from '../config/ses.js'
import { BASE_URL } from '../util/constants.js'

const sendPasswordLink = (link, email) => {
    const url = BASE_URL + '/auth/reset-password/' + link
    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<p>The following is a link to reset your password on PaperKitchen. If you did not ask for this please ignore. <a href="${url}">${url}</a></p>`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'PaperKitchen Password Reset',
            },
        },
        Source: 'noreply.paperkitchen@gmail.com',
    }

    return ses.sendEmail(params)
}

const sendAuthentication = (link, email, username) => {
    const url = BASE_URL + '/auth/authenticate-email/' + link
    const params = {
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `<p>The following is a link to authenticate <strong>${username}'s</strong> email on PaperKitchen. If you did not ask for this please ignore. <a href="${url}">${url}</a></p>`,
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'PaperKitchen Email Authentication',
            },
        },
        Source: 'noreply.paperkitchen@gmail.com',
    }

    return ses.sendEmail(params)
}

export { sendPasswordLink, sendAuthentication }
