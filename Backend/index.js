
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const jwt = require('jsonwebtoken');
const { response } = require("express");
// const res = require("express/lib/response");

const app = express();
require('dotenv').config()
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({extended: true}));

const db = mysql.createConnection(
    {
      host: 'deep.moe',
      user: 'iiitd-chat',
      password: process.env.REMOTE_KEY,
      database: 'iiitdchat'
    }
);

db.connect(err => {
  if  (err){
    console.error(err);
    console.error("Failed while connecting to database");
    process.exit();
  }
});

const PORT = process.env.PORT || 3001;

  // http://localhost:3001/auth
app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;

  console.log("Backend: handling /auth");

	if (username && password) {
		db.query('SELECT * FROM users WHERE Roll_no = ? AND Email_ID = ?',
      [username, password],
      function(error, results, fields) {
        if (error) throw error;
          if (results.length === 1) {
            const user = results[0];
            const {Name, Email_ID} = user;
            const mytoken = jwt.sign({Name, Email_ID}, process.env.JWT_SECRET);
            response.json(mytoken);

            var date = new Date();
            date = date.getUTCFullYear() + '-' +
                ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
                ('00' + date.getUTCDate()).slice(-2) + ' ' + 
                ('00' + date.getUTCHours()).slice(-2) + ':' + 
                ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
                ('00' + date.getUTCSeconds()).slice(-2);

            db.query("UPDATE users SET Log = ? WHERE Email_ID = ?", [date, Email_ID], function(error, results, fields) {
              if (error) throw error;
              else {
                console.log("Log updated for "+Email_ID);
              }
            })
          } else {
            response.send('Incorrect Username and/or Password!');
          }			
          response.end();
      });
    
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/api/getRecentChats', function(req, res) {
    let decodedToken = checkAuthFromRequest(req, res);
    if(!decodedToken) return;

    const{Name, Email_ID} = decodedToken;

    console.log("/api/getRecentChats", Name, Email_ID)
    if(Name) {
      db.query('call iiitdchat.getRecents(?)',
      [Name],
      function(err, result,fields) {
        if(err) throw err;
        // console.log(result);
        res.json(result);
      });
    }
    else {
      res.send(404).end();
    }
});

// Need userID for this
app.get('/api/getItemInfo/:item', function(req, res) {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name ,Email_ID} = decodedToken;
  const { item } = req.params;
  const recID = item;

  console.log("/api/getItemInfo/:item", Name, Email_ID, recID);
  if(Name && Email_ID && recID) {
    if(recID.startsWith("c")){
      db.query('SELECT u.Name, u.Log FROM users AS u, chat AS c WHERE c.Chat_ID = ? AND c.User_2_ID = u.Email_ID',
      [recID], function(err, result,fields) {
        if(err) throw err;
        res.json(result);
      });
    }
    else if(recID.startsWith("g")){
      db.query('SELECT g.GName FROM grps AS g WHERE g.Group_ID = ?',
      [recID], function(err, result,fields) {
        if(err) throw err;
        res.json(result);
      });
    }
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }
});

app.get("/api/getContactInfo/:item", (req, res) => {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name ,Email_ID} = decodedToken;
  const { item } = req.params;
  const contactEmail = item;

  console.log("/api/getContactInfo/:item", Name, Email_ID, contactEmail);
  if(Name && Email_ID && contactEmail) {
    db.query('SELECT *FROM users WHERE Email_ID = ?',
    [contactEmail], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    return res.status(400).send('Missing name, email or contact email');
  }
})

app.get("/api/getContactInfo", (req, res) => {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name ,Email_ID} = decodedToken;

  console.log("/api/getContactInfo", Name, Email_ID);
  if(Name && Email_ID) {
    db.query('SELECT *FROM users WHERE Email_ID = ?',
    [Email_ID], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    return res.status(400).send('Missing name, email or contact email');
  }
})

app.get("/api/getBlockedInfo/:item", (req, res) => {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name ,Email_ID} = decodedToken;
  const { item } = req.params;
  const blockedEmail = item;

  console.log("/api/getBlockedInfo/:item", Name, Email_ID, blockedEmail);
  if(Name && Email_ID && blockedEmail) {
    db.query('SELECT * FROM users WHERE Email_ID = ?',
    [blockedEmail], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    return res.status(400).send('Missing name, email or contact email');
  }
})

app.get('/api/getMessages/:item', function(req, res) {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name,Email_ID} = decodedToken;
  const { item } = req.params;
  const recID = item;

  console.log("/api/getMessages/:item",Name, Email_ID, recID);
  if(Name && Email_ID && recID) {
    db.query('SELECT u.Name, u.Email_ID, m.Message_ID, m.Sender_ID, m.Reply_Msg_ID, m.Message_Body, m.Sending_Date_Time, m.Forward_Msg_ID, m.UpvoteCount, m.isDeletedForEveryone, m.isPicture FROM users AS u, message AS m WHERE m.Reciever_ID = ? AND u.Email_ID = m.Sender_ID AND m.isDeletedForEveryone = 0',
    [recID], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }
});

