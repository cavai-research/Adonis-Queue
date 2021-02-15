import Queue from './Queue'
;(async function () {
  const queue = new Queue({})
  const res = await queue.run()
  console.log(res)
})()
