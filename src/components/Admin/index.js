import React, { Component } from 'react';

import { withFirebase } from '../Firebase';

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
                {loading && <div>Loading...</div>}
                <UserList users={users} />
            </div>
        );
    }
}

const UserList = ({users}) => (
    <table>
        <tr>
            <th>Username</th>
            <th>Email</th>
            <th>ID</th>
        </tr>
        {users.map(user => (
            <tr key={user.uid}>
                <th>{user.username}</th>
                <th>{user.email}</th>
                <th>{user.uid}</th>
            </tr>  
        ))}
    </table>
);

export default withFirebase(AdminPage);