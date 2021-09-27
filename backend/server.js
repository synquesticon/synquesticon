const mongoose = require("mongoose")
mongoose.set('useFindAndModify', false)
const express = require("express")
const bodyParser = require("body-parser")
const logger = require("morgan")
const fs = require("fs")
const multer = require("multer")
const path = require("path")

const dataSchema = require("./data_schema")
const Tasks = dataSchema.Tasks
Tasks.createIndexes({ queryString: "text", tags: "text" })
const Sets = dataSchema.Sets
Sets.createIndexes({ queryString: "text", tags: "text" })
const Participants = dataSchema.Participants
Participants.createIndexes({ queryString: "text", tags: "text" })
const Experiments = dataSchema.Experiments
Experiments.createIndexes({ queryString: "text", tags: "text" })
const ObserverMessages = dataSchema.ObserverMessages
ObserverMessages.createIndexes({ queryString: "text", tags: "text" })

const data_exportation = require("./data_exportation")

const API_PORT = 3001
const app = express()
const router = express.Router()

const IMAGE_FOLDER = "Images"
const VIDEO_FOLDER = "Videos"

var MongoClient = require('mongodb').MongoClient

var url = "mongodb://syn-cosmosdb:vkltRHsB23AoDkwKuFc9raooAWuVOrwGl2LC4JLKf5EhschngKRbsjkVWw4NT6an4y24hc23doE2zHLUvwFP7g==@syn-cosmosdb.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@syn-cosmosdb@"

MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
  if (err) throw err
  console.log("Database created!")
  db.close()
})

// this is our MongoDB database
const dbRoute = url

// connects our back end code with the database
mongoose.connect(
  dbRoute,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)

let db = mongoose.connection

db.once("open", () => console.log("connected to the database" + url))

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"))

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }))
app.use(bodyParser.json({limit: '50mb'}))
app.use(logger("dev"))
app.use('/uploads', express.static(IMAGE_FOLDER))
app.use(express.static(path.join(__dirname, '../public')))

const storageImage = multer.diskStorage({
  destination: "../public/" + IMAGE_FOLDER,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})

const storageVideo = multer.diskStorage({
  destination: "../public/" + VIDEO_FOLDER,
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})


const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

const uploadImage = multer({
  storage: storageImage,
  limits: {
    fileSize: 1024 * 1024 * 5
  },
  fileFilter: fileFilter
}).single("images")

const uploadVideo = multer({
  storage: storageVideo,
  // limits: {
  //   fileSize: 1024 * 1024 * 5
  // },
  // fileFilter: fileFilter
}).single("videos")

/*
██████   █████  ████████  █████      ███████ ██   ██ ██████   ██████  ██████  ████████  █████  ████████ ██  ██████  ███    ██
██   ██ ██   ██    ██    ██   ██     ██       ██ ██  ██   ██ ██    ██ ██   ██    ██    ██   ██    ██    ██ ██    ██ ████   ██
██   ██ ███████    ██    ███████     █████     ███   ██████  ██    ██ ██████     ██    ███████    ██    ██ ██    ██ ██ ██  ██
██   ██ ██   ██    ██    ██   ██     ██       ██ ██  ██      ██    ██ ██   ██    ██    ██   ██    ██    ██ ██    ██ ██  ██ ██
██████  ██   ██    ██    ██   ██     ███████ ██   ██ ██       ██████  ██   ██    ██    ██   ██    ██    ██  ██████  ██   ████
*/
router.post("/exportToCSV", (req, res) => {
  const { data } = req.body;
  var obj = JSON.parse(data);
  data_exportation.save_to_csv(obj.participant, obj.delimiter).then(output => {
    var gaze_data = data_exportation.get_gaze_data(obj.participant._id);
    return res.json({ success: true, file_name: output[0], csv_string: output[1], gaze_data: gaze_data });
  })
});
/*
████████  █████  ███████ ██   ██ ███████
   ██    ██   ██ ██      ██  ██  ██
   ██    ███████ ███████ █████   ███████
   ██    ██   ██      ██ ██  ██       ██
   ██    ██   ██ ███████ ██   ██ ███████
*/
// this method fetches all available tasks in our database
router.post("/getAllTasks", (req, res) => {
  Tasks.find((err, data) => {
    if (err) {
      return res.json({ success: false, error: err })
    }
    return res.json({ success: true, tasks: data })
  })
})

