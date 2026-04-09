const WebLog = require("../models/logModel")

function getBrowser(userAgent){

if(userAgent.includes("Edg")) return "Edge"
if(userAgent.includes("Chrome")) return "Chrome"
if(userAgent.includes("Firefox")) return "Firefox"
if(userAgent.includes("Safari")) return "Safari"

return "Unknown"

}

module.exports = async (req,res,next)=>{

try{

const ip =
req.headers["x-forwarded-for"] ||
req.socket.remoteAddress ||
null

const userAgent = req.headers["user-agent"]

const browser = getBrowser(userAgent)

const cleanIp = ip === "::1" ? "Localhost" : ip

const deviceId = `${cleanIp} - ${browser}`

const today = new Date()
today.setHours(0,0,0,0)

const totalToday = await WebLog.countDocuments({
createdAt:{ $gte: today }
})

if(totalToday >= 30){
return next()
}

const existing = await WebLog.findOne({
deviceId,
createdAt:{ $gte: today }
})

if(existing){

existing.createdAt = new Date()
await existing.save()

}else{

await WebLog.create({

name:req.session?.user?.name || "Guest",

role:
req.session?.admin ? "admin" :
req.session?.user?.role || "guest",

deviceId,
ip

})

}

}catch(err){
console.log(err)
}

next()

}