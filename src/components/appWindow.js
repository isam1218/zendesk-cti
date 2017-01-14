import React, { Component } from 'react';
// import ReactDOM from 'react-dom';
import css from '../../style/main.less';
import Popup from './popup.js';
import Timer from './timer.js';
import fdp from './fdp.js';
import zendesk from './zendesk.js';

export default class AppWindow extends Component {
  // data requirements
  static propTypes = {
    locations: React.PropTypes.object.isRequired,
    settings: React.PropTypes.object.isRequired,
    avatars: React.PropTypes.object.isRequired,
    mycalls: React.PropTypes.array.isRequired
  }
  
  constructor(props) {
    super(props);
    // this.state.phone is the phone # dialed into form input
    this.state = {
      screen: 'default',
      phone: '',
      focused: false,
      popup: null,
			my_pid: '',
			mute: '',
			zendeskAgentId: null
    }
  }

  componentWillReceiveProps() {
    this.setState({
      settings: this.props.settings,
      locations: this.props.locations,
      mycalls: this.props.mycalls,
      avatars: this.props.avatars,
			my_pid: this.props.settings.my_pid,
			display_name: this.props.settings.display_name
    });
		console.log('this.props.settings - ', this.state.display_name);
    // if (this.state && this.state.locations & this.state.settings){
    //   console.log('***appWindow, my location should now be - ', this.state.locations[this.state.settings.current_location].name);
    // }
		
		// change screen state back to default if caller on the other side of phone call hangs up
		if (this.props.mycalls.length == 0){
			this.setState({
				screen: 'default'
			})
		}
		// if user mutes thru hudn softphone, need to change mute button anyways
		if (this.props.settings.hudmw_webphone_mic == "0"){
			this.setState({
				mute: true
			})
		} else {
			this.setState({
				mute: false
			})
		}
		console.log('this.state in appWindow, specifically settings.hudmw_webphone_mic -> ', this.props.settings);
		
		if (this.state.settings){
			// console.log('this.state - ', this.state.settings.display_name);
			zendesk.grabMyAgentId(this.state.settings.display_name)
				.then((status, err) => {
					// console.log('promise return status - ', status);
					var possibleUsersArray = status;
					if (possibleUsersArray.length == 1){
						// 1 single match b/w hud displayname and zendesk displayname
							// so save agent id -> to be used in screen pop call
							this.setState({
								zendeskAgentId: possibleUsersArray[0].id
							});
							console.log('state of agent id - ', this.state.zendeskAgentId);
					}
				});		
		}
  }

	_answerCall(call) {
		// fdp postFeed
		fdp.postFeed('mycalls', 'answer', {mycallId: call.xpid});
		// change hide of accept and end calls
	}

  // press enter or green call button to call
  _callNumber(e) {
    // can press enter to call
    if (e && e.key != 'Enter')
      return;
    
    if (this.state.phone != '') {      
      // logic if no other call is already in progress (using this.state.phone as the phone # to dial)
			console.log('about to call this number - ', this.state.phone);

			fdp.postFeed('me', 'callTo', {phoneNumber: this.state.phone});

      this._changeScreen('call');

      // e.target.blur();
    }
  }

  // change view
  _changeScreen(type = '') {
    this.setState({
      screen: type,
      phone: ''
    });
    console.log('_changeScreen to ', type);
  }

  // [DIALPAD SCREEN]
  // placeholder for dtmf - just updating this.state.phone w/ phone # to ultimately dial
  _dial(digit, skip) {
    if (!skip){
      this.setState({
        phone: this.state.phone + digit
      });
    }
  }

	_endCall(call) {
		// hang up current call
		// console.log('in _endCall w/ xpid - ', call);
		// fdp post request to end call
		fdp.postFeed('mycalls', 'hangup', {mycallId: call.xpid});
		// change screen back to default
		this._changeScreen('default');
	}

	// get avatar of person calling in (for [CALL SCREEN])
	_getAvatar(call) {
		// internal user
		if (call.contactId) {
			// avatar image
			if (this.props.avatars[call.contactId]) {
				return(<img className="avatar" src={this.props.avatars[call.contactId]} />);
			}
			// initials
			else {
				var split = call.displayName.split(' ');
				var fName = split[0].charAt(0);
				var lName = '';
				
				if (split.length > 1)
					lName = split[split.length-1].charAt(0);
				
				return(
					<div className="avatar">
						<div className="initials">{fName + lName}</div>
					</div>
				);
			}
		}
		// unknown
		else{
			return (<img className="avatar" src="./generic-avatar.png" />);
		}
	}
	
