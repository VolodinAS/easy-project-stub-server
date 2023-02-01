const ObjectId = require('mongodb').ObjectID

const requiredFields = (fields) => (req, res, next) => {
    for (const fieldName of fields) {
        if (!req.body[fieldName]) {
            throw new Error(`Field ${fieldName} does't set`)
        }
    }

    next()
}

const responseWrapper = (error, data, success = true) => ({
    error, data, success,
})

const _idToId = (data) => {
    const { _id, ...rest } = data

    return {
        id: _id,
        ...rest,
    }
}

const _idToIdArray = (arrayData, setAuthor = false) => {
    let newArray = []
    for (let index = 0; index < arrayData.length; index++) {
        newArray[index] = _idToId(arrayData[index])
    }
    return newArray
}

const checkDB = (db) => {
    if (db === null) throw new Error('no db connection')
}

const filterId = (id) => ({
    _id: new ObjectId(id),
})

module.exports = {
    checkDB,
    requiredFields,
    responseWrapper,
    _idToId,
    _idToIdArray,
    filterId,
}
