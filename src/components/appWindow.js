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
			otherCallerEndUser: null,
			createdTicket: null,
			newCallerFlag: true
    }

  }

	// this lifecycle method happens once when component 1st loads...
	componentDidMount() {
		// GRAB MY AGENT INFO/ID based on user i am logged into zendesk as...
		// GET REQUEST to ZD API: 'https://fonality1406577563.zendesk.com/api/v2/users/me.json'
			zendesk.grabMyAgentObj()
				.then((status, err) => {
					this.setState({
						myZendeskAgent: status.user
					});
				});
	}


  componentWillReceiveProps() {
    this.setState({
      settings: this.props.settings,
      locations: this.props.locations,
      mycalls: this.props.mycalls,
      calllog: this.props.calllog,
      avatars: this.props.avatars,
      ticketPhone: this.props.ticketPhone,
      queue_members: this.props.queue_members,
      queue_members_status: this.props.queue_members_status,
      queues: this.props.queues,
      queuelogoutreasons: this.props.queuelogoutreasons,
			my_pid: this.props.settings.my_pid,
			display_name: this.props.settings.display_name
    });

    	
		console.log("QUEUE MEMBERS",this.props.queue_members);
		//console.log("QUEUEs",this.props.queues);
		//console.log("MEEEE",this.props.settings);
		console.log("QUEUE MEMBERS STATUS",this.props.queue_members_status);
		//console.log("QUEUE LOGOUT REASONS",this.props.queuelogoutreasons);
		// when call ends, return user to default screen, and set newCallerFlag back to true...
		if (this.props.mycalls.length == 0){
			this.setState({
				screen: 'default',
				newCallerFlag: true
			})
			
		}





      window.addEventListener('storage', (e)=> {  
		  if(e.key == "ticketPhone" && (e.newValue != ("null" || null))){
		  	this.setState({
		  		phone: e.newValue
		  	})
		  	this.setState({
		  		focused: true
		  	})
		  }
		  localStorage.removeItem("ticketPhone"); 
		});

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
			1. grab logged in agent id (this happens in componentDidMount lifecycle method)
			2. grab call object, run a search for that phone # against all zendesk end users...
				A) if no end user matches ->
					3. create a new ZD end user profile
					4. screen pop a new ticket w/ prepopulated with that user's info
				B) if only 1 end user match ->
					3. screen pop that end user's profile
				C) if more than 1 end users match that phone number ->
					3. screen pop the 1st end user's profile that matches...
		*/

		// Here comes a call...
		// (grab 1st call in mycalls) + (only incoming call) + (not 1 psuedo call menu/system call)
		// if ZI-3 is to apply to outgoing calls as well, then remove 2nd part of the if branch (this.props.mycalls[0].incoming)...
		if (this.props.mycalls.length > 0 && (this.props.mycalls[0].incoming) && (this.props.mycalls[0].displayName !== "Call menu" && this.props.mycalls[0].displayName !== "system" && this.props.mycalls[0].phone != "")) {
			var endUserCallNumber = this.props.mycalls[0].phone;
			var endUserNumber = endUserCallNumber.replace(/[\s()-]+/gi, '');
			// set newCallerFlag to false since we have a new call...
			if (this.state.newCallerFlag == true) {
				this.setState({
					newCallerFlag: false
				});
				
				/***** SCREEN POP LOGIC START ******/
					// grab call object and link to end user...
				zendesk.grabCallId(endUserNumber)
					.then((status, err) => {

						
						
						// set the end user profile object
						this.setState({
							otherCallerEndUser: status.users[0]
						});

						// if end user is found -> scren pop end user profile...
						if (status.users.length > 0){
							// screen pop the end user..
							if (this.state.myZendeskAgent.id && this.state.otherCallerEndUser.id){
								zendesk.profilePop(this.state.myZendeskAgent.id, this.state.otherCallerEndUser.id)
									.then((status, err) => {
									});
							}
						}
						
						// NO MATCH OF END USERS, create a user w/ random phone number (for now)...
						else if (status.users.length < 1){
							
							// NOTE TO ISAM:
							/***SWAP OUT THIS LOGIC!!! WHEN NO LONGER TESTING AND DON'T NEED TO USE RANDOM PHONE NUMBERS FOR NEW END USERS***/
							// this logic helps w/ testing new end users by storing a random phone number into zd database in place of # that's actually calling...
					/*		var getRandom = function(length) {
								return Math.floor(Math.pow(10, length-1) + Math.random() * 9 * Math.pow(10, length-1));
							};
							var callerPhoneNumber = getRandom(10);
							var userData = {
								"user": {
									"name": `Caller-${callerPhoneNumber}`,
									"phone": callerPhoneNumber + ""
								}
							};*/
							/***SWAP OUT!!! THIS LOGIC WHEN NO LONGER TESTING AND DON'T NEED TO USE RANDOM PHONE NUMBERS FOR NEW END USERS***/


							// **** SWAP IN THIS LOGIC!!! IN PLACE of code above ^^^ **** -> use caller's real phone # rather than randomly generated phone number
						/*	 var userData = {
							 	"user": {
							 		"name": `Caller: ${endUserNumber}`,
							 		"phone": endUserNumber + ""
							 	}
							 };*/
							// **** SWAP IN!!! THIS LOGIC IN PLACE ****


							// IF USER IS NOT FOUND -> screen pop NEW TICKET (3 step process)...
							// 1. create new end user profile..
							// https://developer.zendesk.com/rest_api/docs/core/users#create-user
				/*			zendesk.createUser(userData)
								.then((status, err) => {
									var createdUser = status.user*/
									// grab call info...
									var incomingCall = this.props.mycalls[0].incoming;
									// incoming call -> ID == 45
									// outbound call -> ID == 46
									// via_id property needs to be set per ZD documentation
									var via_id = incomingCall ? 45 : 46;


									// 2. create new ticket w/ prepopulated data
									// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
									zendesk.createNewTicket(endUserNumber, via_id, this.state.myZendeskAgent)
										.then((status, err) => {
											var lastCreatedTicket = status.ticket;
											this.setState({
												createdTicket: lastCreatedTicket
											});


										// 3. open that ticket in an agent's browser...
										// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser
										// otherwise, working version is...
										zendesk.openCreatedTicket(this.state.myZendeskAgent.id, this.state.createdTicket.id)
											.then((status, err) => {
											});
										});
								//});
						}

					});
				/*****SCREEN POP LOGIC END******/

			} // CLOSE BRACKET OF: if (this.state.newCallerFlag == true) {
			
		} // CLOSE BRACKET OF: if (this.props.mycalls.length > 0) {

			    	
	var myqueues = [];

		for(var q = 0; q < this.props.queues.length; q++){

			for(var m = 0; m < this.props.queue_members.length; m++){
					if(this.props.queue_members[m].contactId == this.props.settings.my_pid){
						if(this.props.queues[q].xpid == this.props.queue_members[m].queueId){
									myqueues.push(this.props.queues[q]);


						}
					
				}
			}
		}


	for(var i = 0; i < myqueues.length; i++){
		for(var m = 0; m < this.props.queue_members.length; m++){
				if(this.props.queue_members[m].contactId == this.props.settings.my_pid){
					if(myqueues[i].xpid == this.props.queue_members[m].queueId){
				for(var s = 0; s < this.props.queue_members_status.length; s++){
					if(this.props.queue_members[m].xpid == this.props.queue_members_status[s].xpid){


							if(this.props.queue_members_status[s].status == "login-permanent" || this.props.queue_members_status[s].status == "login"){
								var queue_status = "Logged In";										
							}
							if(this.props.queue_members_status[s].status == "logout"){
								var queue_status = "Logged Out";
								
							}

							myqueues[i].status = queue_status;
							console.log("QUEUENAME",myqueues);


						}
					}
				}
			}
		}
	}

		this.setState({
			myqueues: myqueues
		});
		

  } // CLOSE BRACKET OF: componentWillReceiveProps


	_answerCall(call) {
		// fdp postFeed
		
		for(var i = 0; i < this.props.mycalls.length; i++){
			if(this.props.mycalls[i].xpid != call.xpid){
				fdp.postFeed('mycalls', 'transferToHold', {mycallId: this.props.mycalls[i].xpid});
			}
		}

		fdp.postFeed('mycalls', 'answer', {mycallId: call.xpid});
		
	}

