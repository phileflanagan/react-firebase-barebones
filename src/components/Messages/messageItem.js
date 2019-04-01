import React, { Component } from 'react';

import { AuthUserContext } from '../Session';
import * as ROLES from '../../constants/roles';

/* Props 
    key={message.uid}
    message={message} 
    onEditMessage={onEditMessage}
    onRemoveMessage={onRemoveMessage}
*/

/* Fn
    onRemoveMessage(uid)
    onEditMessage(message, text)
*/

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
        return (
            <AuthUserContext.Consumer>
                {authUser => (
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
                        {(authUser.uid === message.userId || authUser.roles.includes(ROLES.ADMIN)) && (
                            <span>
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
                            </span>
                        )}
                    </li>
                )}
            </AuthUserContext.Consumer>
        );
    }
}

export default MessageItem;