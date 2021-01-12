const express = require('express')
const answeredTaskComponentRouter = express.Router()
const AnsweredTaskComponentModel = require('../models/answeredTaskComponentModel')
const bodyParser = require('body-parser')


let jsonParser = bodyParser.json()

answeredTaskComponentRouter.get('/', (req, res) => {
    res.send('API branch answered component collection')
})

answeredTaskComponentRouter.get('/getBySessionId/:id', async (req, res) => {
    await AnsweredTaskComponentModel.find({'sessionId': req.params.id})
    .populate({
         path: 'taskId',
         model: 'TaskModel'
        })
    .populate({
        path: 'componentId',
        model: 'TaskComponentModel'
    })
    .exec(function (err, set) {
        if (err) return res.status(500).send(err)
        if(set){
            return res.status(200).send(set)
        } else {
            return res.status(404).send("No answers associating with this Id found")
        }  

    });
})

answeredTaskComponentRouter.post('/addAnsweredComponent', jsonParser, async (req, res) => {
    const answeredComponentObject = new AnsweredTaskComponentModel(req.body)

    
    await answeredComponentObject.save((err, q) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err)
        }
        return res.status(200).send(answeredComponentObject)
    })     
})

// answeredTaskComponentRouter.delete('/deleteSet/:id', async (req, res) => {
//     const set = await AnsweredTaskComponentModel.findByIdAndDelete(req.params.id)

//     try{
//         if (!set) res.status(404).send("No item found")
//         res.status(200).send()
//     } catch (err) {
//         res.status(500).send(err)
//     }

// })

module.exports = answeredTaskComponentRouter