router.post("/getTaskWithID", (req, res) => {
  const { id } = req.body;

  Tasks.findOne({ _id: id }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err })
    }
    return res.json({ success: true, task: obj })
  })
})

router.post("/getManyTaskWithIDs", (req, res) => {
  const { ids } = req.body;

  Tasks.find({ _id: { $in: ids } }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err })
    }
    return res.json({ success: true, tasks: obj })
  })
})

async function queryAsync(queryString, collection) {
  var result = await collection.find({
    $or: [{ 'question': { "$regex": queryString, "$options": "i" } },
    { 'name': { "$regex": queryString, "$options": "i" } },
    { 'tags': { "$regex": queryString, "$options": "i" } }]
  }, (err, data) => {
    return new Promise(function (resolve, reject) {
      if (err) {
        console.log(err);
        reject(err);
      }
      resolve(data);
    })
  }).catch(e => console.log(e));
  return await result;
}

router.post("/getAllTagValues", async (req, res) => {
  const { queryCollection } = req.body;
  var collection = null;

  if (queryCollection === 'tasks') {
    collection = Tasks
  } else {
    collection = Sets
  }

  collection.distinct('tags', (err, data) => {
    if (err) {
      console.log(err)
      return res.json({ success: false, error: err })
    }
    return res.json({ success: true, tags: data })
  })
})

router.post("/getAllTasksContaining", async (req, res) => {
  const { queryCollection, queryString, queryCombination } = req.body;

  var collection = null
  if (queryCollection === 'Tasks') {
    collection = Tasks
  } else {
    collection = Sets
  }

  //We use OR as default, and change to AND if the queryCombination matches
  var combination = "$in";
  if (queryCombination === "AND") {
    combination = "$all"; //Might be $all
  }

  //Query with a combination of requirements
  if (Array.isArray(queryString)) {
    collection.find({
      'tags': { [combination]: queryString }
    }, (err, data) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, error: err });
      }
      return res.json({ success: true, tasks: data });
    }).collation({ locale: 'en', strength: 2 });
  } else {
    collection.find({
      $or: [{ 'question': { "$regex": queryString, "$options": "i" } },
      { 'name': { "$regex": queryString, "$options": "i" } },
      { 'tags': { "$regex": queryString, "$options": "i" } }]
    }, (err, data) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, error: err });
      }
      return res.json({ success: true, tasks: data });
    });
  }
});

// this method adds new question in our database
router.post("/addTask", (req, res) => {
  const { message } = req.body

  let syntask = new Tasks(JSON.parse(message));

  syntask.save((err, q) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, _id: q._id });
  })
})

//not called?
router.post("/addTwoTasks", (req, res) => {
  const { tasks } = req.body;
  var objs = JSON.parse(tasks);
  let task1 = new Tasks(objs[0]);
  let task2 = new Tasks(objs[1]);
  var ids = [];

  task1.save((err1, q1) => {
    if (err1) {
      return res.json({ success: false, error: err1 });
    }
    ids.push(q1._id);
    task2.save((err2, q2) => {
      if (err2) {
        return res.json({ success: false, error: err2 });
      }
      ids.push(q2._id);
      return res.json({ success: true, _ids: ids });
    });
  });
});

