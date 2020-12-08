const config = require('./config')
const mongoose = require('mongoose')
const express = require('express')

const taskRouter = require('./routes/task')
const setRouter = require('./routes/set')
const app = express()

app.get('/', (req, res) => {
    res.send('Synquesticon Running')
})

mongoose.connect(config.mongodbURI, 
  {
    useUnifiedTopology: true,
    useNewUrlParser: true
  }
)

mongoose.Promise = global.Promise

const db = mongoose.connection

db.on('error', err => console.log('Database connection error'+err))
db.on('open', () => console.log('connected to the database '+db.name))


port = process.env.PORT || 3001

// Routing for task
app.use('/task', taskRouter)

app.use('/set', setRouter)


app.listen(port, () => {
  console.log('Synquesticon started on: ' + port)
})

