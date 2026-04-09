const Log = require("../models/logModel"); 
exports.createLog = async (req, data) => {
    try {
        let existingLog = null;
        if (data.role !== "guest" && data.role !== "tamu") {

            existingLog = await Log.findOne({ name: data.name });

            if (!existingLog) {
                existingLog = await Log.findOne({
                    deviceId: data.deviceId,
                    role: { $in: ["guest", "tamu"] }
                });
            }
        } 

        else {
            existingLog = await Log.findOne({
                deviceId: data.deviceId,
                role: { $in: ["guest", "tamu"] }
            });
        }

        if (existingLog) {
            existingLog.name = data.name;
            existingLog.role = data.role;
            existingLog.deviceId = data.deviceId;
            existingLog.action = data.action;
            existingLog.ip = data.ip;
            existingLog.userAgent = data.userAgent;
            existingLog.createdAt = new Date();
            
            await existingLog.save();
        } else {
            await Log.create({
                name: data.name,
                role: data.role,
                deviceId: data.deviceId,
                action: data.action,
                ip: data.ip,
                userAgent: data.userAgent,
                createdAt: new Date()
            });
        }
    } catch (err) {
        console.error(err);
    }
};

exports.getLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ createdAt: -1 });
        res.render("dashboard/admin/web-monitoring", {
            title: "Web Monitoring",
            logs: logs || [],
            currentPage: "web-monitoring"
        });
    } catch (err) {
        res.status(500).send("Server Error");
    }
};