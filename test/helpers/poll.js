module.exports = poll

function poll (fn, timeout, interval) {
  let endTime = Number(new Date()) + (timeout || 200)
  interval = interval || 10

  let checkCondition = function (resolve, reject) {
    const result = fn()
    if (result) {
      resolve(result)
    } else if (Number(new Date()) < endTime) {
      setTimeout(checkCondition, interval, resolve, reject)
    } else {
      reject(new Error('timed out for ' + fn + ': ' + arguments))
    }
  }

  return new Promise(checkCondition)
}