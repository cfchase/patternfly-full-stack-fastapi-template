import * as React from 'react';
import {
  PageSection,
  Title,
  Button,
  Alert,
  AlertVariant,
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Content,
  Stack,
  StackItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  ActionGroup,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import { EditIcon, TrashIcon } from '@patternfly/react-icons';
import { itemService, Item, ItemCreate, ItemUpdate } from '@app/services/itemService';

const ItemBrowser: React.FunctionComponent = () => {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [searchValue, setSearchValue] = React.useState('');
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [formTitle, setFormTitle] = React.useState('');
  const [formDescription, setFormDescription] = React.useState('');

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    if (!searchValue) return items;
    const searchLower = searchValue.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
    );
  }, [searchValue, items]);

  const selectedItem = React.useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId),
    [filteredItems, selectedItemId]
  );

  const selectedItemIndex = React.useMemo(
    () => filteredItems.findIndex((item) => item.id === selectedItemId),
    [filteredItems, selectedItemId]
  );

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itemService.getItems();
      setItems(response.data);
    } catch (err) {
      setError('Failed to load items');
      console.error('Error loading items:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadItems();
  }, []);

  const handleRowClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDrawerExpanded(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerExpanded(false);
  };

  const handleFirstItem = () => {
    if (filteredItems.length > 0) {
      setSelectedItemId(filteredItems[0].id);
      setIsDrawerExpanded(true);
    }
  };

  const handlePreviousItem = () => {
    if (selectedItemIndex > 0) {
      setSelectedItemId(filteredItems[selectedItemIndex - 1].id);
    }
  };

  const handleNextItem = () => {
    if (selectedItemIndex < filteredItems.length - 1) {
      setSelectedItemId(filteredItems[selectedItemIndex + 1].id);
    }
  };

  const handleLastItem = () => {
    if (filteredItems.length > 0) {
      setSelectedItemId(filteredItems[filteredItems.length - 1].id);
      setIsDrawerExpanded(true);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Item) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormTitle('');
    setFormDescription('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingItem) {
        // Update existing item
        const updates: ItemUpdate = {
          title: formTitle,
          description: formDescription || undefined,
        };
        await itemService.updateItem(editingItem.id, updates);
        setSuccess('Item updated successfully');
      } else {
        // Create new item
        const newItem: ItemCreate = {
          title: formTitle,
          description: formDescription || undefined,
        };
        await itemService.createItem(newItem);
        setSuccess('Item created successfully');
      }
      handleCloseModal();
      loadItems();
    } catch (err) {
      setError(`Failed to ${editingItem ? 'update' : 'create'} item`);
      console.error('Error saving item:', err);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await itemService.deleteItem(item.id);
      setSuccess('Item deleted successfully');
      loadItems();
    } catch (err) {
      setError('Failed to delete item');
      console.error('Error deleting item:', err);
    }
  };

  const panelContent = selectedItem && (
    <DrawerPanelContent widths={{ default: 'width_50' }}>
      <DrawerHead>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h2" size="xl">
              {selectedItem.title}
            </Title>
          </StackItem>
          <StackItem>
            <Content component="p">{selectedItem.description || 'No description provided'}</Content>
          </StackItem>
        </Stack>
        <DrawerActions>
          <DrawerCloseButton onClick={handleCloseDrawer} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelContent>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Item ID</DescriptionListTerm>
                <DescriptionListDescription>{selectedItem.id}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Owner ID</DescriptionListTerm>
                <DescriptionListDescription>{selectedItem.owner_id}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  Actions
                </Title>
              </StackItem>
              <StackItem>
                <ActionGroup>
                  <Button variant="primary" onClick={() => handleOpenEditModal(selectedItem)}>Edit Item</Button>
                  <Button variant="danger" onClick={() => handleDelete(selectedItem)}>Delete</Button>
                </ActionGroup>
              </StackItem>
            </Stack>
          </StackItem>
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  Navigation
                </Title>
              </StackItem>
              <StackItem>
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      onClick={handleFirstItem}
                      isDisabled={selectedItemIndex === 0}
                      size="sm"
                    >
                      First
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      onClick={handlePreviousItem}
                      isDisabled={selectedItemIndex === 0}
                      size="sm"
                    >
                      Previous
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Content component="p">
                      Item {selectedItemIndex + 1} of {filteredItems.length}
                    </Content>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      onClick={handleNextItem}
                      isDisabled={selectedItemIndex === filteredItems.length - 1}
                      size="sm"
                    >
                      Next
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      onClick={handleLastItem}
                      isDisabled={selectedItemIndex === filteredItems.length - 1}
                      size="sm"
                    >
                      Last
                    </Button>
                  </FlexItem>
                </Flex>
              </StackItem>
            </Stack>
          </StackItem>
        </Stack>
      </DrawerPanelContent>
    </DrawerPanelContent>
  );

  const drawerContent = (
    <Stack hasGutter>
      <StackItem>
        <Toolbar>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                placeholder="Search by title, ID, or description"
                value={searchValue}
                onChange={(_event, value) => setSearchValue(value)}
                onClear={() => setSearchValue('')}
                style={{ width: '400px' }}
              />
            </ToolbarItem>
            <ToolbarItem>
              <Content component="p">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </Content>
            </ToolbarItem>
            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={handleOpenCreateModal}>
                Add Item
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </StackItem>
      <StackItem>
        {error && (
          <Alert variant={AlertVariant.danger} title="Error" isInline>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant={AlertVariant.success} title="Success" isInline>
            {success}
          </Alert>
        )}
      </StackItem>
      <StackItem>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Spinner size="xl" />
          </div>
        ) : filteredItems.length > 0 ? (
          <Table variant="compact">
            <Thead>
              <Tr>
                <Th width={25}>Title</Th>
                <Th width={60}>Description</Th>
                <Th width={15}>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredItems.map((item) => (
                <Tr
                  key={item.id}
                  isClickable
                  isRowSelected={item.id === selectedItemId}
                  onRowClick={() => handleRowClick(item.id)}
                >
                  <Td dataLabel="Title">{item.title}</Td>
                  <Td dataLabel="Description">{item.description || <em>No description</em>}</Td>
                  <Td dataLabel="Actions" isActionCell>
                    <Flex spaceItems={{ default: 'spaceItemsNone' }}>
                      <FlexItem>
                        <Button
                          variant="plain"
                          aria-label="Edit item"
                          icon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                        />
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          aria-label="Delete item"
                          icon={<TrashIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                        />
                      </FlexItem>
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : items.length === 0 && !searchValue ? (
          <EmptyState>
            <Title headingLevel="h4" size="lg">
              No items yet
            </Title>
            <EmptyStateBody>
              Create your first item to get started.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <EmptyState>
            <SearchIcon />
            <Title headingLevel="h4" size="lg">
              No items found
            </Title>
            <EmptyStateBody>Try adjusting your search criteria</EmptyStateBody>
          </EmptyState>
        )}
      </StackItem>
    </Stack>
  );

  return (
    <>
      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h1">Items</Title>
          </StackItem>
          <StackItem>
            <Content component="p">
              Search for items, view their details, and perform actions. Click on any row to view details in the side panel.
            </Content>
          </StackItem>
          <StackItem isFilled>
            <Drawer isExpanded={isDrawerExpanded} isInline>
              <DrawerContent panelContent={panelContent}>
                <DrawerContentBody>{drawerContent}</DrawerContentBody>
              </DrawerContent>
            </Drawer>
          </StackItem>
        </Stack>
      </PageSection>

      <Modal
        variant={ModalVariant.small}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="item-modal-title"
        aria-describedby="item-modal-description"
      >
        <ModalHeader
          title={editingItem ? 'Edit Item' : 'Create Item'}
          description={editingItem ? 'Update the item details below.' : 'Enter the item details below.'}
          descriptorId="item-modal-description"
          labelId="item-modal-title"
        />
        <ModalBody>
          <Form id="item-form" onSubmit={handleSubmit}>
            <FormGroup label="Title" isRequired fieldId="item-title">
              <TextInput
                isRequired
                type="text"
                id="item-title"
                name="item-title"
                value={formTitle}
                onChange={(_event, value) => setFormTitle(value)}
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="item-description">
              <TextArea
                id="item-description"
                name="item-description"
                value={formDescription}
                onChange={(_event, value) => setFormDescription(value)}
                rows={4}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button key="submit" variant="primary" form="item-form" onClick={handleSubmit}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
          <Button key="cancel" variant="link" onClick={handleCloseModal}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export { ItemBrowser };
