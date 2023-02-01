const { v4: uuid } = require('uuid')
const ObjectId = require('mongodb').ObjectID

const { getDB } = require('../../utils/mongo')
const { _idToId, checkDB, _idToIdArray, filterId } = require('./utils')

let db = null

const USERS_COLL = 'ep_users'
const PROJECTS_COLL = 'ep_all_projects'
const PROJECT_TASKS_COLL = 'ep_projects_tasks'
const PROJECT_MEMBERS_COLL = 'ep_projects_members'
const PROJECT_STATUSES_COLL = 'ep_projects_statuses'
const PROJECT_TYPES_COLL = 'ep_projects_types'

const connect = async () => {
    db = await getDB('easy-project')
    if (db === null) throw new Error('Нет подключения к базе данных')
}

connect()

const hashPassword = (password, salt = uuid(), salt2 = uuid(), salt3 = uuid()) => ({
    password: (password.split('').join(salt) + salt2 + password.split('').join(salt3)).split('-').reverse().join('-'),
    salt,
    salt2,
    salt3,
})

const registrationUser = async ({ email, login, password, ...rest }) => {
    checkDB(db)
    const usersCollection = db.collection(USERS_COLL)
    const userExist = await usersCollection.find({
        $or: [{
            login,
        }, {
            email,
        }],
    }).toArray()

    if (userExist.length) {
        if (userExist[0].login === login) {
            throw new Error('Логин уже занят')
        }
        if (userExist[0].email === email) {
            throw new Error('Email уже занят')
        }
    }

    const { password: hash, salt, salt2, salt3 } = hashPassword(password)

    const user = {
        salt,
        salt2,
        salt3,
        hash,
        login,
        email,
        ...rest,
    }

    const { insertedId } = await usersCollection.insertOne(user)
    user.id = insertedId
}

const signInUser = async ({ email, password }) => {
    checkDB(db)

    const usersCollection = db.collection(USERS_COLL)

    const [userCandidate] = await usersCollection.find({
        email,
    }).toArray()

    if (!userCandidate) {
        throw new Error('Email или пароль не корректный')
    }
    const { salt, salt2, salt3, hash, ...cleanUser } = userCandidate
    const { password: hashFromDb } = hashPassword(password, salt, salt2, salt3)

    if (hash !== hashFromDb) {
        throw new Error('Email или пароль не корректный')
    }

    return cleanUser
}

const getMyProjects = async (userId) => {
    checkDB(db)

    const userFilterById = filterId(userId)

    const projectCollection = db.collection(PROJECTS_COLL)
    const usersCollection = db.collection(USERS_COLL)

    let projectList = await projectCollection.find({
        $or: [{
            userId,
        }, {
            members: {
                $in: [userId],
            },
        }],
    }).toArray()

    if (projectList) {
        const [userAuthor] = await usersCollection.find(userFilterById).toArray()
        for (let index = 0; index < projectList.length; index++) {
            projectList[index].author = userAuthor
            projectList[index] = _idToId(projectList[index])
        }
        return projectList
    }
    return []
}

const deleteProjectById = async (projectId) => {
    checkDB(db)

    const projectCollection = db.collection(PROJECTS_COLL)
    const projectFilterById = filterId(projectId)
    const deleted = await projectCollection.deleteOne(projectFilterById)
    return deleted
}

const getMyProjectById = async (userId, projectId) => {
    checkDB(db)

    const projectCollection = db.collection(PROJECTS_COLL)
    const usersCollection = db.collection(USERS_COLL)

    const userFilterById = filterId(userId)

    const [userAuthor] = await usersCollection.find(userFilterById).toArray()

    const projectFilter = filterId(projectId)

    let [projectMyExist] = await projectCollection.find(projectFilter).toArray()

    const members = await usersCollection.find({
        _id: {
            $in: projectMyExist.members.map((memberId) => new ObjectId(memberId)),
        },
    }).toArray()

    projectMyExist.members = members.map((m) => ({
        value: m._id, label: m.email,
    }))
    projectMyExist.author = userAuthor

    projectMyExist = _idToId(projectMyExist)

    return projectMyExist
}

const newProject = async ({
    title,
    code,
    userId,
    members,
}) => {
    checkDB(db)

    if (!title || !code) {
        throw new Error('Fields can\'t be empty')
    }

    const projectCollection = db.collection(PROJECTS_COLL)

    const project = {
        title,
        code,
        userId,
        created: Date.now(),
        changed: Date.now(),
        changedBy: userId,
        taskIndex: 0,
        members,
    }

    await projectCollection.insertOne(project)

    return _idToId(project)
}

const updateProject = async ({ projectId, title, code, members }) => {
    checkDB(db)

    if (!title || !code) {
        throw new Error('Fields can\'t be empty')
    }
    const projectCollection = db.collection(PROJECTS_COLL)

    const projectFilterById = filterId(projectId)

    const updatedProject = await projectCollection.updateOne(projectFilterById, {
        $set: {
            title,
            code,
            changed: Date.now(),
            members,
        },
    })

    return updatedProject
}

// TODO: Совмещение projectId с userId ИЛИ поиск по memberIds
const getProjectById = async ({ projectId }) => {
    checkDB(db)

    const projectFilterById = filterId(projectId)

    const projectCollection = db.collection(PROJECTS_COLL)
    const [projectExist] = await projectCollection.find(projectFilterById).toArray()

    return projectExist
}

