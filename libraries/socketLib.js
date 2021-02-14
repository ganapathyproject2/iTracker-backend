//imprt modules
const socketio = require('socket.io');
const tokenLib = require('./token-library');
const socketRoomName = 'itracker';

let setServer=(server)=>{
  const allOnlineUsers = [];
  let io = socketio(server);
  let myIo = io.of('');

  myIo.on('connection', (socket)=>{
    //emiting event to verify user
    socket.emit('verifyUser',"");
    //listening setuser event for verifying user
    socket.on('setUser',(sentData)=>{
      tokenLib.verifyAuth(sentData.authToken, (err,user)=>{
            if(err){
                console.log('Auth failed!!!');
                socket.emit('auth-error', { status: 500, error: 'Auth failed!!!'});
                return;
            }
            let currentUser = user;
            socket.userId = currentUser.id;
            socket.room=socket.userId;
            socket.join(socket.userId);
            let fullName = `${currentUser.firstName} ${currentUser.lastName}`;
            let userObj = {userId:currentUser.id, fullName: fullName};
            allOnlineUsers.push(userObj);

            console.log(allOnlineUsers);
            myIo.emit('onlineUserList', allOnlineUsers);
      });
    });//end set user part

    // function that will create room for each issueId and all watchers will join this room
    socket.on('setWatchingIssues', data => {
      if (data && data.length > 0) {
        for (let issueId of data) {
          socket.join(issueId);
        }
      }
    })

    // method to get online user list
    socket.on('getOnlineUsers', () => {
      socket.emit('onlineUserList', allOnlineUsers);
    }); // end getOnlineUsers

    socket.on('sendNotification', (data) => {
      let sender = data.sender.userId;
      let clientRoomId = data.issue ? data.issue.id : (data.project ? data.project.id : data.clientId);
      socket.broadcast.to(clientRoomId).emit('receivedNotification', data);
    });


    //disconnect socket
    socket.on('disconnect', () => {
        // disconnect the user from socket
        // remove the user from online list
        // unsubscribe the user from his own channel

        console.log("user is disconnected");
        // console.log(socket.connectorName);
        console.log(socket.userId);


        //var removeIndex = allOnlineUsers.map(function(user) { return user.id; }).indexOf(socket.userId);
        let index = allOnlineUsers.findIndex((user) => socket.userId === user.userId);
        if(index >= 0) {
          allOnlineUsers.splice(index, 1)
        }
        console.log(allOnlineUsers)

        myIo.emit('onlineUserList', allOnlineUsers);
        socket.leave(socket.userId);
        socket.disconnect(0);
    }) // end of on disconnect

  });//end connection established part

}//end set Server

module.exports = {
  setServer: setServer
}
