import React, { Component } from 'react';
import { compose } from 'recompose';

import { AuthUserContext, withAuthorization, withEmailVerification } from '../Session';
import { withFirebase } from '../Firebase';

class HomePage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: null
        }
    }

    componentDidMount() {
        this.unsubscribe = this.props.firebase
            .users()
            .on('value', snapshot => {
                // let users = {};
                console.log("SNAPSHOT", snapshot)
                // snapshot.forEach(doc => (users[doc.id] = doc.data()));
        
                this.setState({
                    users: snapshot.val()
                });
            });
    }

    componentWillUnmount() {
        this.unsubscribe();
    }

    render() {
        return (
        <div>
            <h1>Home</h1>
            <p>This page is accessible by every signed in user.</p>
            <Messages users={this.state.users} />
        </div>
        );
    }
}

class MessagesBase extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: '',
            loading: false,
            messages: [],
            limit: 5,
            endOfMessagesReached: false,
        }
    }

    componentDidMount() {
        this.onListenForMessages();
    }

    componentWillUnmount() {
        this.props.firebase.messages().off();
    }

    onListenForMessages() {
        this.setState({ loading: true });
        const oldMessageLength = this.state.messages.length;
        console.log('oldmessagelength', oldMessageLength)
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
        const { users } = this.props;
        const { text, messages, loading, endOfMessagesReached } = this.state;
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

class MessageItem extends Component {
    constructor(props) {
        super(props);
        this.state = {
            editMode: false,
            editText: this.props.message.text
        }
    }

    onToggleEditMode = () => {
        this.setState(state => ({
            editMode: !state.editMode,
            editText: this.props.message.text
        }));
    }

    onChangeEditText = e => {
        this.setState({ editText: e.target.value });
    }

    onSaveEditText = () => {
        this.props.onEditMessage(this.props.message, this.state.editText);
        this.setState({ editMode: false })
    }

    render() {
        const { message, onRemoveMessage } = this.props;
        const { editMode, editText } = this.state;
        console.log("Messages", message)
        return (
            <li>
                {editMode ? (
                    <input
                        type="text"
                        value={editText}
                        onChange={this.onChangeEditText}
                    />
                ) : (
                    <span>
                        <strong>{message.user.username || message.user.userId}</strong> {message.text}
                        {message.modified && <small> (edited)</small>}
                    </span>
                )}
                {editMode ? (
                    <span>
                        <button onClick={this.onSaveEditText}>Save</button>
                        <button onClick={this.onToggleEditMode}>Reset</button>
                    </span>
                ) : (
                    <button onClick={this.onToggleEditMode}>Edit</button>
                )}
                {!editMode && (
                    <button type="button" onClick={() => onRemoveMessage(message.uid)}>Delete</button>
                )}
            </li>
        );
    }
}

const Messages = withFirebase(MessagesBase);

const condition = authUser => !!authUser;

export default compose(
    withFirebase,
    withEmailVerification,
    withAuthorization(condition)
)(HomePage)