import "./PrimaryWindow.css";
import SearchBar from "./SearchBar";
import { useEffect, useState } from "react";
import axios from "axios";
import ChatContainer from "./ChatContainer";
import ContactContainer from "./ContactContainer";
import BlockedContainer from "./BlockedContainer";

export default function PrimaryWindow({sectionSetter, section, setItem, item, selectedContact, setSelectedContact, selectedBlockedContact, setSelectedBlockedContact}){
    const initialChat = [{
        Reciever_ID: "1234",
        Message_Body: "hello this is sample placeholder text for testing purposes",
        Sending_Date_Time: new Date(),
        Name: "Conversation Name"
    }];
    const initialChat2 = initialChat.concat(initialChat).concat(initialChat).concat(initialChat);
    const [chats, setChats] = useState(initialChat2.concat(initialChat2));
    const [contacts, setContacts] = useState([]);
    const [blockedContacts, setBlockedContacts] = useState([]);

    useEffect(()=>{
        switch (section){
            case "chats":
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
                    console.log("recentChats", receivedChats);

                    const uniqueChatMap = [];
                    const recIDList = [];
                    for(let i in receivedChats){
                        console.log()
                        if(!recIDList.includes(receivedChats[i].Reciever_ID)){
                            recIDList.push(receivedChats[i].Reciever_ID);
                            uniqueChatMap.push(receivedChats[i]);
                        }
                    }

                    setChats(uniqueChatMap);

                    console.log("recentChatsAfter", uniqueChatMap);
                }).catch(error => {
                    console.error(error);
                })
                break;

            case "contacts":
                axios.get("http://localhost:3001/api/getAllContacts", {
                    headers: { Authorization: `bearer ${sessionStorage['user-token']}` }
                }).then((response => {
                    // processing the backend data for user contacts
                    setContacts(response.data);
                    console.log("contacts", contacts);
                })).catch(error => {
                    console.error(error);
                })
                break;

            case "blocked":
                axios.get("http://localhost:3001/api/getBlockedList", {
                    headers: { Authorization: `bearer ${sessionStorage['user-token']}` }
                }).then((response => {
                    // processing the backend data for user blockedlist
                    setBlockedContacts(response.data);
                    console.log("blocked", blockedContacts);

                })).catch(error => {
                    console.error(error);
                })
                break;
                
        }
    }, [section, item]);

    function chatMapper(chat, index){
        return <ChatContainer key={index} name={chat.Name} sentdate={chat.Sending_Date_Time} lasttext={chat.Message_Body} setItem={setItem} ID={chat.Reciever_ID} item={item}/>;
    }
    function contactMapper(contact, index){
        // return contactcontainer mapped array
        return <ContactContainer key={index} name={contact.Name} status={contact.status} ID={contact.Email_ID} setSelectedContact={setSelectedContact} selectedContact={selectedContact}/>;
    }
    function blockedMapper(contact, index){
        // return blockedcontainer mapped array
        return <BlockedContainer key={index} name={contact.Name} status={contact.status} ID={contact.Email_ID} setSelectedBlockedContact={setSelectedBlockedContact} selectedBlockedContact={selectedBlockedContact}/>;
    }
    function cards(section, chats, contacts, blockedContacts){
        switch(section){
            case "chats":
                return chats.map(chatMapper);
            case "contacts":
                return contacts.map(contactMapper);
            case "blocked":
                return blockedContacts.map(blockedMapper);
        }
    }

    return(
        <>
        <div id="primaryWindowWrapper">
            <div id="topNavBar">
                <button className={section=="chats"?"sectionButton whiteButton":"sectionButton"} id="chatsBtn" onClick={() => {sectionSetter("chats");setItem("null")}}>Chats</button>
                <button className={section=="contacts"?"sectionButton whiteButton":"sectionButton"}  id="contactsBtn" onClick={() => {sectionSetter("contacts");setSelectedContact("null")}}>Contacts</button>
                <button className={section=="blocked"?"sectionButton whiteButton":"sectionButton"}  id="blockedBtn" onClick={() => {sectionSetter("blocked");setSelectedBlockedContact("null")}}>Blocked</button>
            </div>

            <div id="primaryWindow">
                <SearchBar target={section} />

                <div id="cardsWrapper">
                    {
                        cards(section, chats, contacts, blockedContacts)
                    }
                </div>
            </div>
        </div>
        </>
    );
}