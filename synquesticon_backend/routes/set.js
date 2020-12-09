const express = require('express')
const setRouter = express.Router()
const models = require('../models/model')
const bodyParser = require('body-parser')


let jsonParser = bodyParser.json()


const setModel = models.Set

setRouter.get('/', (req, res) => {
    res.send('API branch set collection')
})

setRouter.get('/getAllSets', async (req, res) => {
    const sets = await setModel.find()
    try{
        res.send(tasks)
    } catch (err) {
        res.status(500).send(err)
    }
})

setRouter.post('/getSet', async (req, res) => { 
    const id = req.body

    await setModel.findById(id, (err, obj) => {
        if(err){
            return res.status(500).send(err)
        }
        
        if(obj){
            return res.status(200).send(obj)
        } else {
            return res.status(404).send("No set found")
        }   
    })
})

setRouter.post('/addSet', jsonParser, async (req, res) => {
    const setObject = new setModel(req.body)

    
    await setObject.save((err, q) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err)
        }
        return res.status(200).send(setObject)
    })     
})

setRouter.delete('/deleteSet/:id', async (req, res) => {
    const set = await setModel.findByIdAndDelete(req.params.id)

    try{
        if (!set) res.status(404).send("No item found")
        res.status(200).send()
    } catch (err) {
        res.status(500).send(err)
    }

})

module.exports = setRouter