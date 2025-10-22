# Visual Testing & PatternFly Component Comparison

This document maps screenshots captured by `visual.spec.ts` to their corresponding PatternFly component documentation pages for visual comparison.

## How to Run Visual Tests

```bash
# Prerequisites: Backend + database running
make db-start && make db-init && make db-seed
make dev-backend  # In separate terminal

# Run visual tests (creates screenshots in screenshots/ directory)
cd frontend
npx playwright test visual.spec.ts

# View the screenshots
ls -la screenshots/
```

## Screenshot to PatternFly Component Mapping

### 1. LoginPage Component
**PatternFly Docs**: https://www.patternfly.org/components/login-page

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `01-loginpage-default.png` | Empty login form | [React demo - Basic](https://www.patternfly.org/components/login-page/react#basic) |
| `02-loginpage-filled.png` | Form with values entered | [React demo - With validation](https://www.patternfly.org/components/login-page/react#with-validation) |
| `03-loginpage-error.png` | Error state with helper text | [React demo - With error](https://www.patternfly.org/components/login-page/react#with-error) |

**Our Implementation**: `frontend/src/app/Login/Login.tsx`
- Uses `LoginPage` wrapper with `LoginForm` child component
- Includes error handling with `helperText` and icons
- Email label customization (uses "Email" instead of "Username")

---

### 2. Masthead Component
**PatternFly Docs**: https://www.patternfly.org/components/masthead

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `04-masthead-default.png` | Masthead with logo and user menu | [React demo - Basic](https://www.patternfly.org/components/masthead/react#basic) |
| `05-masthead-dropdown-open.png` | User dropdown menu expanded | [React demo - With toolbar](https://www.patternfly.org/components/masthead/react#with-toolbar) |

**Our Implementation**: `frontend/src/app/AppLayout/AppLayout.tsx`
- `Masthead` with `MastheadMain`, `MastheadBrand`, `MastheadContent`
- User dropdown in `MastheadContent` using `Dropdown` component
- Toggle button for sidebar navigation

---

### 3. Page Component
**PatternFly Docs**: https://www.patternfly.org/components/page

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `06-page-with-sidebar.png` | Full page layout with sidebar nav | [React demo - Vertical nav](https://www.patternfly.org/components/page/react#vertical-nav) |
| `07-page-sidebar-expanded.png` | Expandable nav group open | [React demo - Nav with groups](https://www.patternfly.org/components/page/react#vertical-nav-with-groups) |

**Our Implementation**: `frontend/src/app/AppLayout/AppLayout.tsx`
- `Page` with `PageSidebar`, `Masthead`
- `Nav` with `NavList`, `NavItem`, `NavExpandable`
- Collapsible Settings group

---

### 4. Table Component (Composable)
**PatternFly Docs**: https://www.patternfly.org/components/table

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `08-table-users-default.png` | Users management table | [React demo - Composable](https://www.patternfly.org/components/table/react#composable) |
| `09-table-users-row-hover.png` | Table row hover state | [React demo - Hoverable rows](https://www.patternfly.org/components/table/react#hoverable-rows) |
| `10-table-items-admin.png` | Items table with owner column | [React demo - Compact](https://www.patternfly.org/components/table/react#compact) |
| `11-table-items-regular-user.png` | Items table without owner column | [React demo - Basic](https://www.patternfly.org/components/table/react#basic) |

**Our Implementation**:
- `frontend/src/app/Users/UsersManagement.tsx`
- `frontend/src/app/Items/ItemBrowser.tsx`
- Uses composable: `Table`, `Thead`, `Tbody`, `Tr`, `Th`, `Td`
- Includes `dataLabel` props for mobile responsiveness
- Conditional columns based on user role (Owner column for superusers only)

---

### 5. Modal Component
**PatternFly Docs**: https://www.patternfly.org/components/modal

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `12-modal-create-user-empty.png` | Create user modal (empty) | [React demo - Form modal](https://www.patternfly.org/components/modal/react#form) |
| `13-modal-create-user-filled.png` | Create user modal (filled) | [React demo - Medium](https://www.patternfly.org/components/modal/react#medium) |
| `14-modal-edit-user.png` | Edit user modal | [React demo - Form modal](https://www.patternfly.org/components/modal/react#form) |
| `15-modal-create-item.png` | Create item modal (small) | [React demo - Small](https://www.patternfly.org/components/modal/react#small) |

**Our Implementation**:
- `UsersManagement.tsx`: `ModalVariant.medium` for user forms
- `ItemBrowser.tsx`: `ModalVariant.small` for item forms
- Uses `ModalHeader`, `ModalBody`, `ModalFooter`
- Form components inside modal body

---

### 6. Form Component
**PatternFly Docs**: https://www.patternfly.org/components/form

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `16-form-profile-info.png` | Profile information form | [React demo - Basic](https://www.patternfly.org/components/form/react#basic) |
| `17-form-password-change.png` | Password change form | [React demo - Password field](https://www.patternfly.org/components/form/react#password-field) |
| `18-form-validation-error.png` | Form with validation error | [React demo - Validation](https://www.patternfly.org/components/form/react#validation) |
| `19-form-success-alert.png` | Form with success message | [React demo - With alert](https://www.patternfly.org/components/form/react#with-alert) |

**Our Implementation**: `frontend/src/app/Settings/Profile/ProfileSettings.tsx`
- `Form`, `FormGroup`, `TextInput`, `ActionGroup`, `Button`
- Password inputs with type="password"
- Client-side validation before submission
- Alert components for success/error feedback

---

### 7. Toolbar Component
**PatternFly Docs**: https://www.patternfly.org/components/toolbar

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `20-toolbar-default.png` | Toolbar with search and button | [React demo - Basic](https://www.patternfly.org/components/toolbar/react#basic) |
| `21-toolbar-with-search.png` | Toolbar with active search | [React demo - With search](https://www.patternfly.org/components/toolbar/react#with-search-filter) |

**Our Implementation**: Used in `ItemBrowser.tsx` and `UsersManagement.tsx`
- `Toolbar`, `ToolbarContent`, `ToolbarItem`
- `SearchInput` component in toolbar
- Item count display
- Action buttons (Add Item, Create User)

---

### 8. Drawer Component
**PatternFly Docs**: https://www.patternfly.org/components/drawer

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `22-drawer-open.png` | Item details drawer panel | [React demo - Inline](https://www.patternfly.org/components/drawer/react#inline) |

**Our Implementation**: `frontend/src/app/Items/ItemBrowser.tsx`
- `Drawer`, `DrawerContent`, `DrawerContentBody`, `DrawerPanelContent`
- `DrawerHead` with title and close button
- Item details with `DescriptionList`
- Navigation buttons (First, Previous, Next, Last)
- Inline drawer within page layout

---

### 9. Alert Component
**PatternFly Docs**: https://www.patternfly.org/components/alert

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `23-alert-success.png` | Success alert with close button | [React demo - Success](https://www.patternfly.org/components/alert/react#success) |
| `24-alert-danger.png` | Danger/error alert | [React demo - Danger](https://www.patternfly.org/components/alert/react#danger) |
| `25-alert-warning-access-denied.png` | Warning alert (access control) | [React demo - Warning](https://www.patternfly.org/components/alert/react#warning) |

**Our Implementation**: Used throughout application
- `Alert` with `variant="success"`, `variant="danger"`, `variant="warning"`
- `AlertActionCloseButton` for dismissible alerts
- Inline alerts in forms and pages

---

### 10. Empty State Component
**PatternFly Docs**: https://www.patternfly.org/components/empty-state

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `26-emptystate-no-results.png` | No search results empty state | [React demo - Search](https://www.patternfly.org/components/empty-state/react#no-search-results) |

**Our Implementation**: `frontend/src/app/Items/ItemBrowser.tsx`
- `EmptyState`, `EmptyStateBody`
- Icon component (`SearchIcon`)
- Different empty states:
  - No items yet
  - No search results

---

### 11. Card Component
**PatternFly Docs**: https://www.patternfly.org/components/card

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `27-cards-profile-settings.png` | Profile and password cards | [React demo - Title only](https://www.patternfly.org/components/card/react#title-only) |

**Our Implementation**: `frontend/src/app/Settings/Profile/ProfileSettings.tsx`
- `Card`, `CardTitle`, `CardBody`
- Forms inside card bodies
- Stacked layout with `Stack`, `StackItem`

---

### 12. Dropdown Component
**PatternFly Docs**: https://www.patternfly.org/components/dropdown

| Screenshot | Description | Compare With |
|------------|-------------|--------------|
| `28-dropdown-user-menu.png` | User menu dropdown | [React demo - With toggle](https://www.patternfly.org/components/dropdown/react#with-toggle) |

**Our Implementation**: `frontend/src/app/AppLayout/AppLayout.tsx`
- `Dropdown`, `DropdownList`, `DropdownItem`
- `MenuToggle` with user icon and name
- Menu items: Profile Settings, Logout

---

## Component Version Information

- **PatternFly Version**: 6.2.2
- **React Version**: 18.3.1
- **All components**: Latest stable from `@patternfly/react-core` and `@patternfly/react-table`

## Notes on Implementation Differences

1. **LoginPage**: Simplified background images (removed complex multi-size image object)
2. **Table**: Using composable approach (recommended) vs deprecated config-based Table
3. **Forms**: All use controlled components with React hooks
4. **Responsiveness**: All tables include `dataLabel` props for mobile support
5. **TypeScript**: Full type safety with PatternFly TypeScript definitions

## Viewing Screenshots

After running the visual tests:

```bash
# View all screenshots
open screenshots/  # macOS
xdg-open screenshots/  # Linux
explorer screenshots\  # Windows

# Or use any image viewer
```

## Comparing with PatternFly Demos

1. Open the PatternFly documentation page for each component
2. Click the "React" tab to see React-specific examples
3. Use the interactive demos to see hover states, interactions
4. Compare our screenshots with the demo appearance
5. Note: Some styling differences are expected (colors, spacing) but structure should match

## Running Specific Component Tests

```bash
# Run only LoginPage tests
npx playwright test visual.spec.ts -g "LoginPage"

# Run only Table tests
npx playwright test visual.spec.ts -g "Table Component"

# Run only Modal tests
npx playwright test visual.spec.ts -g "Modal Component"
```
