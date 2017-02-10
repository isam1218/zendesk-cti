import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';

export default class App extends Component {
  constructor(props) {
    super(props);

this.state = {
      login: '',
      app: '',
      ticketPhone: ''
    }
          // Initialise the Zendesk JavaScript API client
      // https://developer.zendesk.com/apps/docs/apps-v2
    



       
    // add additional state properties for different window components (e.g. preferences, about, etc)


    this.loginToApp = this._changeLoginToApp.bind(this);
    // need to include pkg.json module
    this.server = "https://dev4.fon9.com:8081";
    this.configName = "Fonality CTI";
  }

  componentWillReceiveProps() {
  }

  componentDidMount() {


    if(localStorage.refresh){
      
            this.setState({
              login: false,
              app: true,
              ticketPhone: ''
            });

            fdp.versionCheck();
    
    }

    else{
    this.setState({
      login: true,
      app: false,
      ticketPhone: ''
    });
  }





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
      return (
        <div>
          <AppWindow avatars={this.props.avatars} locations={this.props.locations} settings={this.props.settings} mycalls={this.props.mycalls} ticketPhone={this.state.ticketPhone} calllog={this.props.calllog} queue_members={this.props.queue_members} queue_members_status={this.props.queue_members_status} queues={this.props.queues} queuelogoutreasons={this.props.queuelogoutreasons} />
        </div>
      )
    }
    if (this.state.login){
      return <LoginWindow login={this.loginToApp} />
    }
    return (<LoginWindow login={this.loginToApp} />)
  }
}
