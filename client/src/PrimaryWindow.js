import "./PrimaryWindow.css";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import axios from "axios";
import ChatContainer from "./ChatContainer";

export default function PrimaryWindow(){
    const initialChat = [{
        Reciever_ID: "1234",
        Message_Body: "hello amongus sussy baka fortnite victry royal",
        Sending_Date_Time: new Date()
    }];
    const initialChat2 = initialChat.concat(initialChat).concat(initialChat).concat(initialChat);
    const [section, setSection] = useState("chats");
    const [chats, setChats] = useState(initialChat2.concat(initialChat2));

    useEffect(()=>{
        axios.get("http://localhost:3001/api/getRecentChats", {
            headers: { Authorization: `bearer ${sessionStorage['user-token']}` }
        })
        .then((response) => {
            const receivedChats = response.data[0].map(message => {
                return {
                    ...message,
                    Sending_Date_Time: new Date(message.Sending_Date_Time)
                }
            });

            const uniqueChatMap = {};
            receivedChats.forEach(chat => uniqueChatMap[chat.Reciever_ID] = chat);
            console.log(12, uniqueChatMap, receivedChats)
            setChats(Object.values(uniqueChatMap));
      })
      .catch(error => {
        console.error(error.response.data.message);
      })
    }, []);

    console.log(chats);

    return(
        <>
        <div id="primaryWindowWrapper">
            <div id="topNavBar">
                <button className={section=="chats"?"sectionButton whiteButton":"sectionButton"} id="chatsBtn">Chats</button>
                <button className={section=="contacts"?"sectionButton whiteButton":"sectionButton"}  id="contactsBtn">Contacts</button>
                <button className={section=="blocked"?"sectionButton whiteButton":"sectionButton"}  id="blockedBtn">Blocked</button>
            </div>

            <div id="primaryWindow">
                <SearchBar target={section} />
                <div><br/></div>
                <div id="messagesWrapper">
                    {
                        chats.map(function (chat, index) {
                            return <ChatContainer key={index} name={chat.Reciever_ID} sentdate={chat.Sending_Date_Time} lasttext={chat.Message_Body}/>;
                        })
                    }
                </div>
            </div>
        </div>
        </>
    );
}