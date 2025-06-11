const express = require('express')
const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://izhant:jagrat987@cluster9.4t6cq.mongodb.net/Attendance-System')

const schema1 = new mongoose.Schema({
    username : String,
    rollNo : String ,
    presentDays : [String]
})

const stdAttendance = mongoose.model('stdAttendance' , schema1);

module.exports = stdAttendance