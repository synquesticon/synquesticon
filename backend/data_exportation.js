const fs = require('fs')
const os = require("os")

const dataSchema = require("./data_schema")

const ObserverMessages = dataSchema.ObserverMessages
ObserverMessages.createIndexes({ queryString: "text", tags: "text" })

const Synquestitasks = dataSchema.Synquestitasks;
Synquestitasks.createIndexes({ queryString: "text", tags: "text" })

var exports = module.exports = {}
var DATA_DIRECTORY = "exported_data/"
var GAZE_DATA_PREFIX = "gaze_data_"
var RAW_GAZE_DATA_DIRECTORY = "raw_gaze_data/"

function getFormattedTime(dt) {
  var date = new Date(dt)
  var hours = date.getHours()
  var minutes = "0" + date.getMinutes()
  var seconds = "0" + date.getSeconds()
  var milliseconds = date.getMilliseconds()

  return(hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2) + '.' + milliseconds)
}

exports.save_gaze_data = function (participantId, task, gazeData) {
  if (!fs.existsSync(RAW_GAZE_DATA_DIRECTORY)) 
    fs.mkdirSync(RAW_GAZE_DATA_DIRECTORY)

  const gaze_timestamp = gazeData ? gazeData[0].timestamp : ""
  const file_name = RAW_GAZE_DATA_DIRECTORY + gaze_timestamp + GAZE_DATA_PREFIX + participantId
  const logger = fs.createWriteStream(file_name, { flags: 'a' })  // 'a' means appending (old data will be preserved)

  let target = ""
  if (row.target != undefined) {
    target = row.target.name + ','
    row.target.boundingbox.map((p, ind) => {
      target += p[0] + '_' + p[1] + ';'
    })
  } else target = ','

  gazeData.map((row, index) => {
    logger.write(row.timestamp + ',' +
      row.locX + ',' +
      row.locY + ',' +
      row.leftPupilRadius + ',' +
      row.rightPupilRadius + ',' +
      task + ',' +
      participantId + ',' +
      target + os.EOL);
  })
  logger.end()
}

exports.get_gaze_data = function (participantId) {
  var gazeDataFile = RAW_GAZE_DATA_DIRECTORY + GAZE_DATA_PREFIX + participantId;
  if (fs.existsSync(gazeDataFile)) 
    return fs.readFileSync(gazeDataFile)
  return null
}

exports.get_many_gaze_data = function (participantIds) {
  var output = []
  participantIds.map((item, index) => {
    output.push(exports.get_gaze_data(item))
  })
  if (output.length <= 0) return null
  else return output
}

/*
██████   ██████  ██     ██ ███    ██ ██       ██████   █████  ██████   █████  ██████  ██      ███████
██   ██ ██    ██ ██     ██ ████   ██ ██      ██    ██ ██   ██ ██   ██ ██   ██ ██   ██ ██      ██
██   ██ ██    ██ ██  █  ██ ██ ██  ██ ██      ██    ██ ███████ ██   ██ ███████ ██████  ██      █████
██   ██ ██    ██ ██ ███ ██ ██  ██ ██ ██      ██    ██ ██   ██ ██   ██ ██   ██ ██   ██ ██      ██
██████   ██████   ███ ███  ██   ████ ███████  ██████  ██   ██ ██████  ██   ██ ██████  ███████ ███████
*/

function formatDateTime(t) {
  const d = new Date(t)
  const fillZero = num => {
    if (num < 10) return '0' + num
    else return num
  }
  const datestring = d.getFullYear() + '-' + fillZero(d.getMonth() + 1) + '-' + fillZero(d.getDate())
    + '_' + fillZero(d.getHours()) + '-' + fillZero(d.getMinutes());
  return datestring
}

