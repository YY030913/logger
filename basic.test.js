const logger = require('./')

function commonScript(level, data) {
    logger()[level](data)
    logger('./log')[level](data)
}

// looger string
commonScript('fatal', 'this is fatal')
commonScript('error', 'this is error')
commonScript('warn', 'this is warn')
commonScript('info', 'this is info')
commonScript('debug', 'this is debug')
commonScript('trace', 'this is trace')


// looger array
commonScript('info', ["1,", "2"])


// looger object
commonScript('info', {a: 1, b: 2, c: {m: 1, n: {h: 1}}})


// looger Error
commonScript('info', new Error('this is error'))