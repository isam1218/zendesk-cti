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
        devices: {input:[], output:[]},
      },
      locations: {
        self: {
          name: this.configName,
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
    this.configName = "Fonality CTI";
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
          // using react addon update library to save all settings 
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
            // save avatar to settings.icon_url
            let updatedState = update(this.state, {
              settings: {
                icon_url: {$set: remote}
              }
            });
            this.setState(updatedState);
            // console.log('setting avatar>>> - ', this.state);
          }
        }
      }


      /**
        LOCATIONS
      */

      if (data['locations']) {
        // when synced delete tmp placeholder if any
        // delete locations.temp;

        // delete tmp locations...
        // 1. delete locations
        let updatedState = update(this.state, {
          locations: {$set: null}
        });
        this.setState(updatedState);
        // 2. recreate empty locations obj
        let nextUpdatedState = update(this.state, {
          locations: {$set: {}}
        });
        this.setState(nextUpdatedState);
        for (let i = 0; i < data['locations'].length; i++) {
          let location = data['locations'][i];
          if (location.xef001type != 'delete') {
            // don't show mobile
            if (location.shortName == 'Mobile') {
              location.name = 'Mobile';
              location.hidden = true;
            }
            // change web name
            else if (location.shortName == 'Web')
              location.name = this.configName;
            
            location.status = {};
            let curLocationKey = location.xpid;
            // save locations deep nested obj
            let updatedState = update(this.state, {
              locations: {
                [curLocationKey]: {$set: location}
              }
            })
            this.setState(updatedState);
          }
          else{
            // delete locations[location.xpid];
            // **** sets delete location to undefined (or should I use null)*** 
            let updatedState = update(this.state, {
              locations: {
                [location.xpid]: {$set: undefined}
              }
            });
            this.setState(updatedState);
          }
        }

      }

      if (data['location_status']) {
        // attach details to each location
        for (let i = 0; i < data['location_status'].length; i++) {
          var status = data['location_status'][i];
          
          if (this.state.locations[status.xpid]){
            let curLocationStatusXpid = status.xpid;
            // save locations status - deep nested obj
            let updatedState = update(this.state, {
              locations: {
                [curLocationStatusXpid]: {
                  status: {$set: status}
                }
              }
            })
            this.setState(updatedState)

            // hard code mobile devices to registered
            if (this.state.locations[status.xpid].locationType == 'm'){
              let updatedState = update(this.state, {
                locations: {
                  [curLocationStatusXpid]: {
                    status: {
                      deviceStatus: {$set: 'r'}
                    }
                  }
                }
              })
            }
          }
        }
        
      }

      /**
        NOTIFICATIONS
      */

      if (data['quickinbox']) {
        for (let i = 0; i < data['quickinbox'].length; i++) {
          let note = data['quickinbox'][i];

          // if not a delete flag
          if (note.xef001type != 'delete') {
            //from today
            if (new Date(note.time + localStorage.timeShift).setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0)) {
              switch(note.type) {
                case 'gchat':
                case 'chat':
                case 'wall':
                  note.type = 'chat';
                case 'missed-call':
                case 'vm':
                  let updatedState = update(this.state, {
                    quickinbox: {
                      [note.xpid]: note
                    }
                  });
                  this.setState(updatedState);
              }
            }
          }
          else {
            // delete by setting to undefined???
            // http://stackoverflow.com/questions/32884780/how-can-i-remove-an-attribute-from-a-reactjs-components-state-object
            let updatedState = update(this.state, {
              quickinbox: {
                [note.xpid]: {$set: undefined}
              }
            })
          }
        }
      }

      /**
        CALLS
      */
      // temporarily setting mycalls length to 0 (NEED TO SET UP CALLS DATA SYNC)
      if (data['mycalls']){
        let updatedState = update(this.state, {
          mycalls: {$set: []}
        })
        this.setState(updatedState);
      }

      console.log('!updated state - ', this.state);
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
      // fdp.init();
      // console.log('have tokens already! - ', localStorage.node, localStorage.auth);
      return (
        <div>
          <AppWindow locations={this.state.locations} settings={this.state.settings} quickinbox={this.state.quickinbox} mycalls={this.state.mycalls}/>
        </div>
      )
    }
    if (this.state.login){
      // console.log('1, localStorage - ', localStorage.node, localStorage.auth);
      return <LoginWindow login={this.loginToApp} />
    }
  }
}