function escapeCSV(term) {
  //If either is in the term the field must be enclosed in double quotes
  if (term.includes(',') || term.includes('"')) {
    //If it contains double quotes the double quotes must be wrapped with more double quotes
    if (term.includes('"')) term = term.replace(/"/g, '""')
    term = '"' + term + '"'
  }
  return term
}

function handleMissingData(dat) {
  if (dat === -1) return "NULL"
  else return dat
}

function handleCorrectlyAnswered(ans) {
  if (ans === "correct") return 1
  else return 0
}

function handleAcceptedMargin(line) {
  if (line.objType === "Numpad Entry") {
    if (line.correctResponses.length > 1) return line.correctResponses[1]
    else return "NULL"
  }
  return "NULL"
}

exports.save_to_csv = async function (p, seperator) {
  let globalVariables = ""
  let file_name = ""

  if (p.linesOfData && p.linesOfData.length > 0) {
    file_name = formatDateTime(p.linesOfData[0].startTimestamp) + '_'
    file_name += p.linesOfData[0].tasksFamilyTree[0] + '_'
  }

  p.globalVariables.sort((a, b) => a.label.localeCompare(b.label))
  p.globalVariables.forEach( globalVar => {
    if (!globalVari.label.toLowerCase().includes("record data")) {
      globalVariables += globalVar.label + '_' + globalVar.value + ":"
      file_name += globalVar.label + '-' + globalVar.value + '_'
    }
  })

  if (file_name.length > 0) file_name = file_name.slice(0, -1)
  if (file_name === "") file_name = "EMPTY"

  await Promise.all(p.linesOfData.map(async (line, index) => {   //get all comments on this line
    let comments = await (ObserverMessages.find({
      participantId: p._id,
      taskId: line.taskId,
      startTaskTime: line.startTimestamp
    },
      async (err, obj) => {
        if (obj.length > 0) line.comments = obj
      })).catch(exp => { console.log("exp 1") })
    let task = await (Synquestitasks.findOne({ _id: line.taskId },
      async (err, obj) => {
        if (obj) line.tags = obj.tags
        else line.tags = []
      })).catch(exp => { console.log("exp 1") })
  })).catch(exp2 => { console.log("exp 2", exp2) })

  let csv_string = ""

  p.linesOfData.map((line, index) => {
    let comments = []
    if (line.comments != undefined) {
      line.comments.map((obs, obsInd) => {
        obs.messages.map((msg, msgInd) => {
          comments.push(obs.name + ": " + msg)
        })
      })
    }

    let commentText = ""
    if (comments.length > 0)
      commentText = comments.join(';')

    let participantResponse = "";
    if (line.responses.length > 0)
      participantResponse = line.responses.join(';')

    csv_string += (escapeCSV(globalVariables) + seperator +    //Save the task data to csv format
      escapeCSV(line.taskContent) + seperator +
      escapeCSV(participantResponse) + seperator +
      handleCorrectlyAnswered(line.correctlyAnswered) + seperator +
      escapeCSV(line.correctResponses.join('_')) + seperator +
      handleAcceptedMargin(line) + seperator +
      handleMissingData(line.timeToFirstAnswer) + seperator +
      handleMissingData(line.timeToCompletion) + seperator +
      escapeCSV(commentText) + seperator +
      escapeCSV(line.tags.join('_')) + seperator +
      escapeCSV(line.objType) + seperator +
      escapeCSV(line.tasksFamilyTree.join('_')) + seperator +
      getFormattedTime(line.startTimestamp) + seperator + //Remove linebreaks and extra whitespace
      getFormattedTime(line.firstResponseTimestamp)).replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ") + seperator +
      p._id + os.EOL

    if (line.clickedPoints) {         //Save clicked points if there are any
      for (let clickedPoint of line.clickedPoints) {
        csv_string += (escapeCSV(globalVariables) + seperator + //global_vars
          escapeCSV(line.taskContent) + seperator + //content
          escapeCSV(clickedPoint.aoi.join("_")) + seperator + //answer
          escapeCSV(clickedPoint.x + "," + clickedPoint.y) + seperator + //answered_correctly
          "NULL" + seperator + //correct_answer
          "NULL" + seperator + //accepted_margin
          handleMissingData(clickedPoint.timeClicked - line.startTimestamp) + seperator + //time_to_first_response (calculate: clickedPoint.timeClicked-line.startTimestamp)
          handleMissingData(line.timeToCompletion) + seperator + //time_to_completion
          escapeCSV(commentText) + seperator + //comments
          escapeCSV(line.tags.join('_')) + seperator + //tags
          "User click" + seperator + //type
          escapeCSV(line.tasksFamilyTree.join('_')) + seperator + //set_names
          getFormattedTime(line.startTimestamp) + seperator + //timestamp_start //Remove linebreaks and extra whitespace
          getFormattedTime(clickedPoint.timeClicked)).replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ") + seperator + //timestamp_first_response
          p._id + os.EOL; //database_id
      }
    }
  })
  return [file_name, csv_string]
}