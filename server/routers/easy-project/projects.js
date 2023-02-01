const router = require('express').Router()
const { expressjwt: jwt } = require('express-jwt')

const { JWT_SECRET } = require('./constants')
const {
    getMyProjects,
    newProject,
    getProjectById,
    updateProject,
    getMyProjectById,
    deleteProjectById,
    updateProjectMembers,
} = require('./db')
const { requiredFields, responseWrapper, _idToId } = require('./utils')

router.get('/healthcheck', (req, res) => {
    res.send(true)
})

router.get('/', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const projectList = await getMyProjects(req.auth.id)

        res.send(responseWrapper(undefined, projectList))
    } catch (e) {
        next(e)
    }
})

router.get('/:projectId', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const { projectId } = req.params
        const myProject = await getMyProjectById(req.auth.id, projectId)

        res.send(responseWrapper(undefined, myProject))
    } catch (e) {
        next(e)
    }
})

router.post('/new', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const userId = req.auth.id
        const { title, code, members } = req.body

        const project = await newProject({
            title, code, userId, members,
        })

        res.send(responseWrapper(undefined, project))
    } catch (e) {
        next(e)
    }
})

router.post('/delete', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const userId = req.auth.id
        const { projectId } = req.body

        const myProject = await getMyProjectById(userId, projectId)

        if (myProject) {
            const answered = await deleteProjectById(projectId)
            if (answered.result.ok) {
                res.send(responseWrapper(undefined))
            }
        }
    } catch (e) {
        next(e)
    }
})

router.post('/edit', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const userId = req.auth.id
        const { projectId, title, code, members } = req.body

        const projectCandidate = await getProjectById({
            projectId,
        })

        if (!projectCandidate) {
            throw new Error('The project not exists [project.edit]')
        }

        await updateProject({
            projectId, title, code, members,
        })

        const updatedProject = await getProjectById({
            projectId,
        })

        const projectSummary = {
            oldData: projectCandidate,
            newData: updatedProject,
        }

        res.send(responseWrapper(undefined, projectSummary))
    } catch (e) {
        next(e)
    }
})

module.exports = router
