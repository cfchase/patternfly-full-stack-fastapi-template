/**
 * Profile settings page for updating user information and password.
 */
import * as React from 'react';
import {
  PageSection,
  Title,
  Form,
  FormGroup,
  TextInput,
  ActionGroup,
  Button,
  Alert,
  AlertActionCloseButton,
  Card,
  CardBody,
  CardTitle,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import { updateCurrentUser, updatePassword, UpdatePassword } from '@api/users';

const ProfileSettings: React.FunctionComponent = () => {
  useDocumentTitle('Profile Settings');
  const { user, refreshUser } = useAuth();

  // Profile form state
  const [email, setEmail] = React.useState(user?.email || '');
  const [fullName, setFullName] = React.useState(user?.full_name || '');
  const [isProfileUpdating, setIsProfileUpdating] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState('');
  const [profileError, setProfileError] = React.useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isPasswordUpdating, setIsPasswordUpdating] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');

  // Update local state when user data changes
  React.useEffect(() => {
    if (user) {
      setEmail(user.email);
      setFullName(user.full_name || '');
    }
  }, [user]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsProfileUpdating(true);

    try {
      await updateCurrentUser({
        email,
        full_name: fullName || undefined,
      });
      await refreshUser();
      setProfileSuccess('Profile updated successfully');
    } catch (error: any) {
      setProfileError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setIsPasswordUpdating(true);

    try {
      const passwordData: UpdatePassword = {
        current_password: currentPassword,
        new_password: newPassword,
      };
      await updatePassword(passwordData);
      setPasswordSuccess('Password changed successfully');
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.response?.status === 400) {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError(error.response?.data?.detail || 'Failed to change password');
      }
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return (
    <PageSection hasBodyWrapper={false}>
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h1" size="lg">
            Profile Settings
          </Title>
        </StackItem>

        <StackItem>
          <Card>
            <CardTitle>Profile Information</CardTitle>
            <CardBody>
              {profileSuccess && (
                <Alert
                  variant="success"
                  title={profileSuccess}
                  actionClose={<AlertActionCloseButton onClose={() => setProfileSuccess('')} />}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              {profileError && (
                <Alert
                  variant="danger"
                  title={profileError}
                  actionClose={<AlertActionCloseButton onClose={() => setProfileError('')} />}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              <Form onSubmit={handleProfileSubmit}>
                <FormGroup label="Email" isRequired fieldId="profile-email">
                  <TextInput
                    isRequired
                    type="email"
                    id="profile-email"
                    name="profile-email"
                    value={email}
                    onChange={(_event, value) => setEmail(value)}
                  />
                </FormGroup>
                <FormGroup label="Full Name" fieldId="profile-full-name">
                  <TextInput
                    type="text"
                    id="profile-full-name"
                    name="profile-full-name"
                    value={fullName}
                    onChange={(_event, value) => setFullName(value)}
                  />
                </FormGroup>
                <ActionGroup>
                  <Button variant="primary" type="submit" isLoading={isProfileUpdating}>
                    Update Profile
                  </Button>
                </ActionGroup>
              </Form>
            </CardBody>
          </Card>
        </StackItem>

        <StackItem>
          <Card>
            <CardTitle>Change Password</CardTitle>
            <CardBody>
              {passwordSuccess && (
                <Alert
                  variant="success"
                  title={passwordSuccess}
                  actionClose={<AlertActionCloseButton onClose={() => setPasswordSuccess('')} />}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              {passwordError && (
                <Alert
                  variant="danger"
                  title={passwordError}
                  actionClose={<AlertActionCloseButton onClose={() => setPasswordError('')} />}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              <Form onSubmit={handlePasswordSubmit}>
                <FormGroup label="Current Password" isRequired fieldId="current-password">
                  <TextInput
                    isRequired
                    type="password"
                    id="current-password"
                    name="current-password"
                    value={currentPassword}
                    onChange={(_event, value) => setCurrentPassword(value)}
                  />
                </FormGroup>
                <FormGroup label="New Password" isRequired fieldId="new-password">
                  <TextInput
                    isRequired
                    type="password"
                    id="new-password"
                    name="new-password"
                    value={newPassword}
                    onChange={(_event, value) => setNewPassword(value)}
                  />
                </FormGroup>
                <FormGroup label="Confirm New Password" isRequired fieldId="confirm-password">
                  <TextInput
                    isRequired
                    type="password"
                    id="confirm-password"
                    name="confirm-password"
                    value={confirmPassword}
                    onChange={(_event, value) => setConfirmPassword(value)}
                  />
                </FormGroup>
                <ActionGroup>
                  <Button variant="primary" type="submit" isLoading={isPasswordUpdating}>
                    Change Password
                  </Button>
                </ActionGroup>
              </Form>
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export { ProfileSettings };
