const router = require('express').Router()
const { expressjwt: jwt } = require('express-jwt')
const ObjectId = require('mongodb').ObjectID

const { JWT_SECRET } = require('./constants')
const { requiredFields, responseWrapper } = require('./utils')
const { createTask, getTaskListByProjectId, getProjectById, editTask, getTaskById, deleteTaskById } = require('./db')

router.get('/healthcheck', (req, res) => {
    res.send(true)
})

router.get('/:projectId', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    const { projectId } = req.params

    const taskList = await getTaskListByProjectId({
        projectId,
    })

    res.send(responseWrapper(undefined, taskList))
})

router.get('/:projectId/:taskId', jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    const { projectId, taskId } = req.params

    if (projectId && taskId !== undefined && taskId !== 'undefined') {
        const userId = req.auth.id

        const taskDetail = await getTaskById({
            taskId, userId,
        })

        res.send(responseWrapper(undefined, taskDetail))
    } else {
        res.send(responseWrapper(undefined, []))
    }
})

router.post('/create', requiredFields(['projectId', 'title', 'type', 'status']), jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const authorId = req.auth.id

        const { projectId, ...taskData } = req.body

        const taskCandidate = await createTask({
            taskData, projectId, authorId,
        })

        res.send(responseWrapper(undefined, taskCandidate))
    } catch (e) {
        next(e)
    }
})

router.post('/edit', requiredFields(['projectId', 'taskId', 'title', 'type', 'status']), jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const authorId = req.auth.id

        const { projectId, taskId, ...taskData } = req.body

        const projectCandidate = await getProjectById({
            projectId,
        })

        if (!projectCandidate) {
            throw new Error('The project not exists [task.edit.projectCandidate]')
        }

        const taskCandidate = await getTaskById({
            taskId,
        })

        if (!taskCandidate) {
            throw new Error('The project not exists [task.edit.taskCandidate]')
        }

        await editTask({
            taskData, projectId, authorId, taskId,
        })

        const updatedTask = await getTaskById({
            taskId,
        })

        const taskSummary = {
            oldData: taskCandidate,
            newData: updatedTask,
        }

        res.send(responseWrapper(undefined, taskSummary))
    } catch (e) {
        next(e)
    }
})

router.post('/delete', requiredFields(['projectId', 'taskId']), jwt({
    secret: JWT_SECRET, algorithms: ['HS256'],
}), async (req, res, next) => {
    try {
        const authorId = req.auth.id

        const { projectId, taskId } = req.body

        const projectCandidate = await getProjectById({
            projectId,
        })

        if (!projectCandidate) {
            throw new Error('The project not exists [task.edit.projectCandidate]')
        }

        const taskCandidate = await getTaskById({
            taskId,
        })

        if (!taskCandidate) {
            throw new Error('The project not exists [task.edit.taskCandidate]')
        }

        const answered = await deleteTaskById(taskId)
        if (answered.result.ok) {
            res.send(responseWrapper(undefined))
        }
    } catch (e) {
        next(e)
    }
})

module.exports = router