// this method modifies existing question in our database
router.post("/updateTask", (req, res) => {
  const { id, message } = req.body

  Tasks.findOneAndUpdate({ _id: id }, JSON.parse(message), err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this method deletes existing question in our database
router.post("/deleteTask", (req, res) => {
  const { id } = req.body;

  //remove this task from all sets
  Sets.updateMany({}, { $pull: { childIds: { id: id } } }, err => {
  })

  Tasks.findOneAndDelete({ _id: id }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });

});

router.delete("/deleteAllTasks", (req, res) => {
  Tasks.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.delete("/deleteAllLegacyTasks", (req, res) => {
  Tasks.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/*
███████ ███████ ████████
██      ██         ██
███████ █████      ██
     ██ ██         ██
███████ ███████    ██
*/

router.get("/getAllSets", (req, res) => {
  Sets.find((err, data) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, sets: data });
  });
});

router.post("/getTaskSetWithID", (req, res) => {
  const { id } = req.body;
  Sets.findOne({ _id: id }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    return res.json({ success: true, set: obj });
  });
});

router.post("/addTaskSet", (req, res) => {
  const { id, message } = req.body
  let set = new Sets(JSON.parse(message));

  set.save((err, s) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, _id: s._id });
  });
});

// this method modifies existing question in our database
router.post("/updateTaskSet", (req, res) => {
  const { id, message } = req.body
  Sets.findOneAndUpdate({ _id: id }, JSON.parse(message), err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this method deletes existing question in our database
router.post("/deleteTaskSet", (req, res) => {
  const { id } = req.body;
  Sets.findOneAndDelete({ _id: id }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/addChildToTaskSet", (req, res) => {
  const { setId, childObj } = req.body;
  Sets.updateOne({ _id: setId }, { $addToSet: { childIds: childObj } }, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/removeChildFromTaskSetDb", (req, res) => {
  const { setId, childId } = req.body;
  Sets.updateOne({ _id: setId }, { $pull: { childIds: { id: childId } } }, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  })
});

router.delete("/deleteAllSets", (req, res) => {
  Sets.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

//Is this called?
router.post("/getCompleteSetObject", async (req, res) => {
  const { objId } = req.body;
  const id = JSON.parse(objId);

  var recursion = async function (target) {
    if (target.objType === "Tasks") {
      var syntaskFromDb = await Tasks.findOne({ _id: target.id }, async (err, task) => {
        return task;
      });
      //      return taskFromDb;
      return syntaskFromDb;
    }
    else if (target.objType === "Sets") {
      var setData = await Sets.findOne({ _id: target.id }, async (err, obj) => {
        return obj;
      });

      var childs = setData.childIds.map(async item => {
        var data = await recursion(item);
        return data;
      });

      var childrenData = await Promise.all(childs);

      //For some reason the resulting javascript object has a lot of unecessary information so I only extract what we need
      var setCleanedData = setData._doc;
      setCleanedData.data = childrenData;
      return setCleanedData;
    }
  }

  const result = await recursion({ objType: "Sets", id: id })
  return res.json({ success: true, data: result })
})

router.post("/getTasksOrSetsWithIDs", async (req, res) => {
  const { wrapperSetId } = req.body;
  const id = JSON.parse(wrapperSetId);

  await Sets.findOne({ _id: id }, async (err, wrapperSet) => {
    try {
      if (err) {
        return res.json({ success: false, error: err });
      }
      const ids = wrapperSet.childIds;
      var count = 0;

      var recursionForArray = async function (targetArray) {
        const childs = targetArray.map(async item => {
          const dat = await recursion(item);
          return dat;
        });
        const temp = await Promise.all(childs);
        return temp;
      }

      var recursion = async function (target) {
        if (target.objType === "Tasks") {
          var syntaskFromDb = await Tasks.findOne({ _id: target.id }, async (err, task) => {
            count = count + 1;
            return task;
          });

          return syntaskFromDb;
        }
        else if (target.objType === "Sets") {
          var setData = await Sets.findOne({ _id: target.id }, async (err, obj) => {
            return obj;
          });

          var childs = setData.childIds.map(async item => {
            var data = await recursion(item);
            return data;
          });
          // if (setData.displayOnePage) {
          //   count = count - setData.childIds.length + 1;
          // }

          var childrenData = await Promise.all(childs);

          //For some reason the resulting javascript object has a lot of unecessary information so I only extract what we need
          var setCleanedData = setData._doc;
          setCleanedData.data = childrenData;
          return setCleanedData;
        }
      }

      const results = await recursionForArray(ids);
      var returnedResult = JSON.parse(JSON.stringify(wrapperSet));
      returnedResult.data = results;
      return res.json({ success: true, data: returnedResult, count: count, mainTaskSetName: returnedResult.name });
    } catch (e) {
      console.log(e);
      return res.json({ success: false, error: e });
    }
  });
});

router.post("/getImage", (req, res) => {
  const { file } = req.body;
  var filepath = "./public/" + IMAGE_FOLDER + "/" + file;
  fs.readFile(filepath, (err, data) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    //get image file extension name
    let extensionName = file.split('.')[1];

    //convert image file to base64-encoded string
    let base64Image = new Buffer(data, 'binary').toString('base64');

    //combine all strings
    let imgSrcString = `data:image/${extensionName};base64,${base64Image}`;

    // res.contentType('json');
    return res.json({ success: true, data: imgSrcString });
  })
});

/*
██████   █████  ██████  ████████ ██  ██████ ██ ██████   █████  ███    ██ ████████ ███████
██   ██ ██   ██ ██   ██    ██    ██ ██      ██ ██   ██ ██   ██ ████   ██    ██    ██
██████  ███████ ██████     ██    ██ ██      ██ ██████  ███████ ██ ██  ██    ██    ███████
██      ██   ██ ██   ██    ██    ██ ██      ██ ██      ██   ██ ██  ██ ██    ██         ██
██      ██   ██ ██   ██    ██    ██  ██████ ██ ██      ██   ██ ██   ████    ██    ███████
*/


router.get("/getAllParticipants", (req, res) => {
  Participants.find((err, data) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, participants: data });
  })
})

router.post("/getParticipantWithID", (req, res) => {
  const { id } = req.body;
  Participants.findOne({ _id: id }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    return res.json({ success: true, participant: obj });
  });
});

router.post("/getParticipantsWithIDs", (req, res) => {
  const { ids } = req.body;
  count = 0;
  len = ids.length;
  Participants.find({
    '_id': { $in: ids }
  }, function (err, objs) {
    return res.json({ success: true, participants: objs });
  });
});

// this method adds new participant (or log a new run) into our database
router.post("/addParticipant", (req, res) => {
  const { message } = req.body
  let participant = new Participants(JSON.parse(message));

  participant.save((err, p) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, _id: p._id });
  });
});

