import React, { Component } from 'react';
import LoginWindow from './login.js';
import fdp from './fdp.js';
import AppWindow from './appWindow.js';

export default class App extends Component {
  constructor(props) {
    super(props);

this.state = {
      login: true,
      app: false,
      ticketPhone: ''
    }
          // Initialise the Zendesk JavaScript API client
      // https://developer.zendesk.com/apps/docs/apps-v2
    



       
    // add additional state properties for different window components (e.g. preferences, about, etc)


    this.loginToApp = this._changeLoginToApp.bind(this);
    this.logoutOfApp = this._logout.bind(this);
    // need to include pkg.json module
    this.server = "https://dev4.fon9.com:8081";
    this.configName = "Fonality CTI";
  }

  componentWillReceiveProps(props) {
    
    if(props.logout){
          this._logout();
    }
    else{
      this._changeLoginToApp();
    }

  }

  componentDidMount() {
    if(!fdp.master){
      console.log("MOUNTED and CHECKED",fdp.master);
    setTimeout(function(){fdp.checkMaster()},1);
  }

    if(localStorage.refresh != null && localStorage.refresh != undefined){
      
            this.setState({
              login: false,
              app: true,
              ticketPhone: ''
            });


    
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
      app: true,
      ticketPhone: ''
    });
    // versionCheck calls -> syncRequest -> syncRequest calls syncStatus + emits data to listener here in componentDidMount 
    
  }

    _logout() {
    this.setState({
      login: true,
      app: false,
      ticketPhone: ''
    });
    // versionCheck calls -> syncRequest -> syncRequest calls syncStatus + emits data to listener here in componentDidMount 
  }

  render() {



    if (this.state.app){
      // ***Uncomment below and comment above to enable refresh..
    // if (localStorage.node || localStorage.auth || this.state.app){

    
      return (
        <div>
          <AppWindow avatars={this.props.avatars} locations={this.props.locations} settings={this.props.settings} mycalls={this.props.mycalls} ticketPhone={this.props.ticketPhone} calllog={this.props.calllog} queue_members={this.props.queue_members} queue_members_status={this.props.queue_members_status} queues={this.props.queues} queuelogoutreasons={this.props.queuelogoutreasons} deletedCalls={this.props.deletedCalls} logout={this.logoutOfApp} />
        </div>
      )
    }
    else if (this.state.login){
      return (<LoginWindow login={this.loginToApp} />)
    }
    return (<div></div>)
  }
}
