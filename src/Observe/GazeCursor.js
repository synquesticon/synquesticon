import React from 'react'
import { withTheme } from '@material-ui/styles'
import { Typography } from '@material-ui/core'
import store from '../core/store'
import './css/GazeCursor.css'

class GazeCursor extends React.Component {
  constructor() {
    super()
    this.state = {
      visible: true,
      locX: 0,
      locY: 0
    }
    this.handleCursorVisibility = this.toggleVisibility.bind(this)
    this.handleGazeLocUpdate = this.updateCursorLocation.bind(this)
    this.cursorRadius = 20

    store.dispatch({
      type: 'SET_GAZE_RADIUS',
      gazeRadius: this.cursorRadius
    })
    this.frameDiv = React.createRef()
  }

  componentDidMount() {
    this.timer = setInterval(this.handleGazeLocUpdate, 1) //Update the gaze cursor location every 2ms
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  clamp(val, min, max) {
    return Math.min(Math.max(min, val), max)
  }

  updateCursorLocation() {
    try {
      let gazeLoc = store.getState().gazeData[this.props.tracker]
      let gazeLocX = this.clamp(gazeLoc.locX, 0, 1) * this.frameDiv.current.offsetWidth
      gazeLocX = gazeLocX > this.frameDiv.current.offsetWidth - this.cursorRadius * 2
        ? this.frameDiv.current.offsetWidth - this.cursorRadius * 2 : gazeLocX

      let gazeLocY = this.clamp(gazeLoc.locY, 0, 1) * this.frameDiv.current.offsetHeight
      gazeLocY = gazeLocY > this.frameDiv.current.offsetHeight - this.cursorRadius * 2
        ? this.frameDiv.current.offsetHeight - this.cursorRadius * 2 : gazeLocY

      if (this.state.visible && this.frameDiv) {   //Only draw the cursor if it is visible
        let cursorDiv = document.getElementById("gazeCursorDiv" + this.props.id)
        cursorDiv.style.left = gazeLocX + 'px'
        cursorDiv.style.top = gazeLocY + 'px'
        cursorDiv.style.width = this.cursorRadius * 2 + "px"
        cursorDiv.style.height = this.cursorRadius * 2 + "px"
      }

      this.setState({ locX: gazeLocX, locY: gazeLocY })
    } catch (err) {
    }
  }

  toggleVisibility() {
    this.setState({ visible: !this.state.visible })
  }

  render() {
    let cursor = null
    if (this.state.visible) 
      cursor = <span style={{ backgroundColor: this.props.theme.palette.secondary.main }} className="gazeCursor" id={"gazeCursorDiv" + this.props.id} />

    let bgolor = this.props.theme.palette.type === "light" ? this.props.theme.palette.primary.dark : this.props.theme.palette.primary.main

    return (
      <div style={{ backgroundColor: bgolor }} className="ETwrapper" >
        <div className="title"><Typography variant="body1" color="textPrimary" align="center">{this.props.participant}</Typography></div>
        <div className="gazeCursorContainer" ref={this.frameDiv}>
          {cursor}
        </div>
      </div>
    )
  }
}

export default withTheme(GazeCursor)