app.get("/api/getAllContacts", (req, res)=>{
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name ,Email_ID} = decodedToken;

  console.log("/api/getAllContacts", Name, Email_ID);
  if(Name && Email_ID) {
    db.query('SELECT u.Name, u.status, u.Email_ID FROM users AS u, contacts AS c WHERE c.Contact_Email_ID = u.Email_ID AND c.Email_ID = ?',
    [Email_ID], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    res.status(400).send('Missing name, email or receiver id');
  }
})

app.get("/api/getBlockedList", (req, res)=>{
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const{Name, Email_ID} = decodedToken;

  console.log("/api/getBlockedList", Name, Email_ID);
  if(Name && Email_ID) {
    db.query('SELECT u.Name, u.status, u.Email_ID FROM users AS u, user_blockedlist AS c WHERE c.Blocked_Email_ID = u.Email_ID AND c.User_Email_ID = ?',
    [Email_ID], function(err, result,fields) {
      if(err) throw err;
      res.json(result);
    });
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }
})

// extracting profile name
app.get("/api/getProfileName", (req, res) => {
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const {Name, Email_ID} = decodedToken;
  console.log("/api/getProfileName", decodedToken);

  if(Name && Email_ID) {
    res.json(Name);
  }
  else {
    res.send('Error 404');
    res.end();
  }
})

app.post("/api/sendMessage", (req, res) => {
  const msgInfo = req.body;
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const {Name, Email_ID} = decodedToken;

  if(Name && Email_ID) {
    db.query("call iiitdchat.SendMsg(?, null, ?, ?, ?, null, 0, 0, 1, ?, 0)",
    [Email_ID, msgInfo.recieverID, msgInfo.messageBody, msgInfo.sentDate, msgInfo.isPicture=="img"?1:0], function(err, result,fields) {
      if(err) throw err;
        res.status(200).end();
    });
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }

})

app.post("/api/deleteMsg", (req, res) => {
  const msgID= req.body.msgID;
  console.log(req.body);
  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const {Name, Email_ID} = decodedToken;

  console.log("/api/deleteMsg", decodedToken);

  if(Name && Email_ID) {
    db.query(`UPDATE message SET isDeletedForEveryone = 1 WHERE Message_ID = '${msgID}'`,
    function(err, result,fields) {
      if(err) throw err;
        res.status(200).end();
    });
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }
})

app.post("/api/updateProfile", (req, res) => {
  const profileInfo= req.body;
  console.log(req.body);

  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const {Name, Email_ID} = decodedToken;

  console.log("/api/deleteMsg", decodedToken, profileInfo);

  if(Name && Email_ID && profileInfo){
    db.query(`UPDATE users SET Name = ? , status = ? , Phone_No = ? WHERE Email_ID = ?`, [...profileInfo, Email_ID],
    function(err, result,fields) {
      if(err) throw err;
        res.status(200).end();
    });
  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }

})

app.post("/api/newChat", (req, res) => {
  const Email2= req.body.email;
  console.log(req.body);

  let decodedToken = checkAuthFromRequest(req, res);
  if(!decodedToken) {return}
  const {Name, Email_ID} = decodedToken;

  console.log("/api/newChat", decodedToken);

  if(Name && Email_ID && Email2){
    
    db.query(`SELECT * FROM chat ORDER BY Chat_ID DESC LIMIT 1`, function(err, result, fields){

      console.log("result: ", result);
      const lastChatID = result[0].Chat_ID;

      console.log("lastC= ", lastChatID);
      let cID = `${lastChatID}`.slice(1);
      console.log("cID= ", cID);
      cID = parseInt(cID);
      cID = cID+1;
      console.log("cID= ", cID);
      const finalCID = "c"+`${cID}`;

      console.log("finalCID= ", finalCID);

      db.query(`call iiitdchat.newChat(?, ?, ?)`, [Email_ID, Email2, finalCID ],
      function(err, result,fields) {
        if(err) throw err;
          res.status(200).end();
      });

      var date = new Date();
      date = date.getUTCFullYear() + '-' +
          ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
          ('00' + date.getUTCDate()).slice(-2) + ' ' + 
          ('00' + date.getUTCHours()).slice(-2) + ':' + 
          ('00' + date.getUTCMinutes()).slice(-2) + ':' + 
          ('00' + date.getUTCSeconds()).slice(-2);

      db.query("call iiitdchat.SendMsg(?, null, ?, ?, ?, null, 0, 0, 1, ?, 0)",
      [Email_ID, finalCID, "Hi", date, 0], function(err, result,fields) {
        if(err) throw err;
          res.status(200).end();
      });
    })



  }
  else {
    return res.status(400).send('Missing name, email or receiver id');
  }

})

function checkAuthFromRequest(req, res) {
  const authHeader = req.get('Authorization');

  if (!(authHeader && authHeader.toLocaleLowerCase().startsWith('bearer '))) {
    res.status(401).json({message: "Missing or invalid token"});
    return null;
  }

  const token = authHeader.substring(7);
  
  if (!token && !jwt.verify(token, process.env.JWT_SECRET)) {
    res.status(401).json({message: "Unauthorized"});
    return null;
  }
  
  return jwt.decode(token);
}

//serving frontend 
app.use(express.static(path.join(__dirname, '../Frontend/build')))
app.get('*',(req, res) => {
  res.sendFile(path.resolve(__dirname, '../','Frontend','build','index.html'))
})


app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
