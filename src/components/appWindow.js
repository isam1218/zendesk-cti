import "babel-polyfill";
import "es6-promise/auto";
import React, {Component} from 'react';
import css from '../../style/main.less';
import Popup from './popup.js';
import Timer from './timer.js';
import fdp from './fdp.js';
import zendesk from './zendesk.js';
import LoginWindow from './login.js';
import App from './app.js';

export default class AppWindow extends Component {
    // data requirements
    /*  static propTypes = {
     locations: React.PropTypes.object.isRequired,
     settings: React.PropTypes.object.isRequired,
     avatars: React.PropTypes.object.isRequired,
     mycalls: React.PropTypes.array.isRequired
     }*/

    constructor(props) {
        super(props);
        // this.state.phone is the phone # dialed into form input
        fdp.checkMaster();
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
            isChecked: false,
            disableButton: true,
            isDisplayAssociatedTicketsChecked: true,
            isCreateNewTicketChecked: true,
            callObj: []
        }

        localStorage.newCallerFlag = true;
    }


    componentDidMount() {


        if (this.state.screen == "default" || this.state.screen == "settings" ) {
            window.addEventListener('storage', (e) => {



                if (e.key == "ticketPhone") {

                    if (e.newValue != ("null" || null)) {
                        this.setState({
                            phone: e.newValue
                        })
                        this.setState({
                            focused: true
                        })
                    }
                    else {
                        this.setState({
                            phone: ""
                        })
                        this.setState({
                            focused: false
                        })
                    }
                }else if(e.key == "preferences"){
                	if (e.newValue != ("null" || null)) {
                	
                    var preferences = JSON.parse(e.newValue);

                    this.state.isDisplayAssociatedTicketsChecked = preferences.isDisplayAssociatedTicketsChecked;
                    this.state.isCreateNewTicketChecked = preferences.isCreateNewTicketChecked;

                    
                	}
                }
                //localStorage.removeItem("ticketPhone");
            });
        }

        window.addEventListener('focus', (e) => {
           /* setTimeout(() => {
                this._getQueues()
            }, 1000);*/

            this._getQueues();
        });

	  fdp.emitter.addListener('data_sync_update', (data) => {
		  	/*if(data['queues']){
		  		setTimeout(()=>{this._getQueues()},1000);
		  	}
		  	if(data['queue_members_status']){
		  		setTimeout(()=>{this._getQueues()},1000);
		  	}
		  	if(data['queue_members']){
		  		setTimeout(()=>{this._getQueues()},1000);
		  	}*/
		  	if(data["mycalls"]){
                
		  			for(var i = 0; i < data["mycalls"].length;i++){
				  		if(data["mycalls"][i].state == 2 && data["mycalls"][i].holdAction != "hold"){
				  			this._screenPop(data["mycalls"][i]);
				  		}
				  		if(data["mycalls"][i].xef001type == "delete"){
				  					this._callEnded(data["mycalls"][i]);
                                    console.log("DELETE MYCALLS",data["mycalls"][i]);
				  		}
			  		}



		  	}
	
	  });


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
  	



		
		// when call ends, return user to default screen, and set newCallerFlag back to true...
		
		if (this.props.mycalls.length == 0){
			/*if(localStorage.queueScreen != 'queue'){
				this.setState({
					screen: 'default'
				})
			}
			else{
				this.setState({
					screen: 'queue'
				})
			}
*/
			
		}

        if (this.state.screen == "default") {
            localStorage.queueScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "440px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "460px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "512px"});
        }
        else if (this.state.screen == "dialpad:add") {
            localStorage.queueScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "495px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "545px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "595px"});
        }
        else if (this.state.screen == "transfer") {
            localStorage.queueScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "495px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "545px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "595px"});
        }


        // if user mutes thru hudn softphone, need to change mute button anyways
        if (this.props.settings.hudmw_webphone_mic == "0") {
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


    } // CLOSE BRACKET OF: componentWillReceiveProps

