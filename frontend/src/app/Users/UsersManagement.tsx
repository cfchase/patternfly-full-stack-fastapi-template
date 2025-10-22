/**
 * Users management page for administrators.
 * Allows viewing, creating, editing, and deleting users.
 */
import * as React from 'react';
import {
  PageSection,
  Title,
  Button,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';
import { useAuth } from '@contexts/AuthContext';
import { getUsers, createUser, updateUser, deleteUser, UserCreate } from '@api/users';
import { UserPublic } from '@api/auth';

const UsersManagement: React.FunctionComponent = () => {
  useDocumentTitle('Users Management');
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = React.useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = React.useState<UserPublic | null>(null);

  // Form state
  const [formEmail, setFormEmail] = React.useState('');
  const [formFullName, setFormFullName] = React.useState('');
  const [formPassword, setFormPassword] = React.useState('');
  const [formIsSuperuser, setFormIsSuperuser] = React.useState(false);
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load users
  const loadUsers = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getUsers(0, 100);
      setUsers(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Modal handlers
  const handleCreateClick = () => {
    setModalMode('create');
    setFormEmail('');
    setFormFullName('');
    setFormPassword('');
    setFormIsSuperuser(false);
    setFormIsActive(true);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (user: UserPublic) => {
    setModalMode('edit');
    setFormEmail(user.email);
    setFormFullName(user.full_name || '');
    setFormPassword('');
    setFormIsSuperuser(user.is_superuser);
    setFormIsActive(user.is_active);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (modalMode === 'create') {
        const userData: UserCreate = {
          email: formEmail,
          password: formPassword,
          full_name: formFullName || undefined,
          is_superuser: formIsSuperuser,
        };
        await createUser(userData);
        setSuccess('User created successfully');
      } else if (selectedUser) {
        const userData: Partial<UserCreate> = {
          email: formEmail,
          full_name: formFullName || undefined,
          is_superuser: formIsSuperuser,
        };
        // Only include password if it was provided
        if (formPassword) {
          userData.password = formPassword;
        }
        await updateUser(selectedUser.id, userData);
        setSuccess('User updated successfully');
      }
      await loadUsers();
      handleModalClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || `Failed to ${modalMode} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteUser(userId);
      setSuccess('User deleted successfully');
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  // Redirect if not superuser
  if (!currentUser?.is_superuser) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="warning" title="Access Denied" isInline>
          You must be an administrator to access this page.
        </Alert>
      </PageSection>
    );
  }

  return (
    <PageSection hasBodyWrapper={false}>
      <Title headingLevel="h1" size="lg" style={{ marginBottom: '1rem' }}>
        Users Management
      </Title>

      {success && (
        <Alert
          variant="success"
          title={success}
          actionClose={<AlertActionCloseButton onClose={() => setSuccess('')} />}
          style={{ marginBottom: '1rem' }}
        />
      )}
      {error && (
        <Alert
          variant="danger"
          title={error}
          actionClose={<AlertActionCloseButton onClose={() => setError('')} />}
          style={{ marginBottom: '1rem' }}
        />
      )}

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button variant="primary" onClick={handleCreateClick}>
              Create User
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <Table aria-label="Users table" variant="compact">
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Full Name</Th>
            <Th>Active</Th>
            <Th>Superuser</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {isLoading ? (
            <Tr>
              <Td colSpan={5}>Loading...</Td>
            </Tr>
          ) : users.length === 0 ? (
            <Tr>
              <Td colSpan={5}>No users found</Td>
            </Tr>
          ) : (
            users.map((user) => (
              <Tr key={user.id}>
                <Td dataLabel="Email">{user.email}</Td>
                <Td dataLabel="Full Name">{user.full_name || '—'}</Td>
                <Td dataLabel="Active">{user.is_active ? 'Yes' : 'No'}</Td>
                <Td dataLabel="Superuser">{user.is_superuser ? 'Yes' : 'No'}</Td>
                <Td dataLabel="Actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleEditClick(user)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(user.id)}
                    isDisabled={user.id === currentUser?.id}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      <Modal
        variant={ModalVariant.medium}
        title={modalMode === 'create' ? 'Create User' : 'Edit User'}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      >
        <Form onSubmit={handleSubmit}>
          <FormGroup label="Email" isRequired fieldId="user-email">
            <TextInput
              isRequired
              type="email"
              id="user-email"
              value={formEmail}
              onChange={(_event, value) => setFormEmail(value)}
            />
          </FormGroup>
          <FormGroup label="Full Name" fieldId="user-full-name">
            <TextInput
              type="text"
              id="user-full-name"
              value={formFullName}
              onChange={(_event, value) => setFormFullName(value)}
            />
          </FormGroup>
          <FormGroup
            label="Password"
            isRequired={modalMode === 'create'}
            fieldId="user-password"
            helperText={modalMode === 'edit' ? 'Leave blank to keep current password' : undefined}
          >
            <TextInput
              isRequired={modalMode === 'create'}
              type="password"
              id="user-password"
              value={formPassword}
              onChange={(_event, value) => setFormPassword(value)}
            />
          </FormGroup>
          <FormGroup fieldId="user-active">
            <Checkbox
              label="Active"
              id="user-active"
              isChecked={formIsActive}
              onChange={(_event, checked) => setFormIsActive(checked)}
            />
          </FormGroup>
          <FormGroup fieldId="user-superuser">
            <Checkbox
              label="Superuser"
              id="user-superuser"
              isChecked={formIsSuperuser}
              onChange={(_event, checked) => setFormIsSuperuser(checked)}
            />
          </FormGroup>
          <ActionGroup>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {modalMode === 'create' ? 'Create' : 'Update'}
            </Button>
            <Button variant="link" onClick={handleModalClose}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </Modal>
    </PageSection>
  );
};

export { UsersManagement };
