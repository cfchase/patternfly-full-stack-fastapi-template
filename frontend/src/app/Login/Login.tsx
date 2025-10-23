/**
 * Login page component using PatternFly.
 */
import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LoginPage as PFLoginPage,
  LoginForm,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useAuth } from '@contexts/AuthContext';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export const Login: React.FunctionComponent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [showHelperText, setShowHelperText] = React.useState(false);
  const [usernameValue, setUsernameValue] = React.useState('');
  const [isValidUsername, setIsValidUsername] = React.useState(true);
  const [passwordValue, setPasswordValue] = React.useState('');
  const [isValidPassword, setIsValidPassword] = React.useState(true);
  const [isLoginButtonDisabled, setIsLoginButtonDisabled] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUsernameValue(value);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setPasswordValue(value);
  };

  const onLoginButtonClick = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setIsLoginButtonDisabled(true);
    setShowHelperText(false);
    setErrorMessage('');

    // Validate inputs
    if (!usernameValue) {
      setIsValidUsername(false);
      setIsLoginButtonDisabled(false);
      return;
    }
    if (!passwordValue) {
      setIsValidPassword(false);
      setIsLoginButtonDisabled(false);
      return;
    }

    try {
      await login(usernameValue, passwordValue);

      // Redirect to the page they tried to visit or dashboard
      const from = (location.state as LocationState)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      setShowHelperText(true);
      setIsValidUsername(false);
      setIsValidPassword(false);

      // Set error message based on response
      if (error.response?.status === 401 || error.response?.status === 400) {
        setErrorMessage('Invalid email or password');
      } else {
        setErrorMessage('Login failed. Please try again.');
      }
    } finally {
      setIsLoginButtonDisabled(false);
    }
  };

  const helperText = (
    <React.Fragment>
      <ExclamationCircleIcon />
      &nbsp;{errorMessage}
    </React.Fragment>
  );

  const loginForm = (
    <LoginForm
      showHelperText={showHelperText}
      helperText={helperText}
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel="Email"
      usernameValue={usernameValue}
      onChangeUsername={handleUsernameChange}
      isValidUsername={isValidUsername}
      passwordLabel="Password"
      passwordValue={passwordValue}
      onChangePassword={handlePasswordChange}
      isValidPassword={isValidPassword}
      onLoginButtonClick={onLoginButtonClick}
      loginButtonLabel="Log in"
      isLoginButtonDisabled={isLoginButtonDisabled}
    />
  );

  return (
    <PFLoginPage
      brandImgSrc="/images/logo.svg"
      brandImgAlt="PatternFly logo"
      textContent="Full-stack application with authentication"
      loginTitle="Log in to your account"
      loginSubtitle="Enter your email and password"
    >
      {loginForm}
    </PFLoginPage>
  );
};
