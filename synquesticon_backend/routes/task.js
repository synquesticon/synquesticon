const express = require('express')
const taskRouter = express.Router()
const { TaskModel } = require('../models/taskModel')
const bodyParser = require('body-parser')


let jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// const TaskModel = models.Task

taskRouter.get('/', (req, res) => {
    res.send('API branch task collection')
})

taskRouter.get('/getAllTasks', async (req, res) => {
    const tasks = await TaskModel.find()
    try{
        res.status(200).send(tasks)
    } catch (err) {
        res.status(500).send(err)
    }
})

taskRouter.get('/getTask/:id', async (req, res) => { 
    await TaskModel.findById(req.params.id, (err, obj) => {
        if(err){
            return res.status(500).send(err)
        }
        
        if(obj){
            return res.status(200).send(obj)
        } else {
            return res.status(404).send("No task found")
        }        
        
    })
})

taskRouter.post('/addTask', jsonParser, async (req, res) => {
    const taskObject = new TaskModel(req.body)
    console.log(req.body)

    // taskObject.name = req.body.name
    // taskObject.tags = req.body.tags
    // taskObject.screenIds = req.body.screenIds

    // var taskComponents = []

    
    // req.body.taskComponents.forEach(taskComponent => {
    //     var component = undefined
    //     if(taskComponent.taskType === 'Text') {
    //         component = new TextComponent(taskComponent)
    //         component.save()
    //     }
    //     taskComponents = [...taskComponents, component.id]
    // })       
    

    // taskObject.taskComponents = taskComponents
    
    
    await taskObject.save((err, q) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err)
        }
        return res.status(200).send(taskObject)
    })     
})

taskRouter.delete('/deleteTask/:id', async (req, res) => {
    const task = await TaskModel.findByIdAndDelete(req.params.id)

    try{
        if (!task) res.status(404).send("No task found")
        res.status(200).send()
    } catch (err) {
        res.status(500).send(err)
    }

})

module.exports = taskRouter