	// part of [CALL SCREEN]
	_getStatus(call) {
		// change text of call status based on state/type
		switch(call.state) {
			case 3:
				return (
					<div className="status">
						On hold for (<Timer start={call.holdStart} />)
					</div>
				);
			
				break;
			case 2:
				// console.log('getstatus case 2, call.created is  - ', parseInt(call.created));
				return (
					<div className="status">
						On call for (<Timer start={call.created} />)
					</div>
				);
				
				break;
			default:
				// ringing
				if (call.incoming) {
					return (<div className="status">Incoming call</div>);
				}
				else {
					return (<div className="status">Outbound call</div>);
				}
				
				break;
		}
	}

	_holdCall(call) {
		// console.log('in hold call! - ', call);
		// if call is not on hold
		if (call.state !== 3){
			// fdp request to hold call...
			fdp.postFeed('mycalls', 'transferToHold', {mycallId: call.xpid});
		} else if (call.state === 3){
			fdp.postFeed('mycalls', 'transferFromHold', {mycallId: call.xpid, toContactId: this.state.my_pid})
			// otherwise if call  is on hold -> unhold...
		}
	}

  // calls relevant popup
  _openPopup(type) {
    // make sure this only used in necessary areas
    // console.log('in _openPopup - ', type);
    this.setState({
      popup: type
    });
  }
  // parse out unwanted inputs
  _restrictInput(e) {
    // convert letters and strip out unwanted chars
		e.target.value = e.target.value
			.replace(/[abc]/ig, 2)
			.replace(/[def]/ig, 3)
			.replace(/[ghi]/ig, 4)
			.replace(/[jkl]/ig, 5)
			.replace(/[mno]/ig, 6)
			.replace(/[pqrs]/ig, 7)
			.replace(/[tuv]/ig, 8)
			.replace(/[wxyz]/ig, 9)
			.replace(/[^0-9\*\+\-()# ]/g, '');
  }

  _sendAction(action, value) {
    switch(action){
      case 'mute':
      case 'hold':
      case 'answer':
      case 'end':
        var mycall = {};
        this._changeScreen('default');
        break;
    }
  }

  // [BASIC SCREEN] handles css depending on focus change of Number/Extension input
  _setFocus(f) {
    this.setState({
      focused: f
    });
  }

	// [CALL SCREEN]
	_toggleMute(call, onOffice) {
		var data;
		// if webphone...
		if (this.state.locations[this.state.settings['current_location']].locationType == 'w'){
			// if not muted -> MUTE...
			if (this.state.settings.hudmw_webphone_mic != "0"){
				// save current volume for later use when unmuting...
				localStorage.hudmw_webphone_mic = this.state.settings.hudmw_webphone_mic;
				// set volume to 0
				data = {'name': 'hudmw_webphone_mic', value: 0};
				fdp.postFeed('settings', 'update', data);
				this.setState({
					mute: true
				});
			} else if (this.state.mute == true){
				// else if already muted -> UNMUTE...
				// default to .5 if no saved LS value
				localStorage.hudmw_webphone_mic = localStorage.hudmw_webphone_mic ? localStorage.hudmw_webphone_mic : .5;
				data = {'name': 'hudmw_webphone_mic', 'value': localStorage.hudmw_webphone_mic};
				fdp.postFeed('settings', 'update', data);
				this.setState({
					mute: false,
				})
			} 
		} else if (this.state.locations[this.state.settings['current_location']].locationType == 'o'){
			// if office phone different API call for mute?
		} else {
			// if mobile diff API call for mute?
		}
	}

	_transfer(call, isVM) {
		// call FDP API to transfer call (either regular or to VM transfer)

		// clear screen
		this._changeScreen('default');
	}

  // handles input event.target.value
  _updateValue(e, property) {
    this.setState({
      [property]: e.target.value
    })
  }

	_zendesk(call) {
		// hopefully alreayd have agent id stored in zendesk (need agent_id + enduser_id to send POST request for user profile screen pop)
			// @@LINK CALL CENTER AGENT TO ZD-AGENT
			// this would accomplish step 2 below
			// BUT!!!! HOW DO WE KNOW WHAT ZD-USER IS ASSOCIATED W/ THE CURRENTLY-LOGGED IN hudweb user (matching email addresses?)
				// can search using display_name for now. 
				// ****but would using a phone number, or email address be better????
				// try a search using displayName
		
		// STEP 2 -> moved to componentDidMount section of the code (want to grab it as soon as user logs in)
		// zendesk.grabMyAgentId(this.state.display_name)
		// 	.then((status, err) => {
		// 		console.log('promise return status - ', status);
		// 		var possibleUsersArray = status;
		// 		if (possibleUsersArray.length == 1){
		// 			// 1 single match b/w hud displayname and zendesk displayname
		// 				// so save agent id -> to be used in screen pop call
		// 				this.setState({
		// 					zendeskAgentId: possibleUsersArray[0].id
		// 				});
		// 				console.log('state of agent id - ', this.state.zendeskAgentId);
		// 		}
		// 	});

		// zendesk.openProfile();
		/* STEPS
			1. grab call object - phone # and link it to a zendesk end user (run search for incoming phone number -> want it to return a zd-end-user)
				a) -> if phone # turns up NO END USERS -> create a new ZD end user profile
						-> 2. (user created) -> @@link call center agent to a zendesk agent
						-> 3. (userID + agentID) -> screen pop a brand new ticket for that end user
				b) -> if turns up 1 END USER -> grab user_id
						-> 2. (user found) -> @@link call center agent to a zendesk agent 
							-> (have agentID + userID) -> screen pop end user's profile
				c) -> if phone # has multiple users attached -> display the first match end user supplied by the API
		*/

		// zendesk.getZendeskRequest(phoneNumber);
		// if no results -> create a new end user profile in ZD w/ phone number of caller
		// zendesk.createUser(phoneNumber);
		// ISSUES:
			// if given phone # of mycall obj -> need to return LIST OF MATCHING TICKETS (not just json data)
			// 1. need to figure out how to format the zendesk api request
			// 2. need to figure out what's the correct api zendesk request to make (search?, tickets? etc)

			// agentId: 
				// 3921212486 (Sean Rose)

			// end user Ids:
				//4158534023

	}

  
  render() {
    var mycall = this.props.mycalls[0];
		console.log('mycall - ', mycall);
    var popup, overlay, body, footer;
    var barCSS = '';


    // [DEFAULT SCREEN - BASIC WINDOW NO CALL] {body} *****WILL NEED TO ADD NEW RECENT CALLS SECTION TO THE BOTTOM OF THIS VIEW*****
		// if (this.props.mycalls.length === 0){
    if (this.props && this.props.mycalls.length == 0 && this.state && this.state.screen == 'default' && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name){
      // console.error('default screen - ', this.state, this.props);
      var audioBtn, body;
      var formCSS = 'form' + (this.state.focused ? ' focused' : '');
      // var formCSS = 'form focused';
      // var callBtnCSS = 'material-icons callbtn' + (this.state.phone != '' ? ' active' : '');
      var callBtnCSS = 'material-icons callbtn';
      // var audioBtnCSS = 'material-icons audio';
			
      var dialBtn = (<i className="material-icons dialpad" onClick={() => this._changeScreen('dialpad')}>dialpad</i>);

      body = (
        <div id="basic">  
        
          <div className="location">
            <span>Location:</span>
            <span className="my_location" onClick={this.state.settings.chat_status != 'offline' ? () => this._openPopup('location') : ''}>
              {this.state.locations[this.state.settings.current_location].name} 
              <i className="material-icons">expand_more</i>
            </span>
          </div>
            
          <div className="calling">
            <div className={formCSS}>
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
            
            <i className={callBtnCSS} onClick={() => this._callNumber()}>call</i>
          </div>
        </div>
      );


    }

    // [DIAL PAD SCREEN] {body}
    else if (this.state.screen == 'dialpad') {
			var input, actionBtn;
			
			// not on a call, so dialpad is just a glorified whatever
			if (!mycall) {
				input = (
					<input 
						className="input" 
						type="text" 
						placeholder="Enter Number or Ext." 
						value={this.state.phone} 
						onChange={(e) => this._updateValue(e, 'phone')} 
						onKeyPress={(e) => this._callNumber(e)}
						onInput={(e) => this._restrictInput(e)}
					/>
				);
				
				actionBtn = (<i className="material-icons answer" onClick={() => this._callNumber()}>call</i>);
			}
			else {
				input = (
					<input 
						className="input" 
						type="text" 
						placeholder="Enter #" 
						value={this.state.phone} 
						onChange={(e) => this._updateValue(e, 'phone')}
						onInput={(e) => this._restrictInput(e)}
						onKeyPress={(e) => this._dial(e.key, true)}
					/>
				);
				
				actionBtn = (<i className="material-icons end" onClick={() => this._sendAction('end', mycall)}>call_end</i>);
			}
			
			body = (
				<div id="dialpad">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Dialpad</span>
					</div>
					
					{input}
					
					<div className="controls">
						<div className="key" onClick={() => this._dial(1)}>
							<div className="number">1</div>
						</div>
						<div className="key" onClick={() => this._dial(2)}>
							<div className="number">2</div>
							<div className="label">ABC</div>
						</div>
						<div className="key" onClick={() => this._dial(3)}>
							<div className="number">3</div>
							<div className="label">DEF</div>
						</div>
						<div className="key" onClick={() => this._dial(4)}>
							<div className="number">4</div>
							<div className="label">GHI</div>
						</div>
						<div className="key" onClick={() => this._dial(5)}>
							<div className="number">5</div>
							<div className="label">JKL</div>
						</div>
						<div className="key" onClick={() => this._dial(6)}>
							<div className="number">6</div>
							<div className="label">MNO</div>
						</div>
						<div className="key" onClick={() => this._dial(7)}>
							<div className="number">7</div>
							<div className="label">PQRS</div>
						</div>
						<div className="key" onClick={() => this._dial(8)}>
							<div className="number">8</div>
							<div className="label">TUV</div>
						</div>
						<div className="key" onClick={() => this._dial(9)}>
							<div className="number">9</div>
							<div className="label">WXYZ</div>
						</div>
						<div className="key special" onClick={() => this._dial('*')}>
							<div className="number">*</div>
						</div>
						<div className="key" onClick={() => this._dial(0)}>
							<div className="number">0</div>
							<div className="label">+</div>
						</div>
						<div className="key special" onClick={() => this._dial('#')}>
							<div className="number">#</div>
						</div>
					</div>
					
					<div className="buttons">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>dialpad</i>
						{actionBtn}
					</div>
				</div>
			);

    }

    // NEED TO DO [TRANSFER SCREEN]
		else if (this.state.screen == 'transfer') {
      /*  *****FAKE CALL OBJ HARDWIRED IN SO WE CAN SWITCH SCREENS**** */
			// WILL HAVE TO REMOVE
      mycall = {
        type: 5,
        locationId: "0_11216067",
        incoming: false,
        state: 2,
        mute: false,
        contactId: "1000015ad_1905460",
        displayName: "Sean Rose",
        created: 1483047916744,
        phone: "714-469-1796",
        holdStart: 1483057916744
      }

			// disable buttons based on length of input value
			var disableNum = false;
			var disableVM = false;
			
			if (this.state.phone == '') {
				disableNum = true;
				disableVM = true;
			}
			else {
				var num = this.state.phone;
				
				// reserved numbers
				if (num.length >= 10 || num == 0 || num == 911 || num == 8555 || (num >= 8500 && num <= 8520) || (num >= 9000 && num <= 9050))
					disableVM = true;
			}
			
			body = (
				<div id="transfer">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Transfer</span>
					</div>
					
					<div className="info">
						<div className="alert">
							{this._getAvatar(mycall)}
							<div className="details">
								<div className="name">{mycall.displayName}</div>
								{this._getStatus(mycall)}
							</div>
						</div>
						
						<div className="to">
							<span>To:</span>
							<input 
								className="number" 
								type="text" 
								placeholder="Enter Ext or Number" 
								value={this.state.phone} 
								onChange={(e) => this._updateValue(e, 'phone')}
								onInput={(e) => this._restrictInput(e)}
							/>
						</div>
					</div>
					
					<div className="controls">
						<div>
							<div
								className="button" 
								disabled={disableNum}
								onClick={() => this._transfer(mycall)}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							<div
								className="button" 
								disabled={disableVM}
								onClick={() => this._transfer(mycall, true)}
							>
								<i className="material-icons">voicemail</i>
								<span className="label">voicemail</span>
							</div>
						</div>
						
						<div className="cancel" onClick={() => this._changeScreen('default')}>cancel</div>
					</div>
				</div>
			);
		}

		// [ON CALL SCREEN] (full view) {body}
    else if (this.props.mycalls.length > 0) {
			// console.error('CALL screen - ', this.state, this.props);

			var answerBtn, muteBtn;
			
			var audioBtnCSS = 'material-icons';
			var moveBtnCSS = 'material-icons';
			var holdBtnCSS = 'material-icons';
			
			// disable certain buttons based on context
      var disableConf = false;
      var disablePhone = false;
      var disableMute = false;
      var disableFDP = false;
			// var disableConf = mycall.type == 0 ? true : false;
      // var disablePhone = this.props.locations[mycall.locationId].locationType != 'w';
      // var disableMute = disablePhone && !disableConf;
			// var disableFDP = this.props.settings.chat_status == 'offline' ? true : false;
			
			if (this.state.popup == 'audio' || this.state.popup == 'move') {				
				if (this.state.popup == 'audio')
					audioBtnCSS += ' on';
				else
					moveBtnCSS += ' on';
			}

			// ****DO NOT SHOW ANSWER BUTTON WHEN HAVE AN OUTGOING CALL!!!!****
			// MAKE SURE ANSWER BUTTON IS WIRED UP TO FDP!!!
			
			if (mycall.incoming && mycall.state == 0) {
				// not for carrier location
				if (this.props.locations[mycall.locationId].locationType != 'm')
					answerBtn = (<i className="material-icons answer" onClick={() => this._answerCall(mycall)}>call</i>);
				
				// change color of bottom bar
				barCSS = `type${mycall.type}`;
			}
			
			if (mycall.state == 3)
				holdBtnCSS += ' on';
			
			if (mycall.mute || (!disablePhone && this.props.settings.hudmw_webphone_mic == 0))
				muteBtn = (<i className='material-icons mic on'>mic_off</i>);
			else
				muteBtn = (<i className='material-icons mic'>mic</i>);
		

			body = (
				<div id="full">				
					<div className="banner">
            {this._getAvatar(mycall)}
					</div>
					
					<div className="info">
						<div className="name">{mycall.displayName}</div>
            {this._getStatus(mycall)}
						
						<div className="controls">
							<div 
								className="button" 
								onClick={() => this._holdCall(mycall)}
								disabled={disableConf}
							>
								<i className={holdBtnCSS}>pause</i>
								<span className="label">hold</span>
							</div>
							
							<div 
								className="button"
								onClick={() => this._zendesk(mycall)}
								disabled={disablePhone}
							>
								<i className="material-icons">dialpad</i>
								<span className="label">dialpad</span>
							</div>
							
							<div 
								className="button" 
								onClick={() => this._openPopup('audio')}
								disabled={disablePhone}
							>
								<i className={audioBtnCSS}>volume_up</i>
								<span className="label">audio</span>
							</div>
							
							<div 
								className="button"
								onClick={() => this._toggleMute(mycall, disablePhone)}
								disabled={disableMute}
							>
								{muteBtn}
								<span className="label">mute</span>
							</div>
							
							<div 
								className="button"
								disabled={disableConf}
								onClick={() => this._changeScreen('transfer')}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							
							<div 
								className="button" 
								disabled={disableFDP}
								onClick={() => this._openPopup('move')}
							>
								<i className={moveBtnCSS}>call_split</i>
								<span className="label">move</span>
							</div>
						</div>
						
						<i className="material-icons end" onClick={() => this._endCall(mycall)}>call_end</i>
						
						
						{answerBtn}
					</div>
				</div>
			);


    }

		    
    // [POPUPS] {popup} 
    if (this.state.popup) {
      var classy = this.state.popup + (mycall ? ' full' : ' basic');

      popup = (
        <Popup 
          {...this.props}
          className={classy}
          callback={() => this._openPopup()}
        />
      );

      overlay = (<div className="overlay"></div>);
    }

    // RENDER COMPONENTS TOGETHER:
    return(
		<div id="app" onClick={popup ? () => this._openPopup(null) : ''}>
        {overlay}
        {popup}
        <div id="header">
          <div>
            <div ></div>
            FONALITY
          </div>
        
          <div className="buttons">            
          </div>
          <div className="agentlogin">
            <div className="tooltip"></div>
            <i className="material-icons">headset</i>
          </div>
          
          <i className="material-icons" onClick={() => this._openPopup('preferences')}>power_settings_new</i>
        </div>
        
        {body}
        
      </div>
    );


  }
}

