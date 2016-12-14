var fdp = new FDP();

ReactDOM.render(React.createElement(LoginWindow, null), document.getElementById('body'));
	


	function login(username,password){

	return new Promise((resolve, reject) => {

		fdp.login(username, password).then((status) => {
				// make sure login window is still open
					// success -> proceed...

					if (status == 1){
						console.log("SYNC STARTED");
						//NEED TO RENDER app.jsx now but app.jsx needs to be modified.
						//Example: ReactDOM.render(React.createElement(AppWindow, null), document.getElementById('body'));
						}
					else{
						 //some type of error
						 resolve(status);
					}

				
			});	
		});
	}
	fdp.init();
	
