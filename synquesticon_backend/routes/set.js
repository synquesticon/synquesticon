const express = require('express')
const setRouter = express.Router()
const SetModel = require('../models/setModel')
const bodyParser = require('body-parser')


let jsonParser = bodyParser.json()

setRouter.get('/', (req, res) => {
    res.send('API branch set collection')
})

setRouter.get('/getAllSets', async (req, res) => {
    const sets = await SetModel.find()
    try{
        res.status(200).send(sets)
    } catch (err) {
        res.status(500).send(err)
    }
})

setRouter.get('/getSet/:id', async (req, res) => {
    await SetModel.findById(req.params.id)
    .populate({
         path: 'children.childId', 
         populate: { path: 'children.childId', model: 'TaskModel' } //populate children which are tasks, stop at the 2nd layer
        })
    .exec(function (err, set) {
        if (err) return res.status(500).send(err)
        if(set){
            return res.status(200).send(set)
        } else {
            return res.status(404).send("No set found")
        }  

    });
})

setRouter.post('/addSet', jsonParser, async (req, res) => {
    const setObject = new SetModel(req.body)

    
    await setObject.save((err, q) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err)
        }
        return res.status(200).send(setObject)
    })     
})

setRouter.put('/updateSet/:id', async(req, res) => {
    if(!req.body){
        return res.status(400).send("Data to update can not be empty.")
    }

    const set = await SetModel.findByIdAndUpdate(req.params.id, req.body, { useFindAndModify: false })

    try{
        if (!set) res.status(404).send("No item found")
        res.status(200).send()
    } catch (err) {
        res.status(500).send(err)
    }
}) 

setRouter.delete('/deleteSet/:id', async (req, res) => {
    const set = await SetModel.findByIdAndDelete(req.params.id)

    try{
        if (!set) res.status(404).send("No item found")
        res.status(200).send()
    } catch (err) {
        res.status(500).send(err)
    }

})

module.exports = setRouter