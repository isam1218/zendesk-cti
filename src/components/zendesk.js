import $ from 'jquery';
import config from '../config.js';

// http://stackoverflow.com/questions/5507234/how-to-use-basic-auth-with-jquery-and-ajax
// xhr.setRequestHeader("Authorization", "Bearer " + `${config.accessToken}`);
const zendesk = {


	grabMyAgentObj() {
		// https://developer.zendesk.com/rest_api/docs/core/users#show-the-currently-authenticated-user
		var fetchSelf = {
		  url: '/api/v2/users/me.json',
		  type: 'GET',
		  dataType: 'json'
		};
		return new Promise((resolve, reject) => {
		client.request(fetchSelf).then(data => {
			  resolve(data);
			});
		});

	},

	profilePop(agent, user) {
		// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-users-profile-in-an-agents-browser

		var grabProfile = {
		  url: `/api/v2/channels/voice/agents/${agent}/users/${user}/display.json`,
		  type: 'POST',
		  contentType: 'text/plain',
		  dataType: 'text'
		};
		return new Promise((resolve, reject) => {

			client.request(grabProfile).then(data=>{
				resolve(data);
			});
		});
	},

	grabCallId(phoneNumber) {
		// https://developer.zendesk.com/rest_api/docs/core/search#search

		var grabCall = {
		  url: `/api/v2/users/search.json?query=*${phoneNumber}`,
		  type: 'GET',
		  contentType: 'application/json',
		};
		return new Promise((resolve, reject) => {
			client.request(grabCall).then(data =>{
				resolve(data);
				console.log("GRAB CALL ID DATA",data);
			});
		});
	},

  createUser(userData) {
		// https://developer.zendesk.com/rest_api/docs/core/users#create-user

		var data = JSON.stringify(userData);
		var createUser = {
		  url: '/api/v2/users.json',
		  type: 'POST',
		  contentType: 'application/json',
		  data: data
		};
		return new Promise((resolve, reject) => {
		client.request(createUser).then(user => {
			  console.log("DATA",user);
			  resolve(user);
			});
		});
  },

	createNewTicket(endUser, via_id, meAgent) {
		//https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#creating-tickets

				var data = {
			"display_to_agent": meAgent.id,
			"ticket": {
				"via_id": via_id,
				"created_at": endUser.created_at,
				"requester_id": endUser.id,
				"submitter_id": meAgent.id,
				"description": `New ticket for new end user created. Origin phone number is: ${endUser.phone}`,
				"requester": {
					"name": endUser.name,
					"phone": endUser.phone
				},
				"custom_fields": [
					{
						"id": 22060945,
						"value": endUser.phone
					}
				]
			}
		};

		var ticketData = JSON.stringify(data);

		var createNewTicket = {
		  url: '/api/v2/channels/voice/tickets.json',
		  type: 'POST',
		  contentType: 'application/json',
		  data: ticketData
		};
		return new Promise((resolve, reject) => {
		client.request(createNewTicket).then(data => {

			  resolve(data);
			});
		});

	},

	openCreatedTicket(myAgentId, ticketId) {
		// https://developer.zendesk.com/rest_api/docs/voice-api/talk_partner_edition#open-a-ticket-in-an-agents-browser	

		var openCreatedTicket = {
		  url: '/api/v2/channels/voice/agents/'+myAgentId+'/tickets/'+ticketId+'/display.json',
		  type: 'POST',
		  contentType: 'text/plain',
		  dataType: 'text'
		};
		return new Promise((resolve, reject) => {
		client.request(openCreatedTicket).then(data => {
			  console.log("DATA",data);
			  resolve(data);
			});
		});
	},
	getUser(id){
		var url = "users/"+id+".json";
		var settings = this.defaultRequestConfig(url, "GET");
		settings.contentType = "text/plain";
		settings.dataType = "text";
				return new Promise((resolve, reject) => {
			$.ajax(settings).done((res) => {
				 console.log('USER DATA SUCCESS', res);
				resolve(res);
			}).fail((res,err,body) => {
				console.log('zd: get user fail - res -', res);
				console.log('err - ', err);
				console.log('body - ', body);
				resolve(res,err,body);
			});	

		});
	}

}

export default zendesk;