import React, { Component } from 'react'
import Button from '@material-ui/core/Button'
import { FilterList, AddCircleOutline } from '@material-ui/icons'
import FilterDialog from './FilterDialog'
import SearchBar from './SearchBar'
import CollapsableContainer from './Containers/CollapsableContainer'
import TaskList from './List'
import EditTask from './Task'
import EditSet from './Set'
import { withTheme } from '@material-ui/styles'
import { DragDropContext } from 'react-beautiful-dnd'
import db_helper from '../core/db_helper.js'
import * as db_objects from '../core/db_objects.js'
import store from '../core/store'
import './css/Edit.css'

class Edit extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showMenu: false,
      taskSetList: [],
      synquestitaskList: [],
      allowRegex: true,
      assetEditorContext: "empty",
      assetEditorObject: null,
      openFilterDialog: false,         //Filter dialog states
      filterQueryType: db_objects.ObjectTypes.TASK,
      filterStateMap: this.initFilterMap()
    }

    this.dbSynquestitaskCallback = this.dbSynquestitaskCallbackFunction.bind(this)  //Database callbacks
    this.dbTaskSetCallback = this.dbTaskSetCallbackFunction.bind(this)
    this.onFiltersChanged = this.filtersUpdated.bind(this)        //Filter callback
    this.dbQueryCallback = this.onDatabaseSearched.bind(this)       //Callback when querying the databaseusing the search fields
    this.gotoPage = this.gotoPageHandler.bind(this)
    this.assetEditorCompKey = 0       //Asset Editor Component Key. Used to force reconstruction...
    this.filterDialogKey = 0
    this.assetViewerQueryDatabase()
  }

  gotoPageHandler(e, route) {
    this.props.history.push(route)
  }

  initFilterMap() {
    let filterMap = new Map()
    Object.values(db_objects.ObjectTypes).forEach(objectType => {
      filterMap.set(objectType, {
        tagFilters: [],
        searchStrings: [],
        queryCombination: "OR"
      })
    })
    return filterMap
  }

  //---------------------------component functions------------------------------
  componentWillMount() {
    if (store.getState().shouldEdit) {
      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: false,
        objectToEdit: null,
        typeToEdit: ''
      })
      this.selectTaskSet(store.getState().objectToEdit)
    }
  }

  groupTasksByTags(tasks) {
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

  dbSynquestitaskCallbackFunction(dbQueryResult) {
    this.setState({ synquestitaskList: dbQueryResult })
  }

  dbTaskCallbackFunction(dbQueryResult) {
    this.setState({ taskList: dbQueryResult })
  }

  dbTaskSetCallbackFunction(dbQueryResult) {
    this.setState({ taskSetList: dbQueryResult })
  }

  //Callback after querying the database using the search fields
  onDatabaseSearched(queryType, result) {
    if (queryType === db_objects.ObjectTypes.SET)
      this.setState({ taskSetList: result.tasks })
    else if (queryType === db_objects.ObjectTypes.TASK)
      this.setState({ synquestitaskList: result.tasks })
  }

  assetViewerQueryDatabase() {
    db_helper.getAllTasksFromDb(this.dbSynquestitaskCallback)
    db_helper.getAllTaskSetsFromDb(this.dbTaskSetCallback)
  }

  selectSynquestitask(task) {
    this.assetEditorCompKey += 1

    const assetObject = <EditTask isEditing={true} synquestitask={task}
      closeTaskCallback={this.assetEditorObjectClosed.bind(this)}
      key={this.assetEditorCompKey}
    />

    this.setState(state => ({ selectedTaskSet: null, selectedTask: null, selectedSynquestitask: task, assetEditorObject: assetObject }))
  }

  selectTaskSet(taskSet) {
    this.assetEditorCompKey += 1
    this.editSetComponentRef = React.createRef()

    const assetObject = <EditSet isEditing={true}
      setObject={taskSet} closeSetCallback={this.assetEditorObjectClosed.bind(this)}
      key={this.assetEditorCompKey} ref={this.editSetComponentRef}
      runTestSet={() => { this.props.history.push('/DisplayTaskComponent') }} />

    this.setState({ selectedTask: null, selectedSynquestitask: null, selectedTaskSet: taskSet, assetEditorObject: assetObject })
  }

  //Callback from the asset editor object if an object has been changed that requires a refresh of the page
  assetEditorObjectClosed(dbChanged, shouldCloseAsset) {
    if (shouldCloseAsset) this.clearAssetEditorObject()

    if (dbChanged) {
      db_helper.getAllTasksFromDb(this.dbSynquestitaskCallback)
      db_helper.getAllTaskSetsFromDb(this.dbTaskSetCallback)
    }

    let storeState = store.getState()
    if (storeState.shouldEdit) {
      if (storeState.typeToEdit === db_objects.ObjectTypes.SET)
        this.selectTaskSet(storeState.objectToEdit)
      else if (storeState.typeToEdit === db_objects.ObjectTypes.TASK)
        this.selectSynquestitask(storeState.objectToEdit)

      store.dispatch({
        type: 'SET_SHOULD_EDIT',
        shouldEdit: false,
        typeToEdit: ''
      })
    }
  }

  //Closes the current objecy being viewed in the asset editor view
  clearAssetEditorObject() {
    this.setState({ assetEditorContext: "empty", assetEditorObject: null, selectedTaskSet: null, selectedSynquestitask: null })
  }

  removeTaskSet(taskSet) {
    db_helper.deleteTaskSetFromDb(taskSet._id)
  }

  escapeRegExp(text) {        //Adds escape characters in fornt of all common regex symbols
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  }

  addSynquestitaskCallback() {
    this.assetEditorCompKey += 1
    this.clearAssetEditorObject()
    this.setState({
      assetEditorObject: <EditTask isEditing={false}
        closeTaskCallback={this.assetEditorObjectClosed.bind(this)}
        key={this.assetEditorCompKey} />
    })
  }

  addSetCallback() {
    this.assetEditorCompKey += 1
    this.clearAssetEditorObject()
    this.editSetComponentRef = React.createRef()
    this.setState({
      assetEditorObject: <EditSet isEditing={false}
        closeSetCallback={this.assetEditorObjectClosed.bind(this)}
        key={this.assetEditorCompKey} ref={this.editSetComponentRef} />
    })
  }

  onDragEnd = result => {
    const { source, destination } = result
    if (!destination) return   // dropped outside the list

    //If the source is the same as the destination we just move the element inside the list
    if (source.droppableId === destination.droppableId)
      this.editSetComponentRef.current.moveTask(source.index, destination.index)
    else { //Otherwise we add to the list at the desired location
      let itemType
      if (source.droppableId === "Sets")
        itemType = db_objects.ObjectTypes.SET
      else if (source.droppableId === "Tasks")
        itemType = db_objects.ObjectTypes.TASK
      else return

      let id = result.draggableId
      if (id.includes('_'))
        id = result.draggableId.split('_')[0]

      this.editSetComponentRef.current.addTask({ objType: itemType, _id: id }, destination.index)
    }
  }

  getAssetEditorObject() {
    return (
      <div className="AssetEditor" style={{ paddingLeft: 5, backgroundColor: (this.props.theme.palette.type === "light" ? this.props.theme.palette.primary.main : this.props.theme.palette.primary.dark) }}>
        <div className="AssetEditorContent">
          {this.state.assetEditorObject}
        </div>
      </div>
    )
  }

  filterButtonPressed(type, e) {       //Filter button callback, the type determines which collection we are filtering
    this.filterDialogKey += 1
    this.setState({ openFilterDialog: true, filterQueryType: type })
  }

  filtersUpdated(type, filters, searchType) {      //Callback when filters have been selected in the filters dialog
    let updatedMap = new Map(this.state.filterStateMap)
    let updatedObject = updatedMap.get(type)
    updatedObject.tagFilters = filters
    updatedObject.queryCombination = searchType
    updatedMap.set(type, updatedObject)
    this.setState({ openFilterDialog: false, filterStateMap: updatedMap })
    this.filterMap = updatedMap
    this.querySearchTasksFromDB(type)
  }

  onCloseFilterDialog() {
    this.setState({ openFilterDialog: false })
  }

  onSearchInputChanged(type, e) {
    let searchString = ""
    if (typeof (e) === 'object') {
      searchString = e.target.value
      if (!this.state.allowRegex) searchString = this.escapeRegExp(searchString)
      if (searchString.includes(",")) {
        searchString = searchString.split(",")
        searchString = searchString.map((value) => {
          return value.trim()
        })
        searchString = searchString.filter(Boolean) //Remove empty values
      } else searchString = [searchString]
    }

    let updatedMap = new Map(this.state.filterStateMap)
    let updatedObject = updatedMap.get(type)
    updatedObject.searchStrings = searchString
    updatedMap.set(type, updatedObject)
    this.setState({ filterStateMap: updatedMap })
    this.filterMap = updatedMap
    this.querySearchTasksFromDB(type)
  }

  querySearchTasksFromDB(type) {
    let filterObject = this.filterMap.get(type)
    let combinedSearch = filterObject.tagFilters.concat(filterObject.searchStrings)
    combinedSearch = combinedSearch.filter(Boolean) //Remove empty values
    if (combinedSearch.length === 1 && filterObject.searchStrings.length === 1)
      combinedSearch = combinedSearch[0]
    if (combinedSearch.length === 0)
      combinedSearch = ""
    db_helper.queryTasksFromDb(type, combinedSearch, filterObject.queryCombination, this.dbQueryCallback)
  }

  getCollapsableHeaderButtons(activeFilters, searchCallback, addCallback, filterCallback, searchBarID) {
    return (
      <div className="collapsableHeaderBtnsContainer">
        <div className="searchWrapperDiv"><SearchBar onChange={searchCallback} searchID={searchBarID} /></div>
        <div className="collapsableBtns">
          { (filterCallback !== null) ?
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

  getTaskTypeContainer(taskType, taskMap) {
    const dragEnabled = (this.state.assetEditorObject && this.state.assetEditorObject.type === EditSet) ? true : false

    let containerContent = []
    let selectedTask = null
    let selectCallback = null
    let addCallback = null
    let activeFilters = this.state.filterStateMap.get(taskType).tagFilters.length > 0 ? true : false

    if (taskType === db_objects.ObjectTypes.TASK) {
      selectedTask = this.state.selectedSynquestitask
      selectCallback = this.selectSynquestitask.bind(this)
      addCallback = this.addSynquestitaskCallback.bind(this)
    } else if (taskType === db_objects.ObjectTypes.SET) {
      selectedTask = this.state.selectedTaskSet
      selectCallback = this.selectTaskSet.bind(this)
      addCallback = this.addSetCallback.bind(this)
    } else return null

    let collapsableHeaderButtons = this.getCollapsableHeaderButtons(activeFilters, this.onSearchInputChanged.bind(this, taskType),
      addCallback, this.filterButtonPressed.bind(this, taskType), taskType + "SearchBar")

    //No nested lists
    containerContent = < TaskList dragEnabled={dragEnabled} taskList={taskMap}
      selectTask={selectCallback} selectedTask={selectedTask}
      itemType={taskType} droppableId={taskType} idSuffix={""} />

    return (
      <CollapsableContainer headerTitle={taskType} useMediaQuery={true}
        headerComponents={collapsableHeaderButtons} hideHeaderComponents={true} open={true}>
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

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="editorScreenContainer">
          <div style={{ backgroundColor: (this.props.theme.palette.type === "light" ? this.props.theme.palette.primary.dark : this.props.theme.palette.primary.main) }} className="AssetViewer">
            <div className="AssetViewerContent">
              {this.getTaskTypeContainer(db_objects.ObjectTypes.TASK, this.state.synquestitaskList)}
              {this.getTaskTypeContainer(db_objects.ObjectTypes.SET, this.state.taskSetList)}
            </div>
          </div>

          {this.getAssetEditorObject()}

          <FilterDialog openDialog={this.state.openFilterDialog} key={"filterDialog" + this.filterDialogKey}
            closeDialog={this.onCloseFilterDialog.bind(this)}
            filterType={this.state.filterQueryType}
            filterObject={this.state.filterStateMap.get(this.state.filterQueryType)}
            onFiltersUpdated={this.onFiltersChanged} />
          < /div>
    </DragDropContext>
    )
  }
}

export default withTheme(Edit)