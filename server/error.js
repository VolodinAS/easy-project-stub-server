const noToken = 'No authorization token was found'

module.exports = (err, req, res, next) => {
    if (err.message === noToken) {
        res.status(400).send({
            success: false, error: 'Токен авторизации не найден',
        })
    }
    res.status(400).send({
        success: false, error: err.message || 'Что-то пошло не так',
    })
}
