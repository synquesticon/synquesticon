import * as dbObjects from './db_objects'

export function arrayMove(arr, fromIndex, toIndex) {
    let element = arr[fromIndex]
    arr.splice(fromIndex, 1)
    arr.splice(toIndex, 0, element)
}

/**
 * getTaskContent - A utility function that can be called to get the information
 * that should be displayed in the UI based on the different object types.
 * @namespace db_objects_utility_functions
 * @param  {object} task The object to extract content from.
 */
export function getTaskContent(task){
  return(
    (task.objType === dbObjects.ObjectTypes.SET)
      ? task.name : null
  )
}