router.post("/updateParticipant", (req, res) => {
  const { id, message } = req.body
  Participants.findOneAndUpdate({ _id: id }, JSON.parse(message), err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/addNewLineToParticipant", (req, res) => {
  const { participantId, newLineJSON } = req.body

  Participants.updateOne({ _id: participantId },
    { $addToSet: { linesOfData: JSON.parse(newLineJSON) } }).exec((err, participant) => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
});

router.post("/addNewGlobalVariableToParticipant", (req, res) => {
  const { participantId, globalVariableJSON } = req.body;
  var globalVariable = JSON.parse(globalVariableJSON);

  Participants.updateOne({ _id: participantId }, { $addToSet: { globalVariables: globalVariable } }, (err, participant) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/addRawGazeDataToParticipant", (req, res) => {
  const { participantId, rawGazeData } = req.body;

  Participants.updateOne({ _id: participantId }, { $addToSet: { rawGazeData: JSON.parse(rawGazeData) } }, (err, participant) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/deleteParticipant", (req, res) => {
  const { id } = req.body;
  Experiments.updateOne({ childIds: id }, { $pull: { childIds: id } }, err => {

  })
  Participants.findOneAndDelete({ _id: id }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.delete("/deleteAllParticipants", (req, res) => {
  Participants.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/*
███████ ██   ██ ██████  ███████ ██████  ██ ███    ███ ███████ ███    ██ ████████ ███████
██       ██ ██  ██   ██ ██      ██   ██ ██ ████  ████ ██      ████   ██    ██    ██
█████     ███   ██████  █████   ██████  ██ ██ ████ ██ █████   ██ ██  ██    ██    ███████
██       ██ ██  ██      ██      ██   ██ ██ ██  ██  ██ ██      ██  ██ ██    ██         ██
███████ ██   ██ ██      ███████ ██   ██ ██ ██      ██ ███████ ██   ████    ██    ███████
*/

router.get("/getAllExperiments", (req, res) => {
  Experiments.find((err, data) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, experiments: data });
  });
});

router.post("/getExperimentWithID", (req, res) => {
  const { id } = req.body;
  Experiments.findOne({ _id: id }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, experiments: obj });
  });
});

router.post("/addExperiment", (req, res) => {
  const { id, message } = req.body
  let experiment = new Experiments(JSON.parse(message));

  experiment.save((err, s) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, _id: s._id });
  });
});

