const getAnswer = (errors, data, success = true) => {
    if (errors) {
        return {
            success: false,
            errors,
        }
    }

    return {
        success,
        body: data,
    }
}

const getResponse = (errors, data, success = true) => {
    if (errors.length) {
        return {
            success: false,
            errors,
            warnings: [],
        }
    }

    return {
        success,
        body: data,
        errors: [],
        warnings: [],
    }
}

module.exports = {
    getAnswer,
    getResponse,
}
