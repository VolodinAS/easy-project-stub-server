const router = require('express').Router()

router.use('/', require('./auth'))

router.use((err, req, res, next) => {
    res.status(400).send({
        success: false, error: err.message || 'Что-то пошло не так',
    })
})

router.use('/projects', require('./projects'))
router.use('/tasks', require('./tasks'))
router.use('/users', require('./users'))

module.exports = router
