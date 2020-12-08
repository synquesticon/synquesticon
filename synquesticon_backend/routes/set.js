const express = require('express')
const setRouter = express.Router()
const models = require('../models/model')

const setModel = models.Set


setRouter.get('/getAllSets')

setRouter.post('/getSet')

setRouter.post('/addSet')

module.exports = setRouter