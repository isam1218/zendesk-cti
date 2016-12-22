import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';
import update from 'react-addons-update';
import _ from 'lodash';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: true,
      app: false,
      fdpImage: [],
      location_status: [],
      me: [],
      quickinbox: [],
      settings: {
        display_name: '',
        current_location: 'self',
        ringing_volume: '1', 
        hudmw_webphone_mic: '0.5',
        hudmw_webphone_speaker: '0.5',
        chat_status: 'offline', 
        chat_custom_status: '',
        alwaysOnTop: false,
        coords: {},
        devices: {input:[], output:[]},
      },
      locations: {
        self: {
          name: "Fonality CTI",
          locationType: 'w',
          hidden: true
        }
      },
      avatars: {},
      mycalls: []
    }
    this.loginToApp = this._changeLoginToApp.bind(this);
    // need to include pkg.json module
    this.server = "https://dev4.fon9.com:8081";
  }

  componentDidMount() {
    // managing data changed by sync to update state which will be passed down
    this.dataListener = fdp.emitter.addListener('data_sync_update', (data) => {
      console.log('*** ---> Parent Component is receiving new data!!! - ', data);


      /**
      USER SETTINGS
      */

      // want to loop thru [all returned synced data] 
        // -> a) if the curPropKey  exists on this.state, then replace this.state[curPropKey]'s value w/ curPropValue
        // -> b) otherwise just add curPropKey to this.state
      if (data['me']){
        for (let i = 0; i < data['me'].length; i++) {
          let curPropKey = data['me'][i].propertyKey;
          let curPropValue = data['me'][i].propertyValue;
          // using react addon update library...
          let updatedState = update(this.state, {
            settings: {
              [curPropKey]: {$set: curPropValue}
            }
          });
          this.setState(updatedState);
          /*
          // could also use lodash to merge previous state w/ new state nested property update
          // http://stackoverflow.com/questions/18933985/this-setstate-isnt-merging-states-as-i-would-expect
          // this.setState((previousState) => _.merge({}, previousState, { settings: { [curPropKey] : curPropValue } }));
          */
        }
      }
    

      /**
        AVATARS
      */
      
      if (data['fdpImage']){
        for (let i = 0; i < data['fdpImage'].length; i++) {
          let img = data['fdpImage'][i];
          // find mine
          if (img.xpid == this.state.settings.my_pid){
            let remote = `${this.server}/v1/contact_image?pid=${img.xpid}&w=90&h=90&Authorization=${localStorage.auth}&node=${localStorage.node}&xver=${img.xef001iver}`;
            let updatedState = update(this.state, {
              settings: {
                icon_url: {$set: remote}
              }
            });
            this.setState(updatedState);
          }
        }
      }


      /**
        CALLS
      */

    // console.log('updated state - ', this.state);
    // listener ends...
    });

  }


  // handles initialization of app upon login...
  _changeLoginToApp() {
    this.setState({
      login: false,
      app: true
    });
    // versionCheck calls -> syncRequest -> syncRequest calls syncStatus + emits data to listener here in componentDidMount 
    fdp.versionCheck();
  }

  render() {
    if (this.state.app){
      // ***Uncomment below and comment above to enable refresh..
    // if (localStorage.node || localStorage.auth || this.state.app){
      // console.log('have tokens already! - ', localStorage.node, localStorage.auth);
      return (
        <div>
          APP GOES HERE
        </div>
      )
    }
    if (this.state.login){
      // console.log('1, localStorage - ', localStorage.node, localStorage.auth);
      return <LoginWindow login={this.loginToApp} />
    }
  }
}
