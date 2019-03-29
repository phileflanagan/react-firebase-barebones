import React from 'react';

import AuthUserContext from './context';
import { withFirebase } from '../Firebase';

const needsEmailVerification = authUser =>
  authUser &&
  !authUser.emailVerified &&
  authUser.providerData
    .map(provider => provider.providerId)
    .includes('password');

const withEmailVerification = Component => {
    class WithEmailVerification extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                isSent: false
            }
        }

        onSendEmailVerification = () => {
            this.props.firebase
                .doSendEmailVerification()
                .then(() => this.setState({ isSent: true }))
        }

        render() {
            return (
                <AuthUserContext.Consumer>
                    {authUser => needsEmailVerification(authUser) ? (
                        <div>
                        {this.state.isSent ? (
                            <div>
                                <p>Email confirmation sent: Check your emails for a confirmation email. Refresh once you've confirmed your email address.</p>
                            </div>
                        ) : (
                            <div>
                                <p>Verify your email: Check your emails for a confirmation email or send another.</p>
                                <button type="button" disabled={this.state.isSent} onClick={this.onSendEmailVerification}>Resend Confirmation Email</button>
                            </div>
                        )}
                        </div>
                    ) : (
                        <Component {...this.props} />
                    )}
                </AuthUserContext.Consumer>
            );
        }
    }
    return withFirebase(WithEmailVerification)
}

export default withEmailVerification;
