import React, { useState, useEffect, useRef } from 'react'
import Button from '@material-ui/core/Button'
import { FilterList, AddCircleOutline } from '@material-ui/icons'
import FilterDialog from './FilterDialog'
import SearchBar from './SearchBar'
import CollapsableContainer from './Containers/CollapsableContainer'
import TaskList from './List'
import EditTask from './Task'
import EditSet from './Set'
import eventStore from '../core/eventStore'
import { withTheme } from '@material-ui/styles'
import { DragDropContext } from 'react-beautiful-dnd'
import db_helper from '../core/db_helper.js'
import * as db_objects from '../core/db_objects.js'
import store from '../core/store'
import './css/Edit.css'

const Edit = props => {
  const initFilterMap = () => {
    let initFilter = new Map()
    Object.values(db_objects.ObjectTypes).forEach(objectType => {
      initFilter.set(objectType, {
        tagFilters: [],
        searchStrings: [],
        queryCombination: "OR"
      })
    })
    return initFilter
  }

  const [showMenu, setShowMenu] = useState(false)
  const [taskList, setTaskList] = useState([])
  const [setList, setSetList] = useState([])
  const [selectedSet, setSelectedSet] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [allowRegex, setAllowRegex] = useState(true)
  const [assetEditorObject, setAssetEditorObject] = useState(null)
  const [openFilterDialog, setOpenFilterDialog] = useState(false)         //Filter dialog states
  const [filterQueryType, setFilterQueryType] = useState(db_objects.ObjectTypes.TASK)
  const [filterStateMap, setFilterStateMap] = useState(initFilterMap())

  let assetEditorCompKey = useRef(0)       //Asset Editor Component Key. Used to force reconstruction...
  let filterDialogKey = 0
  let filterMap = null

  useEffect(() => {
    assetViewerQueryDatabase()
    if (store.getState().shouldEdit) {
      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: false,
        objectToEdit: null,
        typeToEdit: ''
      })
      //selectSet(store.getState().objectToEdit)
    }
  }, [])


  const groupTasksByTags = tasks => {
    let tagMap = new Map()
    tasks.forEach(task => {   //If the task contains tags we iterate over and add them with value to our map
      if (task.tags.length > 0) {
        task.tags.forEach(tag => {
          if (tagMap.has(tag)) {
            let newValue = tagMap.get(tag)
            newValue.push(task)
            tagMap.set(tag, newValue)
          } else {
            let objectList = []
            objectList.push(task)
            tagMap.set(tag, objectList)
          }
        })
      } else {    //Otherwise we add the task to the No Tag section
        let key = "No Tag"
        if (tagMap.has(key)) {
          let newValue = tagMap.get(key)
          newValue.push(task)
          tagMap.set(key, newValue)
        } else {
          let objectList = []
          objectList.push(task)
          tagMap.set(key, objectList)
        }
      }
    })
    return tagMap
  }

  const dbTaskCallback = dbQueryResult => {
    setTaskList(dbQueryResult)
  }

  const dbSetCallback = dbQueryResult => {
    setSetList(dbQueryResult)
  }

  //Callback after querying the database using the search fields
  const onDatabaseSearched = (queryType, result) => {
    if (queryType === db_objects.ObjectTypes.SET)
      setSetList(result.tasks)
    else if (queryType === db_objects.ObjectTypes.TASK)
      setTaskList(result.tasks)
  }

  const assetViewerQueryDatabase = () => {
    db_helper.getAllTasksFromDb(dbTaskCallback)
    db_helper.getAllSetsFromDb(dbSetCallback)
  }


  const selectTask = task => {
    assetEditorCompKey.current += 1

    const assetObject =
      <EditTask
        isEditing={true}
        taskObj={task}
        closeTaskCallback={assetEditorObjectClosed}
        key={assetEditorCompKey.current}
      />
    setSelectedSet(null)
    setSelectedTask(task)
    setAssetEditorObject(assetObject)
  }

  const selectSet = set => {
    assetEditorCompKey.current += 1
    const assetObject =
      <EditSet
        isEditing={true}
        setObject={set}
        closeSetCallback={assetEditorObjectClosed}
        key={assetEditorCompKey.current}
        runTestSet={() => { props.history.push('/DisplayTaskComponent') }}
      />
    setSelectedTask(null)
    setSelectedSet(set)
    setAssetEditorObject(assetObject)
  }

  //Callback from the asset editor object if an object has been changed that requires a refresh of the page
  const assetEditorObjectClosed = (dbChanged, shouldCloseAsset) => {
    if (shouldCloseAsset) clearAssetEditorObject()

    if (dbChanged) {
      db_helper.getAllTasksFromDb(dbTaskCallback)
      db_helper.getAllSetsFromDb(dbSetCallback)
    }

    let storeState = store.getState()
    if (storeState.shouldEdit) {
      if (storeState.typeToEdit === db_objects.ObjectTypes.SET)
        selectSet(storeState.objectToEdit)
      else if (storeState.typeToEdit === db_objects.ObjectTypes.TASK)
        selectTask(storeState.objectToEdit)

      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: false,
        typeToEdit: ''
      })
    }
  }

  //Closes the current objecy being viewed in the asset editor view
  const clearAssetEditorObject = () => {
    setAssetEditorObject(null)
    setSelectedSet(null)
    setSelectedTask(null)
  }

  const removeTaskSet = taskSet => {
    db_helper.deleteTaskSetFromDb(taskSet._id)
  }

  const escapeRegExp = text => {        //Adds escape characters in fornt of all common regex symbols
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  }

  const addSynquestitaskCallback = () => {
    assetEditorCompKey.current += 1
    clearAssetEditorObject()
    setAssetEditorObject(
      <EditTask
        isEditing={false}
        closeTaskCallback={assetEditorObjectClosed}
        key={assetEditorCompKey.current}
      />
    )
  }

  const addSetCallback = () => {
    assetEditorCompKey += 1
    clearAssetEditorObject()

    setAssetEditorObject(
      <EditSet
        isEditing={false}
        closeSetCallback={assetEditorObjectClosed}
        key={assetEditorCompKey}
      />
    )
  }

  const onDragEnd = result => {
    const { source, destination } = result
    if (!destination) return   // dropped outside the list

    //If the source is the same as the destination we just move the element inside the list
    if (source.droppableId === destination.droppableId) {
      //editSetComponentRef.current.moveTask(source.index, destination.index)
    } else { //Otherwise we add to the list at the desired location
      let itemType
      if (source.droppableId === "Sets")
        itemType = db_objects.ObjectTypes.SET
      else if (source.droppableId === "Tasks")
        itemType = db_objects.ObjectTypes.TASK
      else return

      let id = result.draggableId
      if (id.includes('_'))
        id = result.draggableId.split('_')[0]
        eventStore.sendTaskData([{ objType: itemType, _id: id }, destination.index])
    }
  }

  const getAssetEditorObject = () => {
    return (
      <div className="AssetEditor" style={{ paddingLeft: 5, backgroundColor: (props.theme.palette.type === "light" ? props.theme.palette.primary.main : props.theme.palette.primary.dark) }}>
        <div className="AssetEditorContent">
          {assetEditorObject}
        </div>
      </div>
    )
  }

  const filterButtonPressed = (type, e) => {       //Filter button callback, the type determines which collection we are filtering
    filterDialogKey += 1
   // setOpenFilterDialog(true)
   // setFilterQueryType(type)
  }

  const filtersUpdated = (type, filters, searchType) => {      //Callback when filters have been selected in the filters dialog
    let updatedMap = new Map(filterStateMap)
    let updatedObject = updatedMap.get(type)
    updatedObject.tagFilters = filters
    updatedObject.queryCombination = searchType
    updatedMap.set(type, updatedObject)
    setOpenFilterDialog(false)
    setFilterStateMap(updatedMap)
    filterMap = updatedMap
    querySearchTasksFromDB(type)
  }

  const onCloseFilterDialog = () => {
    setOpenFilterDialog(false)
  }

  const onSearchInputChanged = (type, e) => {
    let searchString = ""
    if (typeof (e) === 'object') {
      searchString = e.target.value
      if (!allowRegex) searchString = escapeRegExp(searchString)
      if (searchString.includes(",")) {
        searchString = searchString.split(",")
        searchString = searchString.map(value => {
          return value.trim()
        })
        searchString = searchString.filter(Boolean) //Remove empty values
      } else searchString = [searchString]
    }

    let updatedMap = new Map(filterStateMap)
    let updatedObject = updatedMap.get(type)
    updatedObject.searchStrings = searchString
    updatedMap.set(type, updatedObject)
//    setFilterStateMap(updatedMap)
    filterMap = updatedMap
    //querySearchTasksFromDB(type)
  }

  const querySearchTasksFromDB = type => {
    let filterObject = filterMap.get(type)
    let combinedSearch = filterObject.tagFilters.concat(filterObject.searchStrings)
    combinedSearch = combinedSearch.filter(Boolean) //Remove empty values
    if (combinedSearch.length === 1 && filterObject.searchStrings.length === 1)
      combinedSearch = combinedSearch[0]
    if (combinedSearch.length === 0)
      combinedSearch = ""
    db_helper.queryTasksFromDb(type, combinedSearch, filterObject.queryCombination, onDatabaseSearched)
  }

  const getCollapsableHeaderButtons = (activeFilters, searchCallback, addCallback, filterCallback, searchBarID) => {
    return (
      <div className="collapsableHeaderBtnsContainer">
        <div className="searchWrapperDiv"><SearchBar onChange={searchCallback} searchID={searchBarID} /></div>
        <div className="collapsableBtns">
          {(filterCallback !== null) ?
            <Button style={{ position: "relative", width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}
              className="collapsableHeaderBtns" size="small" onClick={filterCallback} >
              <FilterList color={activeFilters ? "secondary" : "inherit"} fontSize="large" />
            </Button> : null
          }
          <Button style={{ position: "relative", width: '100%', height: '100%', minWidth: 0, minHeight: 0 }} size="small" onClick={addCallback} >
            <AddCircleOutline fontSize="large" />
          </Button>
        </div>
      </div>
    )
  }

  const getTaskTypeContainer = (taskType, taskMap) => {
    const dragEnabled = (assetEditorObject && assetEditorObject.type === EditSet) ? true : false

    let containerContent = []
    let selectedTask = null
    let selectCallback = null
    let addCallback = null
    let activeFilters = filterStateMap.get(taskType).tagFilters.length > 0 ? true : false

    if (taskType === db_objects.ObjectTypes.TASK) {
      selectedTask = selectedTask
      selectCallback = selectTask
      addCallback = addSynquestitaskCallback
    } else if (taskType === db_objects.ObjectTypes.SET) {
      selectedTask = selectedSet
      selectCallback = selectSet
      addCallback = addSetCallback
    } else return null

    let collapsableHeaderButtons = getCollapsableHeaderButtons(
      activeFilters,
      onSearchInputChanged(taskType),
      addCallback,
      filterButtonPressed(taskType),
      taskType + "SearchBar"
    )

    //No nested lists
    containerContent =
      < TaskList
        dragEnabled={dragEnabled}
        taskList={taskMap}
        selectTask={selectCallback}
        selectedTask={selectedTask}
        itemType={taskType}
        droppableId={taskType}
        idSuffix={""}
      />

    return (
      <CollapsableContainer
        headerTitle={taskType}
        useMediaQuery={true}
        headerComponents={collapsableHeaderButtons}
        hideHeaderComponents={true}
        open={true}>
        {containerContent}
      </CollapsableContainer>
    )
  }

  /*
██████  ███████ ███    ██ ██████  ███████ ██████
██   ██ ██      ████   ██ ██   ██ ██      ██   ██
██████  █████   ██ ██  ██ ██   ██ █████   ██████
██   ██ ██      ██  ██ ██ ██   ██ ██      ██   ██
██   ██ ███████ ██   ████ ██████  ███████ ██   ██
*/

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="editorScreenContainer">
        <div style={{ backgroundColor: (props.theme.palette.type === "light" ? props.theme.palette.primary.dark : props.theme.palette.primary.main) }} className="AssetViewer">
          <div className="AssetViewerContent">
            {getTaskTypeContainer(db_objects.ObjectTypes.TASK, taskList)}
            {getTaskTypeContainer(db_objects.ObjectTypes.SET, setList)}
          </div>
        </div>

        {getAssetEditorObject()}

        <FilterDialog openDialog={openFilterDialog} key={"filterDialog" + filterDialogKey}
          closeDialog={onCloseFilterDialog}
          filterType={filterQueryType}
          filterObject={filterStateMap.get(filterQueryType)}
          onFiltersUpdated={filtersUpdated} />
        < /div>
    </DragDropContext>
    )
}

export default withTheme(Edit)
