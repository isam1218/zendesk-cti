import React, { Component } from 'react';

export default class AppWindow extends Component {
  // data requirements
  // static propTypes = {
  //   locations: React.PropTypes.object.isRequired,
  //   settings: React.PropTypes.object.isRequired,
  //   quickinbox: React.PropTypes.object.isRequired,
  //   avatars: React.PropTypes.object.isRequired,
  //   mycalls: React.PropTypes.array.isRequired
  // }
  
  constructor(props) {
    super(props);
    // initial feed data from main.js
    // this.state = this.props;
    console.log('1 INITIAL props - ', props);


  }

  componentWillReceiveProps() {
    // console.log('1 props - ', this.props);
    this.setState({
      settings: this.props.settings,
      locations: this.props.locations,
      quickinbox: this.props.quickinbox,
      mycalls: this.props.mycalls
    })
    // this.setState({
    //   fdpImage: this.props.fdpImage,
    //   location_status: this.props.location_status,
    //   locations: this.props.locations,
    //   me: this.props.me,
    //   quickinbox: this.props.quickinbox,
    //   settings: this.props.settings
    // })
    console.log('2 state after setting props - ', this.state);
  }

  // THIS IS JUST AN EXAMPLE OF WHAT COULD BE RENDERED REFER TO HUDN LOGIC 
  
  render() {
    // pass feed data down the chain as props
    // if (this.state && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
    // if location name is available -> display it
    if (this.state && this.state.locations && Object.keys(this.state.locations).length > 1 && this.state.mycalls && this.state.mycalls.length == 0){
      // AT THIS POINT, WE'RE JUST TESTING TO GET SOME STUFF ON THE SCREEN
      var audioBtn, dialBtn, body;
      
      // var formCSS = 'form' + (this.state.focused ? ' focused' : '');
      // var callBtnCSS = 'material-icons callbtn' + (this.state.phone != '' ? ' active' : '');
      // var audioBtnCSS = 'material-icons audio';
      
      // extra buttons for softphone users
      if (this.props.locations[this.props.settings['current_location']].locationType == 'w') {
        var classy = 'material-icons audio';
      
        // if (this.state.popup == 'audio')
        //   classy += ' on';
        
        audioBtn = (<i className={classy} onClick={() => this._openPopup('audio')}>volume_up</i>);
        
        dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);
      }
    
      body = (
        <div id="basic">  
          {audioBtn}
        
          <div className="location">
            <span>Location:</span>
            <span className="my_location" onClick={this.props.settings.chat_status != 'offline' ? () => this._openPopup('location') : ''}>
              {this.props.locations[this.props.settings.current_location].name} 
              <i className="material-icons">expand_more</i>
            </span>
          </div>
            
          <div className="calling">
            <div >
              <div className="label">NUMBER/EXTENSION</div>
              <input 
                className="number" 
                type="text"
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
                onFocus={(e) => this._setFocus(true)}
                onBlur={(e) => this._setFocus(false)}
              />
            </div>
            
            {dialBtn}
            
            <i  onClick={() => this._callNumber()}>call</i>
          </div>
        </div>
      );

      // header is always the same; body will change
      return(
        <div id="app"  onClick={() => this._openPopup(null)}>

        
          <div id="header">
            <div onClick={() => this._openPopup('status')}>
              <div ></div>
              <i className="material-icons more">expand_more</i>
            </div>
          
            <div className="buttons">
              <div className="missed_calls">
                <div className="tooltip">Open HUD for details.</div>
                <i className="material-icons">call_missed</i>
                
              </div>
              
              <div className="voicemails">
                <div className="tooltip">Open HUD for details.</div>
                <i className="material-icons">voicemail</i>
                
              </div>
              
              <div className="chats">
                <div className="tooltip">Open HUD for details.</div>
                <i className="material-icons">chat</i>
                
              </div>
            </div>
            
            <i className="material-icons" onClick={() => this._openPopup('preferences')}>settings</i>
          </div>
          
          {body}
          
          
          

        </div>
      );


      {/*}
      return(
          <div id="basic" > 
            <div>
              <span>Location:</span>
              <span className="my_location" >
                <i className="material-icons">{this.state.locations[this.state.settings.current_location].name}</i>
              </span>

            </div>
            
            
            <div className="calling">
              <input 
                className="number" 
                type="text" 
                placeholder="ENTER NUMBER OR EXT." 
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
              />
              
              
              <i  onClick={() => this._callNumber()}>call</i>
            </div>
          </div>
      );
      */}     


    }
    else {
      // otherwise catch it when props hasn't been passed down yet
      return(
          <div id="basic" > 
            <div>
              <span>Location:</span>
              <span className="my_location" >
                <i className="material-icons">Location HERE</i>
                
              </span>
            </div>
            
            {/*}
            <div className="calling">
              <input 
                className="number" 
                type="text" 
                placeholder="ENTER NUMBER OR EXT." 
                value={this.state.phone} 
                onChange={(e) => this._updateValue(e, 'phone')} 
                onKeyPress={(e) => this._callNumber(e)}
                onInput={(e) => this._restrictInput(e)}
              />
              
              
              <i  onClick={() => this._callNumber()}>call</i>
            </div>
          */}
          </div>
        );
      
    }
  }
}

