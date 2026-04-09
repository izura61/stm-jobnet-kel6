const cron = require("node-cron")
const Log = require("../models/logModel")

cron.schedule("0 0 * * *", async () => {

const batas = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

await Log.deleteMany({
createdAt: { $lt: batas }
})

console.log("Old logs deleted")

})