const getTaskById = async ({ taskId, userId }) => {
    checkDB(db)
    if (taskId) {
        const userFilterById = filterId(userId)
        const taskFilterById = filterId(taskId)

        const taskCollection = db.collection(PROJECT_TASKS_COLL)
        const usersCollection = db.collection(USERS_COLL)
        let [taskExist] = await taskCollection.find(taskFilterById).toArray()

        if (taskExist) {
            const [userAuthor] = await usersCollection.find(userFilterById).toArray()
            taskExist.author = userAuthor
            return _idToId(taskExist)
        }
    }
    return {
    }
}

const createTask = async ({ taskData, authorId, projectId }) => {
    checkDB(db)

    const projectCollection = db.collection(PROJECTS_COLL)
    const projectFilterById = filterId(projectId)

    const [projectExist] = await projectCollection.find(projectFilterById).toArray()

    if (!projectExist) {
        throw new Error('The project not exists [createTask]')
    }

    const nextIndex = projectExist.taskIndex + 1

    const taskCollection = db.collection(PROJECT_TASKS_COLL)

    const { type, status, ...taskRest } = taskData

    const task = {
        ...taskRest,
        type: Number(type),
        status: Number(status),
        changed: Date.now(),
        created: Date.now(),
        taskIndex: nextIndex,
        authorId,
        projectId,
    }

    await projectCollection.updateOne(projectFilterById, {
        $set: {
            taskIndex: nextIndex,
            projectChanged: Date.now(),
        },
    })

    await taskCollection.insertOne(task)

    return _idToId(task)
}

const getTaskListByProjectId = async ({ projectId }) => {
    checkDB(db)

    const projectFilterById = filterId(projectId)

    const projectCollection = db.collection(PROJECTS_COLL)
    const [projectExist] = await projectCollection.find(projectId).toArray()

    if (!projectExist) {
        throw new Error('The project not exists [getTaskListByProjectId]')
    }

    const taskCollection = db.collection(PROJECT_TASKS_COLL)
    let taskListCandidate = await taskCollection.find({
        projectId,
    }).toArray()

    // if (taskListCandidate.length > 0) {
    //     for (let index = 0; index < taskListCandidate.length; index++) {
    //         // const [userAuthor] = await usersCollection.find(userFilterById).toArray()
    //         // taskListCandidate[index].author = userAuthor
    //         projectExist[index] = _idToId(projectExist[index])
    //     }
    // }

    taskListCandidate = _idToIdArray(taskListCandidate)

    return taskListCandidate
}

const editTask = async ({ taskData, projectId, authorId, taskId }) => {
    checkDB(db)

    const taskCollection = db.collection(PROJECT_TASKS_COLL)
    const projectCollection = db.collection(PROJECTS_COLL)

    const taskFilterById = filterId(taskId)
    const projectFilterById = filterId(projectId)

    const { type, status, ...taskRest } = taskData

    const updatedTask = await taskCollection.updateOne(taskFilterById, {
        $set: {
            type: Number(type),
            status: Number(status),
            ...taskRest,
        },
    })

    await projectCollection.updateOne(projectFilterById, {
        $set: {
            projectChanged: Date.now(),
        },
    })

    return updatedTask
}

const deleteTaskById = async (taskId) => {
    checkDB(db)

    const taskCollection = db.collection(PROJECT_TASKS_COLL)
    const taskFilterById = filterId(taskId)
    const deleted = await taskCollection.deleteOne(taskFilterById)
    return deleted
}

const getAllUsers = async () => {
    checkDB(db)

    const usersCollection = db.collection(USERS_COLL)

    let allUsers = await usersCollection.find().toArray()

    return _idToIdArray(allUsers)
}

const getProfile = async (userId) => {
    checkDB(db)

    const usersCollection = db.collection(USERS_COLL)

    const userFilter = filterId(userId)

    const [profile] = await usersCollection.find(userFilter).toArray()

    return _idToId(profile)
    // return true
}

// const getProjectMembers = async (projectId) => {
//     checkDB(db)

//     const memberCollection = db.collection(PROJECT_MEMBERS_COLL)

//     await memberCollection.find({
//         projectId,
//     })
// }

// const updateProjectMembers = async (projectData, members) => {
//     checkDB(db)

//     const memberCollection = db.collection(PROJECT_MEMBERS_COLL)

//     await memberCollection.deleteMany({
//         projectId: projectData.id,
//     })

//     const membersAdd = []

//     for (let memberIndex = 0; memberIndex < members.length; memberIndex++) {
//         const member = {
//             projectId: projectData.id,
//             memberId: members[memberIndex].value,
//         }
//         membersAdd.push(member)
//     }
//     const { insertedData } = await memberCollection.insertMany(membersAdd)

//     return insertedData
// }

module.exports = {
    connect,
    registrationUser,
    signInUser,
    getMyProjects,
    deleteProjectById,
    newProject,
    createTask,
    editTask,
    deleteTaskById,
    getTaskListByProjectId,
    getProjectById,
    getMyProjectById,
    getTaskById,
    updateProject,

    getAllUsers,
    getProfile,
    // getProjectMembers,

    // updateProjectMembers,
}