router.post("/updateExperiment", (req, res) => {
  const { id, message } = req.body
  Experiments.findOneAndUpdate({ _id: id }, JSON.parse(message), err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/addParticipantToExperiment", (req, res) => {
  const { experimentId, participantId } = req.body;
  Experiments.updateOne({ _id: experimentId }, { $addToSet: { participantIds: participantId } }, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

router.post("/removeParticipantFromExperiment", (req, res) => {
  const { experimentId, participantId } = req.body;
  Experiments.updateOne({ _id: experimentId }, { $pull: { participantIds: participantId } }, err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  })
});

router.post("/deleteExperiment", (req, res) => {
  const { id } = req.body;
  Experiments.findOneAndDelete({ _id: id }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.delete("/deleteAllExperiments", (req, res) => {
  Experiments.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/*
 ██████  ██████  ███████ ███████ ██████  ██    ██ ███████ ██████  ███    ███ ███████ ███████ ███████  █████   ██████  ███████ ███████
██    ██ ██   ██ ██      ██      ██   ██ ██    ██ ██      ██   ██ ████  ████ ██      ██      ██      ██   ██ ██       ██      ██
██    ██ ██████  ███████ █████   ██████  ██    ██ █████   ██████  ██ ████ ██ █████   ███████ ███████ ███████ ██   ███ █████   ███████
██    ██ ██   ██      ██ ██      ██   ██  ██  ██  ██      ██   ██ ██  ██  ██ ██           ██      ██ ██   ██ ██    ██ ██           ██
 ██████  ██████  ███████ ███████ ██   ██   ████   ███████ ██   ██ ██      ██ ███████ ███████ ███████ ██   ██  ██████  ███████ ███████
*/

router.get("/getAllObserverMessages", (req, res) => {
  ObserverMessages.find((err, data) => {
    if (err) {
      return res.json({ success: false, error: err });
    }
    return res.json({ success: true, messages: data });
  });
});

router.post("/getAllMessagesFromAnObserver", (req, res) => {
  const { name, role } = req.body;
  ObserverMessages.find({ name: name, role: role }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    return res.json({ success: true, messages: obj });
  });
});

router.post("/getAllMessagesForAParticipant", (req, res) => {
  const { participantId } = req.body;
  ObserverMessages.find({ participantId: participantId }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    return res.json({ success: true, messages: obj });
  });
});

router.post("/getAllMessagesForALineOfData", (req, res) => {
  const { taskId, startTaskTime } = req.body;
  ObserverMessages.find({ taskId: taskId, startTaskTime: startTaskTime }, (err, obj) => {
    if (err) {
      return res.json({ success: false, error: err });
    }

    return res.json({ success: true, messages: obj });
  });
});

router.post("/addNewObserverMessage", async (req, res) => {
  const { observerMessage } = req.body;
  var obj = JSON.parse(observerMessage);
  var existed = await ObserverMessages.findOne({
    name: obj.name,
    role: obj.role,
    participantId: obj.participantId,
    taskId: obj.taskId,
    startTaskTime: obj.startTaskTime
  }, (err, obj) => {
    return obj;
  });
  if (existed) {
    ObserverMessages.updateOne({
      name: obj.name,
      role: obj.role,
      participantId: obj.participantId,
      taskId: obj.taskId,
      startTaskTime: obj.startTaskTime
    }, { $addToSet: { messages: obj.messages[0] } }, err => {
      if (err) {
        return res.json({ success: false, error: err });
      }
      return res.json({ success: true });
    });
  }
  else {
    let newMessage = new ObserverMessages(obj);
    newMessage.save((serr, m) => {
      if (serr) {
        return res.json({ success: false, error: serr });
      }
      return res.json({ success: true });
    })
  }
});

//not called?
router.post("/deleteAMessage", (req, res) => {
  const { info } = req.body;
  ObserverMessages.findOneAndDelete({
    name: obj.name,
    role: obj.role,
    participantId: obj.participantId,
    taskId: obj.taskId,
    startTaskTime: obj.startTaskTime
  }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/deleteAllMessagesForParticipant", (req, res) => {
  const { participantId } = req.body;
  ObserverMessages.deleteMany({ participantId: participantId }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/deleteAllMessagesFromObserver", (req, res) => {
  const { name, role } = req.body;
  ObserverMessages.deleteMany({ name: name, role: role }, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

router.post("/deleteAllMessages", (req, res) => {
  ObserverMessages.deleteMany({}, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});

/*
 ██████   █████  ███████ ███████     ██████   █████  ████████  █████
██       ██   ██    ███  ██          ██   ██ ██   ██    ██    ██   ██
██   ███ ███████   ███   █████       ██   ██ ███████    ██    ███████
██    ██ ██   ██  ███    ██          ██   ██ ██   ██    ██    ██   ██
 ██████  ██   ██ ███████ ███████     ██████  ██   ██    ██    ██   ██
*/

router.post("/saveGazeData", (req, res) => {
  const { participantId, task, gazeData } = req.body

  data_exportation.save_gaze_data(participantId, task, JSON.parse(gazeData));
});

/*
██ ███    ███  █████   ██████  ███████     ██    ██ ██████  ██       ██████   █████  ██████  ██ ███    ██  ██████
██ ████  ████ ██   ██ ██       ██          ██    ██ ██   ██ ██      ██    ██ ██   ██ ██   ██ ██ ████   ██ ██
██ ██ ████ ██ ███████ ██   ███ █████       ██    ██ ██████  ██      ██    ██ ███████ ██   ██ ██ ██ ██  ██ ██   ███
██ ██  ██  ██ ██   ██ ██    ██ ██          ██    ██ ██      ██      ██    ██ ██   ██ ██   ██ ██ ██  ██ ██ ██    ██
██ ██      ██ ██   ██  ██████  ███████      ██████  ██      ███████  ██████  ██   ██ ██████  ██ ██   ████  ██████
*/

router.post("/uploadImage", (req, res) => {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});

router.post("/uploadVideo", (req, res) => {
  uploadVideo(req, res, (err) => {
    if (err) {
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});

router.get("/getAllImages", (req, res) => {
  const fs = require('fs');

  fs.readdir("../public/" + IMAGE_FOLDER, (err, files) => {
    return res.json({ success: true, images: files })
  });
});

router.get("/getAllVideos", (req, res) => {
  const fs = require('fs');

  fs.readdir("../public/" + VIDEO_FOLDER, (err, files) => {
    return res.json({ success: true, videos: files })
  });
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));