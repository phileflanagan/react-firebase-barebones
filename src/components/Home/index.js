import React from 'react';
import { compose } from 'recompose';

import { withAuthorization, withEmailVerification } from '../Session';
import Messages from '../Messages';

const HomePage = () => (
    <div>
        <h1>Home</h1>
        <p>This page is accessible by every signed in user.</p>
        <Messages />
    </div>
);
    
const condition = authUser => !!authUser;

export default compose(
    withEmailVerification,
    withAuthorization(condition)
)(HomePage)