import React, { Component } from 'react';
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
			myZendeskAgent: null,
			incomingCallerEndUser: null,
			createdTicket: null
    }
  }

	// this lifecycle method happens once when component 1st loads...
	componentDidMount() {
		// GRAB MY AGENT INFO/ID based on user i am logged into zendesk as
		// GET REQUEST to ZD API: 'https://fonality1406577563.zendesk.com/api/v2/users/me.json'
		zendesk.grabMyAgentObj()
			.then((status, err) => {
				console.log('&aw: grabMyAgentObj -> ', status);
				this.setState({
					myZendeskAgent: status.user
				});
				console.log('aw: state after setting myagentid is -> ', this.state);
			});
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

		/* SCREEN POP STEPS...
			1. grab call object - phone # and link it to a zendesk end user (run search for incoming phone number -> want it to return a zd-end-user)
				a) -> if phone # returns NO END USERS -> create a new ZD end user profile
						-> 2. (after user is created) -> @@link call center agent to a zendesk agent
						-> 3. (user userID + agentID) -> screen pop a brand new ticket for that end user
				b) -> if turns up 1 END USER -> grab user_id
						-> 2. (user found) -> @@link call center agent to a zendesk agent 
							-> 3. (have agentID + userID) -> screen pop end user's profile
				c) -> if phone # has multiple users attached -> display the first match end user supplied by the API
		*/

		// CALL INCOMING...
		if (this.props.mycalls.length > 0) {
			// console.log('call info - ', this.props.mycalls[0]);
			var incomingCallNumber = this.props.mycalls[0].phone;

			zendesk.grabCallId(incomingCallNumber)
				.then((status, err) => {
					// console.log('@aw: grab call id result - ', status, err);
					this.setState({
						incomingCallerEndUser: status.users[0]
					});

					// IF status.users.length < 1... means there are NO related END USERS, so...
						// 3 steps:
						// 1. must ping API to create a new END USER
							// https://developer.zendesk.com/rest_api/docs/core/users#create-user
						// 2. must ping API to create a new ticket
							//https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
						// 3. screen pop that new ticket
							// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser	
					
					if (status.users.length < 1){
						// NO MATCH OF END USERS, create a user w/ random phone number...
						
						// ***SWAP OUT THIS LOGIC WHEN NO LONGER TESTING AND DON'T NEED TO USE RANDOM PHONE NUMBERS FOR NEW END USERS***
						var getRandom = function(length) {
							return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1));
						};

						var ourNumber = getRandom(10);
						// test create user:
						var userData = {
							"user": {
								"name": `Caller: ${ourNumber}`,
								"phone": ourNumber + ""
							}
						};
						// ***SWAP OUT THIS LOGIC WHEN NO LONGER TESTING AND DON'T NEED TO USE RANDOM PHONE NUMBERS FOR NEW END USERS***

						// IF USER IS NOT FOUND -> screen pop NEW TICKET (3 step process)...
						// 1. create new end user profile..
						// https://developer.zendesk.com/rest_api/docs/core/users#create-user
						zendesk.createUser(userData)
							.then((status, err) => {
								console.log("USER CREATED SUCCESFFULY BACK IN HOME MODULE - ", status);
								var createdUser = status.user
								// grab call info...
								var incomingCall = this.props.mycalls[0].incoming;
								// incoming call -> ID == 45
								// outbound call -> ID == 46
								var via_id = incomingCall ? 45 : 46;
								// 2. create new ticket w/ prepopulated data
								// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
								zendesk.createNewTicket(createdUser, via_id, this.state.myZendeskAgent)
									.then((status, err) => {
										console.log("TICKET CREATED SUCCESSFULLY BACK IN HOME MODULE - ", status);
										var lastCreatedTicket = status.ticket;
										this.setState({
											createdTicket: lastCreatedTicket
										});
									// 3. open that ticket in an agent's browser...
									// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser
									// zendesk.openCreatedTicket('3921212486', this.state.createdTicket.id)
									// otherwise, working version is...
									zendesk.openCreatedTicket(this.state.myZendeskAgent.id, this.state.createdTicket.id)
										.then((status, err) => {
											console.log("NEW TICKET POP SHOULD SUCCESSFULLY HAPPEN (BACK IN HOME MODULE) - ", status);
										});
									});
							});
					}

				});
		} // CLOSE BRACKET OF: if (this.props.mycalls.length > 0) {

  } // CLOSE BRACKET OF: componentWillReceiveProps

	_answerCall(call) {
		// fdp postFeed
		fdp.postFeed('mycalls', 'answer', {mycallId: call.xpid});
		
		// temporary hardcoded version THAT WORKS if necessary...
		// zendesk.profilePop(this.state.myZendeskAgent.id, '4180586926');
		console.log('about to screen pop -, the ids are -  ', this.state.myZendeskAgent.id, this.state.incomingCallerEndUser.id);

		// this should work if have correct agent id and end user id and logged correctly w/ proper oAuth secret...
		if (this.state.myZendeskAgent.id && this.state.incomingCallerEndUser.id){
			zendesk.profilePop(this.state.myZendeskAgent.id, this.state.incomingCallerEndUser.id)
				.then((status, err) => {
					console.log('IN HOME MODULE SUCCESSFUL SCREEN POP? - ', status, err);
				});

		}
		
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

	_zendesk2(call) {
		// THIS METHOD IS HOOKED UP TO MOVE BUTTON (ON CALL) FOR TESTING PURPOSES...
		// HARDCODED TEST OF SCREEN POP A NEW END USER + NEW TICKET FOR INCOMING CALLER
		
		// THIS CREATES A RANDOM USER so don't use up all of external phone numbers (new phone numbers are automatcially stored in the db, so wouldn't be able to test w/ that phone number again)
		var getRandom = function(length) {
			return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1));
		};
		var ourNumber = getRandom(10);
		// test create user:
		var userData = {
			"user": {
				"name": `Caller: ${ourNumber}`,
				"phone": ourNumber + ""
			}
		};

		// IF USER IS NOT FOUND -> screen pop NEW TICKET (3 step process)...
		// 1. create new end user profile..
		// https://developer.zendesk.com/rest_api/docs/core/users#create-user
		zendesk.createUser(userData)
			.then((status, err) => {
				console.log("USER CREATED SUCCESFFULY BACK IN HOME MODULE - ", status);
				var createdUser = status.user

				// grab call info...
				var incomingCall = this.props.mycalls[0].incoming;
				console.log('my call - ', this.props.mycalls[0]);
				// incoming call -> ID == 45
				// outbound call -> ID == 46
				var via_id = incomingCall ? 45 : 46;

				// 2. create new ticket w/ prepopulated data
				// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
				zendesk.createNewTicket(createdUser, via_id, this.state.myZendeskAgent)
					.then((status, err) => {
						console.log("TICKET CREATED SUCCESSFULLY BACK IN HOME MODULE - ", status);
						var lastCreatedTicket = status.ticket;
						this.setState({
							createdTicket: lastCreatedTicket
						});

					// THOUGHTS... (not sure if correct - need to verify)...
					/* 
					the agent id for the post request must match the user that user is logged in as...
					our auth token is attached to Sam. So can't use that token, logged into Zendesk as Sean, and expect screen pop functionality to work.
					will need to be logged in as Sam in Zendesk sandbox if using Sam's token
					zendesk.openCreatedTicket(3921212486, this.state.createdTicket.id)
					*/

					// 3. open that ticket in an agent's browser...
					// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser
					// 1st argument passed into openCreatedTicket should be: this.state.myZendeskAgent.id
					// '3921212486'
					// if not working, probably cuz not logged in as Sam but using his token, so use...

					// zendesk.openCreatedTicket('3921212486', this.state.createdTicket.id)
					// otherwise, working version is...
					zendesk.openCreatedTicket(this.state.myZendeskAgent.id, this.state.createdTicket.id)
						.then((status, err) => {
							console.log("NEW TICKET POP SHOULD SUCCESSFULLY HAPPEN (BACK IN HOME MODULE) - ", status);
						});

					});
			});
			// ***NEW TICKET SCREEN POP END***
	}

	_zendesk(call) {
		// THIS METHOD IS HOOKED UP TO DIALPAD BUTTON (ON CALL)
		// THIS IS THE HARDCODED VERSION WORKS!!!
		// zendesk.profilePop('3921212486', '4180586926');

		// hardcoded version w/ Sean Rose as agent id
		zendesk.profilePop('3921212486', this.state.incomingCallerEndUser.id);
		// zendesk.profilePop(this.state.myZendeskAgent, this.state.incomingCallerEndUser.id);
	}

  
  render() {
    var mycall = this.props.mycalls[0];
		// console.log('mycall - ', mycall);
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
								onClick={() => this._changeScreen('dialpad')}
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
								onClick={() => this._zendesk2(mycall)}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							
							<div 
								className="button" 
								disabled={disableFDP}
								onClick={() => this._zendesk(mycall)}
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