/*	_setQueues(){
		this.setState({
			myqueues: this.state.myqueues
		});
	}*/

  // press enter or green call button to call
  _callNumber(e) {
    // can press enter to call
    if (e && e.key != 'Enter')
      return;
    
    if (this.state.phone != '') {      
      // logic if no other call is already in progress (using this.state.phone as the phone # to dial)

			fdp.postFeed('me', 'callTo', {phoneNumber: this.state.phone});

      this._changeScreen('call');

      // e.target.blur();
    }
  }

  _callRecent(data){
  	fdp.postFeed('me', 'callTo', {phoneNumber: data});
  }

  // change view
  _changeScreen(type = '') {
    this.setState({
      screen: type,
      phone: ''
    });
     if(type == "default"){
     		if(this.props.mycalls.length == 1)
     		client.invoke('resize', { width: '320px', height:"440px" });
     		if(this.props.mycalls.length == 2)
     		client.invoke('resize', { width: '320px', height:"460px" });
     		if(this.props.mycalls.length == 3)
     		client.invoke('resize', { width: '320px', height:"512px" });
 		}
 	if(type == "dialpad:add"){
      		if(this.props.mycalls.length == 1)
     		client.invoke('resize', { width: '320px', height:"462px" });		
     		if(this.props.mycalls.length == 2)
     		client.invoke('resize', { width: '320px', height:"512px" });
     		if(this.props.mycalls.length == 3)
     		client.invoke('resize', { width: '320px', height:"562px" });
 	}
 	 	if(type == "transfer"){
      		if(this.props.mycalls.length == 1)
     		client.invoke('resize', { width: '320px', height:"462px" });
     		if(this.props.mycalls.length == 2)
     		client.invoke('resize', { width: '320px', height:"512px" });
     		if(this.props.mycalls.length == 3)
     		client.invoke('resize', { width: '320px', height:"562px" });
 	}



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

	_endCall(call,ticketNumber) {

		var call_num = call.phone;
		var call_type = call.incoming;
		var start_time = call.created;
		var currentTime = new Date().getTime();
		var duration = (currentTime - call.created);

		if(ticketNumber){
			zendesk.addCallLog(ticketNumber,call_num,call_type,start_time,duration).then((status)=>{

				      this.setState({
				        ticketNumber: ""
				      });
			});
		}
		// hang up current call
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
		fdp.postFeed('mycalls', 'transferTo', {mycallId: call.xpid, toNumber: this.state.phone});
		// clear screen
		this._changeScreen('default');
	}

	_switch(call) {
		if (this.props.mycalls.length < 2)
			this._changeScreen();
		for(var i =0; i<this.props.mycalls.length;i++){
			if((this.props.mycalls[i].xpid != call.xpid) && this.props.mycalls[i].state !== 3){
				fdp.postFeed('mycalls', 'transferToHold', {mycallId: this.props.mycalls[i].xpid});
			}
		}
		
		fdp.postFeed('mycalls', 'transferFromHold', {mycallId: call.xpid});
	}

	_add(mycall) {

		if (mycall.state !== 3){
		fdp.postFeed('mycalls', 'transferToHold', {mycallId: mycall.xpid});
		}
	//this._sendAction('hold', mycall);
		
		this._changeScreen('dialpad:add');
	}

	_openQueue(){
		this._changeScreen('queue');
	}

	_getMyQueues() {
		return {
			queues: mine,
			loggedIn: myLoggedIn
		};
	};

  // handles input event.target.value
  _updateValue(e, property) {
		this.setState({
	      [property]: e.target.value
    	})
  }

  _removeByAttr(arr, attr, value){
    var i = arr.length;
    while(i--){
       if( arr[i] 
           && arr[i].hasOwnProperty(attr) 
           && (arguments.length > 2 && arr[i][attr] === value ) ){ 

           arr.splice(i,1);

       }
    }
    return arr;
}

  
  render() {
    var mycall = this.props.mycalls[0];
    var popup, overlay, body, footer;
    var barCSS = '';

    // [DEFAULT SCREEN - BASIC WINDOW NO CALL] {body} 
		// *****WILL NEED TO ADD NEW RECENT CALLS SECTION TO THE BOTTOM OF THIS VIEW*****
    if (this.props && this.props.mycalls.length == 0 && this.state && this.state.screen == 'default' && this.state.locations &&  this.state.locations[this.state.settings.current_location] && this.state.locations[this.state.settings.current_location].name && this.props.calllog.length >= 0){
      var audioBtn, body, call_style, call_type;
      var formCSS = 'form' + (this.state.focused ? ' focused' : '');
      var callBtnCSS = 'material-icons callbtn' + (this.state.focused  ? ' active' : '');
	var sorted = this.props.calllog.sort(function(a, b) {
        return a.startedAt - b.startedAt;
    });




      body = (
      	<div>
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
                        
            <i className={callBtnCSS} onClick={() => this._callNumber()}>call</i>
          </div>
        </div>
        <div id="recentTitle">RECENT CALLS</div>
        <div id="recentSection">
        		
        
        <ul className="recentList">
		        {

			        	sorted.reverse().slice(0,5).map(items =>{
			        		call_style = 'material-icons ' + ((!items.incoming && !items.missed) ? "call_made" : (!items.incoming && items.missed) ? "call_missed_outgoing" : (items.incoming && !items.missed) ? "call_received" : (items.incoming && items.missed) ? "call_missed" : '');
			        		call_type = ((!items.incoming && !items.missed) ? "call_made" : (!items.incoming && items.missed) ? "call_missed_outgoing" : (items.incoming && !items.missed) ? "call_received" : (items.incoming && items.missed) ? "call_missed" : '');
			        	
			        	return( 
			        		<li className="recentItems" onClick={() => this._callRecent(items.phone)}>
			        		<i className={call_style}>{call_type}</i>
			        		<div className="recentDisplayName">{items.displayName}<br/><p className="displayPhone">{items.phone}</p></div>
			        		<div className="recentTimeAgo">{moment(items.startedAt).startOf().fromNow()}</div>
			        		</li>
			        		)

			        	})
		        	
		        }
        </ul>
        </div>

        </div>
      );


    }

    // [DIAL PAD SCREEN] {body}
    else if (this.state.screen.indexOf('dialpad') != -1) {
			var input, actionBtn;

			var screen = this.state.screen.split(':')[1];
			var title = screen == 'add' ? 'Add Call' : 'Dialpad';
			var input, actionBtn, backBtn;
			var formCSS = 'form' + (this.state.focused ? ' focused' : '');
			
			// not on a call, so dialpad is just a glorified whatever
			if (!mycall || screen) {
				input = (
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
				);
				
				actionBtn = (<i className="material-icons answer" onClick={() => this._callNumber()}>call</i>);
			}

			
			body = (
				<div id="basic">
				<div id="dialpad">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Add Call</span>
					</div>

          <div className="calling">
            <div className={formCSS}>
            <div id="addText">Enter the number or extension you would like to call</div>
              <div className="label">NUMBER/EXTENSION</div>
					{input}
				
			</div>
		</div>	
					
					<div className="buttons">
						
						{actionBtn}
					</div>
				</div>
				</div>
			);

    }

    // STILL NEED TO DO [TRANSFER SCREEN]
		else if (this.state.screen == 'transfer' && mycall && mycall.state != 0) {
      /*  *****FAKE CALL OBJ HARDWIRED IN SO WE CAN SWITCH SCREENS**** */


			// disable buttons based on length of input value
			var disableNum = false;
			var disableVM = false;
			var formCSS = 'form' + (this.state.focused ? ' focused' : '');
			
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
				<div id="basic">
				<div id="transfer">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Transfer</span>
					</div>
					

						
          <div className="calling">
            <div className={formCSS}>
            <div id="addText">Enter the number or extension you would like to call</div>
              <div className="label">NUMBER/EXTENSION</div>
							<input 
								className="number" 
								type="text" 
								value={this.state.phone} 
								onChange={(e) => this._updateValue(e, 'phone')}
								onInput={(e) => this._restrictInput(e)}
		                		onFocus={(e) => this._setFocus(true)}
                				onBlur={(e) => this._setFocus(false)}
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
								onClick={() => this._transfer(mycall)}
							>
								<i className="material-icons">voicemail</i>
								<span className="label">voicemail</span>
							</div>
						</div>
						
						<div className="cancel" onClick={() => this._changeScreen('default')}>cancel</div>
					</div>
				</div>
				</div>
			);
		}

		//MANAGE QUEUES SECTION

else if (this.state.screen == 'queue') {

			
			body = (
				<div id="transfer">
					<div className="banner">
						<i className="material-icons" onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
						<span>Manage Queue Status</span>
					</div>
					<div id="queueBlock">
						<div id="selectAll">
							<input id="allCheckbox" type="checkbox"/><label id="allLabel">Select All</label>
						</div>
					</div>

					<div id="queueContent">
					{
						this.state.myqueues.map(data =>{

							console.log("MYQUEUES STATE",data);
						
							return (
								<div>
								<h3>{data.name}</h3>
								<p>{data.status}</p>
								</div>
								);

						})
					}
					</div>
					

					

						
          
            
				</div>
			);
		}

		// [INCOMING CALL SCREEN]
		else if (this.props.mycalls.length == 1 && this.props.mycalls[0].state === 0){


			var answerBtn;
			
			if (mycall.incoming && mycall.state == 0) {
				// not for carrier location
				if (this.props.locations[mycall.locationId].locationType != 'm')
					answerBtn = (<i className="material-icons answer" onClick={() => this._answerCall(mycall)}>call</i>);
				
				// change color of bottom bar
				barCSS = `type${mycall.type}`;
			}
					
			body = (
				<div id="full">				
					
					<div className="info">
						<div className="name">{mycall.displayName}</div>
            {this._getStatus(mycall)}
						
						<div className="no-controls">


						</div>
						
						<i className="material-icons end" onClick={() => this._endCall(mycall)}>call_end</i>
						
						
						{answerBtn}
					</div>
				</div>
			);
		}

		// [ON CALL SCREEN] (full view) {body}
    else if (this.props.mycalls.length > 0) {

    	     		if(this.props.mycalls.length == 1)
		     		client.invoke('resize', { width: '320px', height:"440px" });
		     		if(this.props.mycalls.length == 2)
		     		client.invoke('resize', { width: '320px', height:"485px" });
		     		if(this.props.mycalls.length == 3)
		     		client.invoke('resize', { width: '320px', height:"535px" });

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
								onClick={() => this._add(mycall)}
								disabled={mycall.state == 0}
								//disabled={disableMute}
							>
								<i className="material-icons">add</i>
								<span className="label">add</span>
							</div>
							
							<div 
								className="button"
								disabled={disableConf || mycall.state == 0}
								onClick={() => this._changeScreen("transfer")}
							>
								<i className="material-icons">phone_forwarded</i>
								<span className="label">transfer</span>
							</div>
							

						</div>

						<div className="associateZendesk">
							<div id="associateText">Associate call with a Zendesk ticket</div>
							<input id="associateTicket" type="text" placeholder="Ticket Number" value={this.state.ticketNumber} onChange={(e) => this._updateValue(e, 'ticketNumber')} />
						</div>
						
						<i className="material-icons end" onClick={() => this._endCall(mycall,this.state.ticketNumber)}>call_end</i>
						
						
						{answerBtn}
					</div>
				</div>
			);


    }

    		// add remaining alerts to bottom of template
		if (this.props.mycalls.length > 1 || (mycall && this.state.screen == 'dialpad:add') || (this.state.screen == 'transfer')) {
			
			if(this.state.screen == "dialpad:add")
			var index = mycall && this.state.screen == 'dialpad:add' ? 0 : 1;

			else if(this.state.screen)
			var index = mycall && this.state.screen == 'transfer' ? 0 : 1;



			footer = (
				<div id="footer">
					{this.props.mycalls.slice(index, this.props.mycalls.length).map((call, key) => {
						var actionBtn;
						
						// on hold
						if (call.state == 3)
							actionBtn = (<i className="material-icons switch" onClick={() => this._switch(call)}>swap_calls</i>);
						else if (call.state == 0)
							actionBtn = (<i className="material-icons answer" onClick={() => this._answerCall(call)}>call</i>);
						
						return (
							<div className={`alert type${call.type}`} key={key}>
								{this._getAvatar(call)}
								<div className="details">
									<div className="name">{call.displayName}</div>
									{this._getStatus(call)}
								</div>

								<div>
									<i className="material-icons end" onClick={() => this._endCall(call)}>call_end</i>
									
									{actionBtn}
								</div>
							</div>
						);
					})}
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
						<img className="agent-login" src="./queue-off.png" onClick={() => this._openQueue()} />
          </div>
        
          <div className="buttons">            
          </div>

          
          <i className="material-icons" onClick={() => this._openPopup('preferences')}>power_settings_new</i>
        </div>
        
        {body}
        {footer}
      </div>
    );


  }
}

