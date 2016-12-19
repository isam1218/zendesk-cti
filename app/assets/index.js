// class MainApp extends React.Component {
// 	constructor() {
// 		super();
// 		var fdp = new FDP();
// 		console.log('fdp - ', fdp);
// 		fdp.login(username, password).then((status) => {
// 			if (status == 1){
// 				console.log('sync started!!!!');
// 			}
// 			else {
// 				console.log('ERROR LOGING IN');
// 			}
// 		})
// 		fdp.init();
// 	}

// 	render() {
// 		console.log('login - ', LoginWindow);
// 		return (
// 			<div>
// 				<LoginWindow />
// 			</div>
// 		)
// 	}
// }


var fdp = new FDP();

	


	function login(username,password){

	return new Promise((resolve, reject) => {

		fdp.login(username, password).then((status) => {
				// make sure login window is still open
					// success -> proceed...

					if (status == 1){
						console.log("SYNC STARTED");
						// ReactDOM.render(<AppWindow />, document.getElementById('body'));
						//NEED TO RENDER app.jsx now but app.jsx needs to be modified.
						
						}
					else{
						 //some type of error
						 // ReactDOM.render(<LoginWindow />, document.getElementById('body'));
						 // ReactDOM.render(React.createElement(LoginWindow, null), document.getElementById('body'));
						 resolve(status);
					}

				
			});	
		});
	}
	fdp.init();
