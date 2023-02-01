const router = require('express').Router()
const { expressjwt: jwt } = require('express-jwt')
const ObjectId = require('mongodb').ObjectID

const { JWT_SECRET } = require('./constants')
const { requiredFields, responseWrapper } = require('./utils')
const { getAllUsers, getProjectMembers, getProfile } = require('./db')

router.get('/healthcheck', (req, res) => {
    res.send(true)
})

router.get('/getForSelect', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    const userList = await getAllUsers()

    res.send(responseWrapper(undefined, userList))
})

router.post('/getMembers', requiredFields(['projectId']), jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    const { projectId } = req.body

    const membersList = await getProjectMembers({
        projectId,
    })

    res.send(responseWrapper(undefined, membersList))
})

router.post('/profile', requiredFields(['userId']), jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    const { userId } = req.body

    const userProfile = await getProfile(userId)

    res.send(responseWrapper(undefined, userProfile))
})

module.exports = router
