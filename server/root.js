const router = require('express').Router()
const fs = require('fs')
const path = require('path')

const folderPath = path.resolve(__dirname, './routers')
const folders = fs.readdirSync(folderPath)

router.get('/', (req, res) => {
    res.send(`
        <h1>multy stub is working</h1>
        <ul>
            ${folders.map((f) => `<li>${f}</li>`).join('')}
        </ul>
    `)
})

module.exports = router
