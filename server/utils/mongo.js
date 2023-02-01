const MDBClient = require('mongodb').MongoClient

const rc = require('../../.serverrc')

// Connection URL
const url = `mongodb://${rc.mongoAddr}:${rc.mongoPort}`

const dbInstanses = {
}
const mongoDBConnect = async () => {
    try {
        const MongoClient = new MDBClient(url, {
            useUnifiedTopology: true,
        })
        return await MongoClient.connect()
    } catch (error) {
        console.error(error)
    }
}
const client = mongoDBConnect()

const getDB = async (dbName) => {
    try {
        const cl = await client
        dbInstanses[dbName] = await cl.db(dbName)
        return dbInstanses[dbName]
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    getDB,
}
