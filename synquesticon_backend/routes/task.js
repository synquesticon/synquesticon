const express = require('express')
const taskRouter = express.Router()
const models = require('../models/model')
const bodyParser = require('body-parser')


let jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

const taskModel = models.Task
const {
    InstructionComponent,
    ImageComponent,
    ButtonComponent,
    TextComponent,
    NumberComponent
} = require('../models/Task/TaskComponent')
const { forEach } = require('lodash')

taskRouter.get('/', (req, res) => {
    res.send('API branch task collection')
})

taskRouter.get('/getAllTasks', async (req, res) => {
    const tasks = await taskModel.find()
    try{
        res.send(tasks)
    } catch (err) {
        res.status(500).send(err)
    }
})

taskRouter.post('/getTask', async (req, res) => { 
    const id = req.body

    await taskModel.findById(id, (err, obj) => {
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
    
    const taskObject = new taskModel()

    taskObject.name = req.body.name
    taskObject.tags = req.body.tags
    taskObject.screenIds = req.body.screenIds

    var taskComponents = []

    
    req.body.taskComponents.forEach(taskComponent => {
        var component = undefined
        if(taskComponent.taskType === 'Text') {
            component = new TextComponent(taskComponent)
            component.save()
        }
        taskComponents = [...taskComponents, component.id]
    })       
    

    taskObject.taskComponents = taskComponents
    
    
    await taskObject.save((err, q) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err)
        }
        return res.status(200).send(taskObject)
    })     
})

taskRouter.delete('/deleteTask/:id', async (req, res) => {
    const task = await taskModel.findByIdAndDelete(req.params.id)

    try{
        if (!task) res.status(404).send("No task found")
        res.status(200).send()
    } catch (err) {
        res.status(500).send(err)
    }

})

module.exports = taskRouter