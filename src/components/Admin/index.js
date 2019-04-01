import React, { Component } from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import { compose } from 'recompose';

import { withFirebase } from '../Firebase';
import { withAuthorization, withEmailVerification } from '../Session';
import * as ROUTES from '../../constants/routes';
import * as ROLES from '../../constants/roles';


const AdminPage = () => (
    <div>
        <h1>Admin Page</h1>
        <p>This page is only accessible to people with admin privileges.</p>

        <Switch>
            <Route exact path={ROUTES.ADMIN_DETAILS} component={UserItem} />
            <Route exact path={ROUTES.ADMIN} component={UserList} />
        </Switch>
    </div>
);
class UserListBase extends Component {
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
                <h2>Users</h2>
                {loading && <div>Loading...</div>}
                <UserListTable users={users} />
            </div>
        );
    }
}

const UserListTable = ({users}) => (
    <table>
        <thead>
            <tr>
                <th>Username</th>
                <th>Email</th>
                <th>ID</th>
                <th>Details</th>
            </tr>
        </thead>
        <tbody>
        {users.map(user => (
            <tr key={user.uid}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.uid}</td>
                <td><Link 
                        to={{
                            pathname: `${ROUTES.ADMIN}/${user.uid}`, 
                            state: { user }
                        }}
                    >
                        More
                    </Link>
                </td>
            </tr>  
        ))}
        </tbody>
    </table>
);

class UserItemBase extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            user: null,
            error: null,
            sent: false,
            ...props.location.state
        }
    }

    componentDidMount() {
        if (this.state.user) return;

        this.setState({ loading: true });
        this.props.firebase
            .user(this.props.match.params.id)
            .on('value', snapshot => {
                this.setState({ 
                    user: snapshot.val(), 
                    loading: false
                });
            });
    }
    componentWillUnmount() {
        this.props.firebase.user(this.props.match.params.id).off();
    }

    onSendPasswordResetEmail = () => {
        this.props.firebase
            .doPasswordReset(this.state.user.email)
            .then(() => {
                this.setState({ sent: true })
            })
            .catch(error => {

            });
    }

    render() {
        const { user, loading, sent, error } = this.state;
        return (
            <div>
                <h2>User ({this.props.match.params.id})</h2>
                {loading && <div>Loading...</div>}
                {user && (
                    <div>
                        <UserItemTable user={user} />
                        <button disabled={this.state.sent} type="button" onClick={this.onSendPasswordResetEmail}>Send Password Reset</button>
                        {sent && <div>Email sent!</div>}
                        {error && <div>{error}</div>}
                    </div>
                )}
            </div>
        );
    }
}

const UserItemTable = ({user}) => (
    <table>
        <thead>
            <tr>
                <th>Field</th>
                <th>Info</th>
            </tr>
        </thead>
        <tbody>
            <tr key={user.uid}>
                <td>Username</td>
                <td>{user.username}</td>
            </tr>
            <tr>
                <td>Email</td>
                <td>{user.email}</td>
            </tr>
            <tr>
                <td>Roles</td>
                <td>{user.roles.map((role, i) => (i < user.roles.length - 1) ? role + ', ' : role)}</td>
            </tr>  
        </tbody>
    </table>
);


const UserList = withFirebase(UserListBase);
const UserItem = withFirebase(UserItemBase);

const condition = authUser => authUser && authUser.roles.includes(ROLES.ADMIN);

export default compose(
    withEmailVerification,
    withAuthorization(condition),
    withFirebase
)(AdminPage)