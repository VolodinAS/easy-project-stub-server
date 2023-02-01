const router = require('express').Router()
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./constants')
const { registrationUser, signInUser } = require('./db')
const { requiredFields, responseWrapper } = require('./utils')

router.get('/healthcheck', (req, res) => {
    res.send(true)
})

router.post('/registration', requiredFields(['email', 'login', 'password']), async (req, res, next) => {
    const { email, login, password, ...rest } = req.body

    try {
        await registrationUser({
            email, login, password, ...rest,
        })

        res.send(responseWrapper(undefined, {
        }))
    } catch (e) {
        next(e)
    }
})

router.post('/sign-in', requiredFields(['email', 'password']), async (req, res, next) => {
    const { email, password } = req.body

    try {
        const user = await signInUser({
            email, password,
        })

        req.session.user = user

        const token = jwt.sign({
            id: user._id,
        }, JWT_SECRET)

        res.send(responseWrapper(undefined, {
            token, user,
        }))
    } catch (e) {
        next(e)
    }
})

module.exports = router
