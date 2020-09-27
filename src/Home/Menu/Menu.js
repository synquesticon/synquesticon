import React, { useState } from 'react'
import store from '../../core/store'
import db_helper from '../../core/db_helper'
import DeviceIDDialog from './Dialogs/DeviceIDDialog'
import MQTTDialog from './Dialogs/MQTTDialog'
import EyeTrackerSelector from './EyeTrackerSelector'
import Drawer from '@material-ui/core/Drawer'
import List from '@material-ui/core/List'
import Divider from '@material-ui/core/Divider'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Switch from '@material-ui/core/Switch'
import './Menu.css'

const Menu = props => {
  const [openDeviceIDSettings, setOpenDeviceIDSettings] = useState(false)
  const [openMQTTSettings, setOpenMQTTSettings] = useState(false)

  const onFullscreen = e => {
    if ((document.fullScreenElement && document.fullScreenElement !== null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)) {
      if (document.documentElement.requestFullScreen) 
        document.documentElement.requestFullScreen()
      else if (document.documentElement.mozRequestFullScreen) 
        document.documentElement.mozRequestFullScreen()
      else if (document.documentElement.webkitRequestFullScreen) 
        document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT)
    } else {
      if (document.cancelFullScreen) 
        document.cancelFullScreen()
      else if (document.mozCancelFullScreen) 
        document.mozCancelFullScreen()
      else if (document.webkitCancelFullScreen) 
        document.webkitCancelFullScreen()
    }
  }

  const onToggleThemeChange = () => store.dispatch({ type: 'TOGGLE_THEME_TYPE', })

  return (
    <span >
      <Drawer anchor="right" open={props.showMenu} onClose={props.closeSettingsMenu}>
        <div
          tabIndex={0}
          role="button"
          onClick={props.openSettingsMenu}
          style={{ minWidth: 200, height: '100%' }}
        >
          <List >
            <ListItem button key="Device ID" onClick={() => setOpenDeviceIDSettings(true)}>
              <ListItemText primary="Device Settings" />
            </ListItem>
            <ListItem button key="MQTT Settings" onClick={() => setOpenMQTTSettings(true)}>
              <ListItemText primary="MQTT Settings" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <ListItem key="ToggleTheme">
                <ListItemText primary="Dark Theme" />
              </ListItem>
              <Switch
                checked={store.getState().theme.palette.type !== "light"}
                onChange={onToggleThemeChange}
                value="checkedB"
                color="secondary"
                inputProps={{ 'aria-label': 'primary checkbox' }}
              />
            </div>
            <ListItem button key="Fullscreen" onClick={onFullscreen}>
              <ListItemText primary="Fullscreen" />
            </ListItem>
            <EyeTrackerSelector />
          </List>
          <List>
            <ListItem key="Version">
              <ListItemText primary="Version 1.0" />
            </ListItem>
          </List>
          <List>
            <ListItem button key="DummySet" onClick={() => db_helper.deleteAllSetsFromDb()}>
              <ListItemText primary="Empty Sets" />
            </ListItem>
            <ListItem button key="DummyLegacy" onClick={() => db_helper.deleteAllLegacyTasksFromDb()}>
              <ListItemText primary="Empty Legacy Tasks" />
            </ListItem>
          </List>
        </div>
      </Drawer>
      <DeviceIDDialog openDeviceIDSettings={openDeviceIDSettings}
        closeDeviceIDSettings={() => setOpenDeviceIDSettings(false)} myStorage={window.localStorage} />
      <MQTTDialog openMQTTSettings={openMQTTSettings}
        closeMQTTSettings={() => setOpenMQTTSettings(false)} myStorage={window.localStorage} />
    </span>
  )
}

export default Menu