_callEnded(endedCall){
	var focusedCall = true;

	for(var i = 0; i < this.props.mycalls.length; i++){
		if(this.props.mycalls[i].state == 2 && this.props.mycalls[i].xpid != endedCall.xpid){

			focusedCall = false;
		}
		else{

			focusedCall = true;
		}
	}
		if(focusedCall){

    	if(this.props.deletedCalls){

    	for(var d = 0; d < this.props.deletedCalls.length; d++){

	    	if(this.props.deletedCalls[this.props.deletedCalls.length - 1].xef001type == 'delete'){
	    		if((this.props.deletedCalls[this.props.deletedCalls.length - 1].xpid == this.props.deletedCalls[d].xpid) && (this.props.deletedCalls[d].xef001type != 'delete')){

	    			var callEnded = this.props.deletedCalls[d];
                    console.log("CALL ENDED",callEnded);
	    			if(callEnded){
	    					var call_num = "";
							var call_type = "";
							var start_time = "";
							var currentTime = "";
							var duration = "";

	    					 call_num = callEnded.phone;
							 call_type = callEnded.incoming;
							 start_time = callEnded.created;
							 currentTime = new Date().getTime();
							 duration = (parseInt(currentTime) - parseInt(callEnded.created));
							duration.toString();
					localStorage.getItem("ticketNumber");
					if(localStorage.ticketNumber && localStorage.ticketNumber.length > 0){
					zendesk.addCallLog(localStorage.ticketNumber,call_num,call_type,start_time,duration).then((status)=>{
                        console.log("CALLLOG",status);
							


					});
					}

                        localStorage.removeItem("ticketNumber");

                             callEnded = "";
                             call_num = "";
                             call_type = "";
                             start_time = "";
                             currentTime = "";
                             duration = "";
                             if(this.props.mycalls.length == 0){
                                fdp.clearCalls();
                             }
				}
	    		}

	    	}

    	}
    }
}

}

    _screenPop(call) { //todo: call is a number

        if ((call.incoming) && (call.state == 2) && (call.state != 3) && (call.displayName !== "Call menu" && call.displayName !== "system")) {

            var endUserCallNumber = call.phone;
            var endUserNumber = endUserCallNumber.replace(/[\s()-]+/gi, '');

            // set newCallerFlag to false since we have a new call...
            if (localStorage.newCallerFlag == "true") {
                localStorage.newCallerFlag = false;

                /***** SCREEN POP LOGIC START ******/
                // grab call object and link to end user...

                if (endUserNumber.length > 4 || endUserNumber == "") {
                    zendesk.grabCallId(endUserNumber)
                        .then((status, err) => {

                            // set the end user profile object
                            var otherCallerEndUser = status.users[0];


                            // if end user is found -> scren pop end user profile...
                            if (status.users.length > 0 && endUserNumber != "") { //todo:
                                // screen pop the end user..
                                if( !this.state.isDisplayAssociatedTicketsChecked ){
                                    //console.debug( "!!! _screenPop DO NOT Display Associated Tickets =", this.state.isDisplayAssociatedTicketsChecked );

                                }else if (this.state.myZendeskAgent.id && otherCallerEndUser.id) {

                                    //console.debug( "!!! _screenPop DISPLAY Associated Tickets =", this.state.isDisplayAssociatedTicketsChecked );

                                    zendesk.profilePop(this.state.myZendeskAgent.id, otherCallerEndUser.id)
                                        .then((status, err) => {
                                        });
                                }
                            }

                            // NO MATCH OF END USERS, create a user w/ random phone number (for now)...
                            else if( this.state.isCreateNewTicketChecked )  {
                                //console.debug( "!!! _screenPop creating NEW ticket =", this.state.isCreateNewTicketChecked );


                                // IF USER IS NOT FOUND -> screen pop NEW TICKET (3 step process)...
                                // 1. create new end user profile..
                                // https://developer.zendesk.com/rest_api/docs/core/users#create-user

                                // grab call info...
                                var incomingCall = call.incoming;
                                // incoming call -> ID == 45
                                // outbound call -> ID == 46
                                // via_id property needs to be set per ZD documentation
                                var via_id = incomingCall ? 45 : 46;


                                // 2. create new ticket w/ prepopulated data
                                // https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets
                                zendesk.createNewTicket(endUserNumber, via_id, this.state.myZendeskAgent)
                                    .then((status, err) => {
                                        var lastCreatedTicket = status.ticket;

                                        var createdTicket = lastCreatedTicket;


                                        // 3. open that ticket in an agent's browser...
                                        // https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser
                                        // otherwise, working version is...
                                        zendesk.openCreatedTicket(this.state.myZendeskAgent.id, createdTicket.id)
                                            .then((status, err) => {
                                            });
                                    });
                            }else{
                                //console.debug( "!!! _screenPop DO NOT create new ticket =", this.state.isCreateNewTicketChecked );
                            }
                        });
                }
                /*****SCREEN POP LOGIC END******/

            } // CLOSE BRACKET OF: if (this.state.newCallerFlag == true) {

            // CLOSE BRACKET OF: if (this.props.mycalls.length > 0) {
        }

    }

	_answerCall(call) {
		// fdp postFeed
		localStorage.newCallerFlag = true;

		for(var i = 0; i < this.props.mycalls.length; i++){
			if((this.props.mycalls[i].xpid != call.xpid) && this.props.mycalls[i].state != 3){
				fdp.postFeed('mycalls', 'transferToHold', {mycallId: this.props.mycalls[i].xpid}).then((status)=>{
					
			}).catch((err)=>{

                });
            }
        }

		fdp.postFeed('mycalls', 'answer', {mycallId: call.xpid}).then((status)=>{

		
		localStorage.removeItem("ticketNumber");

		}).catch((err)=>{

		});
		
	}




    // press enter or green call button to call
    _callNumber(e) {
        // can press enter to call
        if (e && e.key != 'Enter')
            return;

        if (this.state.phone != '') {
            // logic if no other call is already in progress (using this.state.phone as the phone # to dial)

            fdp.postFeed('me', 'callTo', {phoneNumber: this.state.phone}).then((status) => {

            }).catch((err) => {

            });

            if (this.props.mycalls.length > 0) {
                this._changeScreen('call');
            }


            // e.target.blur();
        }
    }

    _callRecent(data) {
        fdp.postFeed('me', 'callTo', {phoneNumber: data}).then((status) => {

        }).catch((err) => {

        });
    }

    // change view
    _changeScreen(type = '') {
        this.setState({
            screen: type,
            phone: ''
        });
        if (type == "default") {
            localStorage.queueScreen = "";
            localStorage.settingScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "440px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "460px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "512px"});
        }
        else if (type == "dialpad:add") {
            localStorage.queueScreen = "";
            localStorage.settingScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "495px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "545px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "595px"});
        }
        else if (type == "transfer") {
            localStorage.queueScreen = "";
            localStorage.settingScreen = "";
            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "495px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "545px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "595px"});
        }
        else if (type == "queue") {
            localStorage.queueScreen = "queue";
            localStorage.settingScreen = "";
            client.invoke('resize', {width: '320px', height: "440px"});

        }
        else if (type == "settings") {
            localStorage.settingScreen = "settings";
            localStorage.queueScreen = "";
            client.invoke('resize', {width: '320px', height: "440px"});


           if( localStorage.preferences === undefined ){
                var preferences = { isDisplayAssociatedTicketsChecked: this.state.isDisplayAssociatedTicketsChecked,
                                    isCreateNewTicketChecked: this.state.isCreateNewTicketChecked};
                localStorage.setItem('preferences', JSON.stringify(preferences));
           }else{
               preferences = JSON.parse(localStorage.getItem("preferences"));

               this.state.isDisplayAssociatedTicketsChecked = preferences.isDisplayAssociatedTicketsChecked;
               this.state.isCreateNewTicketChecked = preferences.isCreateNewTicketChecked;
           }
        }
    }

    // [DIALPAD SCREEN]
    // placeholder for dtmf - just updating this.state.phone w/ phone # to ultimately dial
    _dial(digit, skip) {
        if (!skip) {
            this.setState({
                phone: this.state.phone + digit
            });
        }
    }

	_endCall(call) {


		// hang up current call
		// fdp post request to end call
		fdp.postFeed('mycalls', 'hangup', {mycallId: call.xpid}).then((status)=>{
				
			}).catch((err)=>{

        });
        // change screen back to default
        this._changeScreen('default');
    }

    _formatPhoneNumber(number) {
        var regStr = /^(9-|91-|1-)/;
        if (number.indexOf('@') != -1) {
            var start = number.substring(0, number.indexOf('@') + 2);
            number = number.substring(number.indexOf('@') + 2);
            return start + number.replace(regStr, '');
        }
        else {
            return number.replace(regStr, '');
        }
    }

    // get avatar of person calling in (for [CALL SCREEN])
    _getAvatar(call) {
        // internal user
        if (call.contactId) {
            // avatar image
            if (this.props.avatars[call.contactId]) {
                return (<img className="avatar" src={this.props.avatars[call.contactId]}/>);
            }
            // initials
            else {
                var split = call.displayName.split(' ');
                var fName = split[0].charAt(0);
                var lName = '';

                if (split.length > 1)
                    lName = split[split.length - 1].charAt(0);

                return (
                    <div className="avatar">
                        <div className="initials">{fName + lName}</div>
                    </div>
                );
            }
        }
        // unknown
        else {
            return (<img className="avatar" src="./generic-avatar.png"/>);
        }
    }

    // part of [CALL SCREEN]
    _getStatus(call) {
        // change text of call status based on state/type
        switch (call.state) {
            case 3:
                return (
                    <div className="status">
                        On hold for (<Timer start={call.holdStart}/>)
                    </div>
                );

                break;
            case 2:
                return (
                    <div className="status">
                        On call for (<Timer start={call.created}/>)
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

        localStorage.newCallerFlag = false;
        // if call is not on hold
        if (call.state !== 3) {
            // fdp request to hold call...
            fdp.postFeed('mycalls', 'transferToHold', {mycallId: call.xpid}).then((status) => {

            }).catch((err) => {

            });
        } else if (call.state === 3) {
            fdp.postFeed('mycalls', 'transferFromHold', {
                mycallId: call.xpid,
                toContactId: this.props.settings.my_pid
            }).then((status) => {

            }).catch((err) => {

            });
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
        switch (action) {
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
        if (this.props.locations[this.props.settings['current_location']].locationType == 'w') {
            // if not muted -> MUTE...
            if (this.props.settings.hudmw_webphone_mic != "0") {
                // save current volume for later use when unmuting...
                localStorage.hudmw_webphone_mic = this.props.settings.hudmw_webphone_mic;
                // set volume to 0
                data = {'name': 'hudmw_webphone_mic', value: 0};
                fdp.postFeed('settings', 'update', data).then((status) => {

                }).catch((err) => {

                });
                this.setState({
                    mute: true
                });
            } else if (this.state.mute == true) {
                // else if already muted -> UNMUTE...
                // default to .5 if no saved LS value
                localStorage.hudmw_webphone_mic = localStorage.hudmw_webphone_mic ? localStorage.hudmw_webphone_mic : .5;
                data = {'name': 'hudmw_webphone_mic', 'value': localStorage.hudmw_webphone_mic};
                fdp.postFeed('settings', 'update', data).then((status) => {

                }).catch((err) => {

                });
                this.setState({
                    mute: false,
                })
            }
        } else if (this.props.locations[this.props.settings['current_location']].locationType == 'o') {
            // if office phone different API call for mute?
        } else {
            // if mobile diff API call for mute?
        }
    }

    _transfer(call, isVM) {
        var number = "";
        if (isVM && this.state.phone.indexOf('*86') != 0) {
            number = '*86' + this.state.phone;
        }
        else {
            number = this.state.phone;
        }
        // call FDP API to transfer call (either regular or to VM transfer)
        fdp.postFeed('mycalls', 'transferTo', {mycallId: call.xpid, toNumber: number}).then((status) => {

        }).catch((err) => {

        });
        // clear screen
        this._changeScreen('default');
    }

	_switch(call) {
		localStorage.newCallerFlag = false;
		localStorage.removeItem("ticketNumber");


		if (this.props.mycalls.length < 2)
			this._changeScreen();
		for(var i =0; i<this.props.mycalls.length;i++){
			if((this.props.mycalls[i].xpid != call.xpid) && this.props.mycalls[i].state !== 3){
				fdp.postFeed('mycalls', 'transferToHold', {mycallId: this.props.mycalls[i].xpid}).then((status)=>{


			}).catch((err)=>{

			});
			}
		}
		
		fdp.postFeed('mycalls', 'transferFromHold', {mycallId: call.xpid}).then((status)=>{
				

			}).catch((err)=>{

        });
    }

    _add(mycall) {
        localStorage.newCallerFlag = false;

        if (mycall.state !== 3) {
            fdp.postFeed('mycalls', 'transferToHold', {mycallId: mycall.xpid}).then((status) => {

            }).catch((err) => {

            });
        }
        //this._sendAction('hold', mycall);

        this._changeScreen('dialpad:add');
    }

    _openQueue() {

        var message = "Looks like you are not part of any queues. Please contact your administrator if you wish to be added to queues and use this feature.";
        if (localStorage.myqueues != undefined && localStorage.myqueues != "") {
            this._changeScreen('queue');
        }
        else {

            client.invoke('notify', message, "error", 5000);
        }
    }


    _openPreferences() {
        this._changeScreen('settings');
    }

    _settingsSave() {

        var preferences = { isDisplayAssociatedTicketsChecked: this.state.isDisplayAssociatedTicketsChecked,
            isCreateNewTicketChecked: this.state.isCreateNewTicketChecked};

        localStorage.setItem('preferences', JSON.stringify(preferences));
        this._changeScreen('default');
    }

    _settingsSelect(event, propertyName) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;

        var obj = {};
        obj[propertyName] = value;
        this.setState(obj);
    }

    _queueSelect(event, queue, myqueues) {
        const target = event.target;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        const name = target.name;

        var queue = queue;
        var myqueue = myqueue;
        var match = 0;
        for (var i = 0; i < myqueues.length; i++) {

            if (queue != "checkAll") {
                if (queue.xpid == myqueues[i].xpid) {
                    myqueues[i].checkStatus = value;
                }
                if (myqueues[i].checkStatus == true) {
                    match++;
                }
            }
            else if (myqueues[i].status != "Permanently Logged In") {

                myqueues[i].checkStatus = value;

                if (myqueues[i].checkStatus == true) {
                    match++;
                }
            }
        }

        if (match > 0) {
            this.setState({
                disableButton: false
            })
        }
        else {
            this.setState({
                disableButton: true
            })
        }


        /*this.setState({
            myqueues: myqueues
        })*/
localStorage.setItem("myqueues",JSON.stringify(myqueues));
    }


    _loginQueues(queues) {
        var data = {};
        var toSend = [];
        for (var q = 0; q < queues.length; q++) {
            if (queues[q].checkStatus == true) {
                toSend.push(queues[q].xpid);

            }
        }
        data.contactId = this.props.settings.my_pid;
        data.queues = toSend.join(",");


        fdp.postFeed("queues", "queueLogin", data).then((status) => {
            if (status == 1) {
                this._getQueues();
                this._clearCheckbox();
            }
        }).catch((err) => {

        });

    }

    _clearCheckbox(){
    	document.getElementById("allCheckbox").checked = false;
    }

    _getQueues() {


        var myqueues = [];

        for (var q = 0; q < this.props.queues.length; q++) {

            for (var m = 0; m < this.props.queue_members.length; m++) {
                if (this.props.queue_members[m].contactId == this.props.settings.my_pid) {
                    if (this.props.queues[q].xef001type != "delete" && this.props.queues[q].xpid == this.props.queue_members[m].queueId) {
                       // console.debug( "this.props.queues[q]",  this.props.queues[q] );

                        myqueues.push(this.props.queues[q]);

                    }

                }
            }
        }


        for (var i = 0; i < myqueues.length; i++) {
            for (var m = 0; m < this.props.queue_members.length; m++) {
                if (this.props.queue_members[m].contactId == this.props.settings.my_pid) {
                    if (myqueues[i].xpid == this.props.queue_members[m].queueId) {
                        for (var s = 0; s < this.props.queue_members_status.length; s++) {
                            if (this.props.queue_members[m].xpid == this.props.queue_members_status[s].xpid) {

                                if (this.props.queue_members_status[s].status == "login") {
                                    var queue_status = "Logged In";
                                    var disableQueue = false;
                                }
                                if (this.props.queue_members_status[s].status == "logout") {
                                    var queue_status = "Logged Out";
                                    var disableQueue = false;
                                }
                                if (this.props.queue_members_status[s].status == "login-permanent") {
                                    var queue_status = "Permanently Logged In";
                                    var disableQueue = true;
                                }
                                myqueues[i].status = queue_status;
                                myqueues[i].disableQueue = disableQueue;
                            }
                        }
                    }
                }
            }

            //console.debug( "myqueues =", myqueues);

           /* this.setState({
                myqueues: myqueues
            });*/
            localStorage.setItem("myqueues",JSON.stringify(myqueues));
        }


        var match = 0;
        for (var i = 0; i < myqueues.length; i++) {

            if (myqueues[i].checkStatus == true) {
                match++;
            }
        }

        if (match > 0) {
            this.setState({
                disableButton: false
            })
        }
        else {
            this.setState({
                disableButton: true
            })
        }


    }


    _logout() {

        this.props.logout();
        fdp.logout();


    }

  // handles input event.target.value
  _updateValue(e, property) {


		this.setState({
	      [property]: e.target.value
    	})

  }

  _updateTicket(e,property){
        this.setState({
          [property]: e.target.value
        })

        localStorage.setItem("ticketNumber",e.target.value);
  }

  _clearTicketNumber(){

  	localStorage.removeItem("ticketNumber");
  }

    _removeByAttr(arr, attr, value) {
        var i = arr.length;
        while (i--) {
            if (arr[i]
                && arr[i].hasOwnProperty(attr)
                && (arguments.length > 2 && arr[i][attr] === value )) {

                arr.splice(i, 1);

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
        if (this.props && this.props.mycalls.length == 0 && this.state && this.state.screen == 'default' && this.props.locations && this.props.locations[this.props.settings.current_location] && this.props.locations[this.props.settings.current_location].name && this.props.calllog.length >= 0) {
            var audioBtn, body, call_style, call_type;
            var formCSS = 'form' + (this.state.focused ? ' focused' : '');
            var callBtnCSS = 'material-icons callbtn' + (this.state.focused ? ' active' : '');
            var sorted = this.props.calllog.sort(function (a, b) {
                return a.startedAt - b.startedAt;
            });
            
        

            client.invoke('resize', {width: '320px', height: "440px"});


            body = (
                <div>
                    <div id="basic">

                        <div className="location">
                            <span>Location:</span>
                            <span
                                className={"my_location " + this.props.locations[this.props.settings.current_location].status.deviceStatus}
                                onClick={this.props.settings.chat_status != 'offline' ? () => this._openPopup('location') : ''}>
              {this.props.locations[this.props.settings.current_location].name}
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
                        {(() => {

                        
                            
                            	if(sorted.length > 0){
                            		return(
                                sorted.reverse().slice(0, 5).map(items => {
                                	
                                    
                                        call_style = 'material-icons ' + ((!items.incoming && !items.missed) ? "call_made" : (!items.incoming && items.missed) ? "call_missed_outgoing" : (items.incoming && !items.missed) ? "call_received" : (items.incoming && items.missed) ? "call_missed" : '');
                                        call_type = ((!items.incoming && !items.missed) ? "call_made" : (!items.incoming && items.missed) ? "call_missed_outgoing" : (items.incoming && !items.missed) ? "call_received" : (items.incoming && items.missed) ? "call_missed" : '');

                                        return (
                                            <li className="recentItems" onClick={() => this._callRecent(items.phone)}>
                                                <i className={call_style}>{call_type}</i>
                                                <img className="returnCall" src="./returnCall.png"/>
                                                <div
                                                    className="recentDisplayName">{this._formatPhoneNumber(items.displayName)}<br/>
                                                    <p className="displayPhone">{items.phone}</p></div>
                                                <div
                                                    className="recentTimeAgo">{moment(items.startedAt).startOf().fromNow()}</div>
                                            </li>
                                        )
                                    
                                    

                                })
								)
								}
								else{
									return <div className="noRecents">No recent calls</div>;
								}

                            })()}
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
                if (num.length >= 10 || num == 0 || num == 911 || num == 311 || num == 411 || num == 8555 || (num >= 8500 && num <= 8520) || (num >= 9000 && num <= 9050))
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
                                    onClick={() => this._transfer(mycall, true)}
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
            localStorage.queueScreen = "queue";

            body = (
                <div id="transfer">
                    <div className="banner">
                        <i className="material-icons"
                           onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
                        <span>Manage Queue Status</span>
                    </div>
                    <div id="queueBlock">
                        <div id="selectAll">
                            <input id="allCheckbox" type="checkbox"
                                   onChange={(e) => this._queueSelect(e, "checkAll", JSON.parse(localStorage.myqueues))}/><label
                            id="allLabel">Select All</label>
                        </div>
                    </div>

                    <div id="queueContent">
                        {

                            JSON.parse(localStorage.myqueues).map(data => {

                                return (
                                    <div className="myQueueList">
                                        <input className="queueCheckbox" type="checkbox" disabled={data.disableQueue}
                                               checked={data.checkStatus}
                                               onChange={(e) => this._queueSelect(e, data, JSON.parse(localStorage.myqueues))}/>
                                        <div className={"queueTitle " + data.disableQueue}>{data.name}</div>
                                        <p className={"queueStatus " + data.disableQueue}>{data.status}</p>

                                    </div>
                                );

                            })
                        }
                    </div>
                    <div className="queueBtns">

                        <button className={"queueLogin " + this.state.disableButton} disabled={this.state.disableButton}
                                onClick={() => this._loginQueues(JSON.parse(localStorage.myqueues))}>LOG IN
                        </button>

                        <button className={"queueLogout " + this.state.disableButton}
                                disabled={this.state.disableButton}
                                onClick={() => this._openPopup('logoutreasons', JSON.parse(localStorage.myqueues))}>LOG OUT
                        </button>
                    </div>
                </div>
            );
        }
        else if (this.state.screen == 'settings') {
            localStorage.settingScreen = 'settings';

            body = (
                <div id="transfer">
                    <div className="banner">
                        <i className="material-icons"
                           onClick={() => this._changeScreen('default')}>keyboard_arrow_left</i>
                        <span>PREFERENCES</span>
                    </div>

                    <div id="queueBlock">
                    </div>

                    <div id="queueContent">

                        <div className="myQueueList">
                            <input className="queueCheckbox" type="checkbox"
                                   checked={this.state.isDisplayAssociatedTicketsChecked}
                                   onChange={(e) => this._settingsSelect(e, "isDisplayAssociatedTicketsChecked")}/>
                            <div className="queueTitle">Display Associated Tickets</div>
                            <p className="settingsInfo">Display tickets on inbound calls that are associated with the caller/user.</p>
                        </div>

                        <div className="myQueueList">
                            <input className="queueCheckbox" type="checkbox"
                                   checked={this.state.isCreateNewTicketChecked}
                                   onChange={(e) => this._settingsSelect(e, "isCreateNewTicketChecked")}/>
                            <div className="queueTitle">Create New Ticket</div>
                            <p className="settingsInfo">Create new ticket on inbound calls when caller/user is unknown</p>
                        </div>

                    </div>

                    <div className="queueBtns">

                        <button className={"settingsBtn true"}
                                onClick={() => this._changeScreen('default')}>CANCEL
                        </button>

                        <button className={"settingsBtn"}
                                onClick={() => this._settingsSave()}>SAVE
                        </button>

                    </div>

                    {/*{
                     this.state.myqueues.map(data => { return (
                     <div className="settingsList">
                     <input className="settingsCheckbox" type="checkbox" disabled={data.disableQueue}
                     checked={data.checkStatus}
                     onChange={(e) => this._queueSelect(e, data, this.state.settings)}/>
                     <div className={"settingsTitle " + data.disableSettings}>{data.name}</div>
                     <p className={"settingsStatus " + data.disableSettings}>{data.status}</p>

                     </div>
                     );

                     })
                     }*/}

                    {/*
                     <div id="queueBlock">
                     <div id="selectAll">
                     <input id="allCheckbox" type="checkbox"
                     onChange={(e) => this._queueSelect(e, "checkAll", this.state.myqueues)}/><label
                     id="allLabel">Select All</label>
                     </div>
                     </div>

                     <div id="queueContent">
                     {
                     this.state.myqueues.map(data => {


                     return (
                     <div className="myQueueList">
                     <input className="queueCheckbox" type="checkbox" disabled={data.disableQueue}
                     checked={data.checkStatus}
                     onChange={(e) => this._queueSelect(e, data, this.state.myqueues)}/>
                     <div className={"queueTitle " + data.disableQueue}>{data.name}</div>
                     <p className={"queueStatus " + data.disableQueue}>{data.status}</p>

                     </div>
                     );

                     })
                     }
                     </div>
                     <div className="queueBtns">

                     <button className={"queueLogin " + this.state.disableButton} disabled={this.state.disableButton}
                     onClick={() => this._loginQueues(this.state.myqueues)}>LOG IN
                     </button>
                     <button className={"queueLogout " + this.state.disableButton}
                     disabled={this.state.disableButton}
                     onClick={() => this._openPopup('logoutreasons', this.state.myqueues)}>LOG OUT
                     </button>

                     </div>*/}
                </div>
            );

        }
        // [INCOMING CALL SCREEN]
        else if (this.props.mycalls.length == 1 && this.props.mycalls[0].state === 0) {


            var answerBtn;

            if (mycall.incoming && mycall.state == 0) {
                // not for carrier location
                //if (this.props.locations[mycall.locationId].locationType != 'm'){
                    answerBtn = (<i className="material-icons answer" onClick={() => this._answerCall(mycall)}>call</i>);
                    //}
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

            if (this.props.mycalls.length == 1)
                client.invoke('resize', {width: '320px', height: "440px"});
            if (this.props.mycalls.length == 2)
                client.invoke('resize', {width: '320px', height: "490px"});
            if (this.props.mycalls.length == 3)
                client.invoke('resize', {width: '320px', height: "540px"});


            var answerBtn, muteBtn;

            var audioBtnCSS = 'material-icons';
            var moveBtnCSS = 'material-icons';
            var holdBtnCSS = 'material-icons';

            // disable certain buttons based on context
            var disableConf = mycall.type == 0 ? true : false;
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
                    answerBtn = (
                        <i className="material-icons answer" onClick={() => this._answerCall(mycall)}>call</i>);

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
							<input id="associateTicket" type="text" placeholder="Ticket Number" value={localStorage.ticketNumber} onFocus={()=>this._clearTicketNumber()} onChange={(e) => this._updateTicket(e, 'ticketNumber')} />
						</div>

						<i className="material-icons end" onClick={() => this._endCall(mycall)}>call_end</i>
						
						
						{answerBtn}
					</div>
				</div>
			);


        }

        // add remaining alerts to bottom of template
        if ((this.props.mycalls.length > 1 || (mycall && this.state.screen == 'dialpad:add') || (this.state.screen == 'transfer')) && this.state.screen != "queue") {

            if (this.state.screen == "dialpad:add")
                var index = mycall && this.state.screen == 'dialpad:add' ? 0 : 1;

            else if (this.state.screen)
                var index = mycall && this.state.screen == 'transfer' ? 0 : 1;


            footer = (
                <div id="footer">
                    {this.props.mycalls.slice(index, this.props.mycalls.length).map((call, key) => {
                        var actionBtn;

                        // on hold
                        if (call.state == 3)
                            actionBtn = (
                                <i className="material-icons switch" onClick={() => this._switch(call)}>swap_calls</i>);
                        else if (call.state == 0)
                            actionBtn = (
                                <i className="material-icons answer" onClick={() => this._answerCall(call)}>call</i>);

                        return (
                            <div className={`alert type${call.type}`} key={key}>

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
                    myqueues={localStorage.myqueues}
                    getQueues={() => this._getQueues()}
                    clearSelect={()=> this._clearCheckbox()}
                />
            );

            overlay = (<div className="overlay"></div>);
        }
        var queueCount = 0;
        var queueIcon;
        var myqueues;

        if (localStorage.myqueues != undefined && localStorage.myqueues != "") {
        	myqueues = JSON.parse(localStorage.myqueues);
            for (var q = 0; q < myqueues.length; q++) {
                if (myqueues[q].status == "Logged In" || myqueues[q].status == "Permanently Logged In") {
                    queueCount = parseInt(queueCount) + 1;
                }
            }
        }

        if (queueCount > 0) {
            queueIcon = "./queue-on.png";
        }
        else {
            queueIcon = "./queue-off.png";
        }

        // RENDER COMPONENTS TOGETHER:
        return (
            <div id="app" onClick={popup ? () => this._openPopup(null) : ''} onLoad={() => this._getQueues()}>
                {overlay}
                {popup}
                <div id="header">
                    <div>
                        <div ></div>
                        <img className="agent-login" src={queueIcon} onClick={() => this._openQueue()}/>
                    </div>

                    <div className="buttons">
                    </div>

                    <i className="material-icons settings" onClick={() => this._openPreferences()}>settings</i>
                    <br/>
                    <i className="material-icons" onClick={() => this._logout()}>power_settings_new</i>
                </div>

                {body}
                {footer}
            </div>
        );
    }
}

