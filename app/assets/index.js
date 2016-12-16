var fdp = new FDP();

	


	function login(username,password){

	return new Promise((resolve, reject) => {

		fdp.login(username, password).then((status) => {
				// make sure login window is still open
					// success -> proceed...

					if (status == 1){
						console.log("SYNC STARTED");
						//NEED TO RENDER app.jsx now but app.jsx needs to be modified.
						
						}
					else{
						 //some type of error
						 resolve(status);
					}

				
			});	
		});
	}
	fdp.init();
	
