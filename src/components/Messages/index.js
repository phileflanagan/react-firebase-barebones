import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import { withFirebase } from '../Firebase';

import MessageItem from './messageItem';

class MessagesBase extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: null,
            text: '',
            loading: false,
            messages: [],
            limit: 5,
            endOfMessagesReached: false,
        }
    }

    componentDidMount() {
        this.onListenForUsers();
        this.onListenForMessages();
    }

    componentWillUnmount() {
        this.props.firebase.messages().off();
        this.props.firebase.users().off();
    }

    onListenForUsers() {
        this.props.firebase
            .users()
            .on('value', snapshot => {
                this.setState({
                    users: snapshot.val()
                });
            });
    }

    onListenForMessages() {
        this.setState({ loading: true });
        const oldMessageLength = this.state.messages.length;
        this.props.firebase
            .messages()
            .orderByChild('createdAt')
            .limitToLast(this.state.limit)
            .on('value', snapshot => {
                const messageObject = snapshot.val();

                if (messageObject) {
                    const messageList = Object.keys(messageObject).map(key => ({
                        ...messageObject[key],
                        uid: key
                    }));

                    const endOfMessagesReached = (oldMessageLength === messageList.length || messageList.length < this.state.limit)
                    
                    this.setState({ 
                        messages: messageList, 
                        loading: false,
                        endOfMessagesReached
                    });   
                } else {
                    this.setState({ messages: null, loading: false});
                }
            })
    }

    onNextPage = () => {
        this.setState(state => ({limit: state.limit + 5}), this.onListenForMessages);
    }


    onChangeText = e => {
        this.setState({ text: e.target.value})
    }

    onCreateMessage = (e, authUser) => {
        this.props.firebase.messages().push({
            text: this.state.text,
            userId: authUser.uid,
            createdAt: this.props.firebase.serverValue.TIMESTAMP,
            modified: false,
            modifiedAt: null
        });

        this.setState({ text: '' });

        e.preventDefault();
    }

    onRemoveMessage = uid => {
        this.props.firebase.message(uid).remove();
    }

    onEditMessage = (message, text) => {
        this.props.firebase.message(message.uid).set({
            ...message,
            text,
            modified: true,
            dateModified: this.props.firebase.serverValue.TIMESTAMP
        })
    }

    render() {
        const { users, text, messages, loading, endOfMessagesReached } = this.state;
        return (
            <AuthUserContext.Consumer>
                {authUser => (
                    <div>
                        {loading && <div>Loading...</div>}
                        {!loading && messages && !endOfMessagesReached && (
                            <button type="button" onClick={this.onNextPage}>
                                More
                            </button>
                        )}
                        {messages && (
                            <MessageList 
                                messages={messages.map(message => ({
                                    ...message,
                                    user: users
                                      ? users[message.userId]
                                      : { userId: message.userId },
                                  }))}
                                onEditMessage={this.onEditMessage}
                                onRemoveMessage={this.onRemoveMessage} 
                            />
                        )}
                        {!messages && <div>There are no messages...</div>}
                        <form onSubmit={e => this.onCreateMessage(e, authUser)}>
                            <input 
                                type="text"
                                value={text}
                                onChange={this.onChangeText}
                            />
                            <button type="submit">Send</button>
                        </form>
                    </div>
                )}
            </AuthUserContext.Consumer>
        ); 
    }
}

const MessageList = ({ messages, onRemoveMessage, onEditMessage }) => (
    <ul>
        {messages.map(message => (
            <MessageItem 
                key={message.uid}
                message={message} 
                onEditMessage={onEditMessage}
                onRemoveMessage={onRemoveMessage}
            />
        ))}
    </ul>
);

export default withFirebase(MessagesBase);