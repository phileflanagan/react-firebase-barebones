import React, { Component } from 'react';
import { compose } from 'recompose';

import { withFirebase } from '../Firebase';
import { withAuthorization, withEmailVerification } from '../Session';
import * as ROLES from '../../constants/roles';

class AdminPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            users: []
        }
    }

    componentDidMount() {
        this.setState({ loading: true });

        this.props.firebase.users().on('value', snapshot => {
            const usersObj = snapshot.val();
            const usersList = Object.keys(usersObj).map(key => ({...usersObj[key], uid: key }));
            this.setState({
                users: usersList,
                loading: false
            });
        });
    }

    componentWillUnmount() {
        this.props.firebase.users().off();
    }

    render() {
        const { users, loading } = this.state;
        return (
            <div>
                <h1>Admin</h1>
                <p>This page is only accessible to people with admin privileges.</p>
                {loading && <div>Loading...</div>}
                <UserList users={users} />
            </div>
        );
    }
}

const UserList = ({users}) => (
    <table>
        <thead>
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>ID</th>
            </tr>
        </thead>
        <tbody>
        {users.map(user => (
            <tr key={user.uid}>
                <th>{user.username}</th>
                <th>{user.email}</th>
                <th>{user.uid}</th>
            </tr>  
        ))}
        </tbody>
    </table>
);

const condition = authUser => authUser && authUser.roles.includes(ROLES.ADMIN);

export default compose(
    withEmailVerification,
    withAuthorization(condition),
    withFirebase
)(AdminPage)