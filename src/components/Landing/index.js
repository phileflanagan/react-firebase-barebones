import React from 'react';
import { Link } from 'react-router-dom';

import { SignUpLink } from '../SignUp';

import * as ROUTES from '../../constants/routes';

const LandingPage = () => (
    <div>
        <h1>Welcome to the landing page.</h1>
        <SignUpLink />
    </div>
);

export default LandingPage;