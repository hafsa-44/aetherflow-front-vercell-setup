# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
### Architecture of Home Page 
# Component Architecture & Data Flow

## Component Hierarchy

```
App.jsx
  └── Routes
      ├── Public Routes
      │   ├── /signup → SignUp
      │   └── /signin → SignIn
      │
      └── Protected Routes (ProtectedRoute.jsx)
          └── Layout.jsx
              ├── NavBar
              │   ├── Logo
              │   ├── Navigation Links
              │   ├── Search Bar
              │   ├── Notification Bell
              │   └── User Profile Dropdown
              │       ├── Avatar
              │       ├── Profile Info
              │       ├── View Profile
              │       ├── Settings
              │       └── Logout
              │
              ├── Sidebar
              │   ├── Toggle Button
              │   ├── New Project Button
              │   ├── Navigation Items
              │   │   ├── Dashboard
              │   │   ├── Projects
              │   │   ├── Tasks
              │   │   ├── Team
              │   │   ├── Calendar
              │   │   └── Analytics
              │   └── User Info (collapsed)
              │
              └── <Outlet> (Main Content)
                  └── UserLogPage
                      ├── Welcome Section
                      ├── Stats Cards
                      │   ├── Active Projects
                      │   ├── Total Tasks
                      │   └── Completed
                      ├── ProjectCardSlider
                      │   ├── Header
                      │   ├── Navigation Arrows
                      │   ├── ProjectCard (x3)
                      │   │   ├── Color Header
                      │   │   ├── Title & Menu
                      │   │   ├── Description
                      │   │   ├── Progress Bar
                      │   │   ├── Stats (Team, Deadline)
                      │   │   ├── Tasks Counter
                      │   │   └── View Button
                      │   └── Dot Indicators
                      └── CreateProjectModal
                          ├── Form Fields
                          │   ├── Project Name
                          │   ├── Description
                          │   ├── Category
                          │   ├── Deadline
                          │   ├── Collaborative Toggle
                          │   └── Visibility Options
                          └── Action Buttons
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         App.jsx                              │
│  - Routes configuration                                      │
│  - Protected route wrapper                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Layout.jsx                             │
│  - Fetches user data: useEffect → api.get("/users/me")     │
│  - Manages sidebar state: isSidebarOpen                     │
│  - Passes user data via Outlet context                      │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
    [NavBar]            [Sidebar]           [UserLogPage]
         ↓                    ↓                    ↓
  User Avatar      Navigation Items      Project Data
  Profile Card     Toggle Sidebar        Modal State
  Logout Action    Create Project        Stats Display
```

## State Management Flow

### 1. User Authentication State
```
localStorage (token)
    ↓
ProtectedRoute.jsx (checks token)
    ↓
Layout.jsx (fetches user via API)
    ↓
useOutletContext → UserLogPage
    ↓
User data available in all child components
```

### 2. Sidebar State
```
Layout.jsx
    ↓
useState(isSidebarOpen)
    ↓
    ├─→ NavBar (receives onToggleSidebar)
    └─→ Sidebar (receives isOpen, onToggle)
```

### 3. Project Creation Flow
```
Sidebar "New Project" button
    ↓
window.dispatchEvent("openProjectModal")
    ↓
UserLogPage listens via useEffect
    ↓
setIsModalOpen(true)
    ↓
CreateProjectModal renders
    ↓
Form submission → handleCreateProject
    ↓
api.post("/projects", data)
    ↓
Update local projects state
    ↓
ProjectCardSlider re-renders
```

### 4. Projects Data Flow
```
UserLogPage mounts
    ↓
useEffect → api.get("/projects")
    ↓
setProjects(data)
    ↓
Pass to ProjectCardSlider as props
    ↓
ProjectCardSlider renders cards
    ↓
User clicks "New Project"
    ↓
Opens modal → Creates project
    ↓
Projects state updates
    ↓
Slider automatically shows new project
```

## Event Communication Pattern

### Window Event System (Sidebar → UserLogPage)
```javascript
// Sidebar.jsx
const handleCreateProject = () => {
  const event = new CustomEvent("openProjectModal");
  window.dispatchEvent(event);
};

// UserLogPage.jsx
useEffect(() => {
  const handleOpenModal = () => setIsModalOpen(true);
  window.addEventListener("openProjectModal", handleOpenModal);
  return () => window.removeEventListener("openProjectModal", handleOpenModal);
}, []);
```

## Props Flow Diagram

```
Layout
  ├─ user (fetched from API)
  ├─ isSidebarOpen (state)
  └─ handleToggleSidebar (function)
      ↓
      ├─→ NavBar
      │     ├─ user
      │     └─ onToggleSidebar
      │
      ├─→ Sidebar
      │     ├─ isOpen
      │     ├─ onToggle
      │     ├─ user
      │     └─ onCreateProject
      │
      └─→ <Outlet context={{ user }}>
            ↓
          UserLogPage
            ├─ useOutletContext() → { user }
            ├─ projects (state)
            ├─ isModalOpen (state)
            └─ handleCreateProject (function)
                  ↓
                  ├─→ ProjectCardSlider
                  │     ├─ projects
                  │     └─ onCreateProject
                  │
                  └─→ CreateProjectModal
                        ├─ isOpen
                        ├─ onClose
                        └─ onCreateProject
```

## API Integration Points

```
┌──────────────────────────────────────────────────┐
│              Backend API Endpoints                │
├──────────────────────────────────────────────────┤
│                                                   │
│  Authentication:                                  │
│  • GET  /api/users/me     ──────→ Layout.jsx    │
│                                                   │
│  Projects:                                        │
│  • GET  /api/projects     ──────→ UserLogPage    │
│  • POST /api/projects     ──────→ UserLogPage    │
│  • GET  /api/projects/:id ──────→ (future)       │
│  • PUT  /api/projects/:id ──────→ (future)       │
│  • DEL  /api/projects/:id ──────→ (future)       │
│                                                   │
└──────────────────────────────────────────────────┘
```

## Responsive Behavior Flow

```
Window Resize Event
    ↓
useEffect in Layout.jsx
    ↓
window.innerWidth < 1024
    ↓
    ├─ Yes → setIsSidebarOpen(false)
    │         Sidebar becomes overlay
    │         Mobile nav shows
    │
    └─ No  → setIsSidebarOpen(true)
              Sidebar stays visible
              Desktop nav shows

ProjectCardSlider also listens to resize:
    ↓
    ├─ < 768px   → 1 card per view
    ├─ 768-1024  → 2 cards per view
    └─ > 1024px  → 3 cards per view
```

## CSS Class Organization

```
Global Styles (App.css)
    ├─ :root variables
    ├─ Reset & base styles
    ├─ Animations (@keyframes)
    ├─ Utility classes
    └─ Responsive breakpoints

Tailwind Classes (inline)
    ├─ Layout (flex, grid)
    ├─ Spacing (p-, m-)
    ├─ Colors (bg-, text-)
    └─ Responsive (md:, lg:)

Component-specific Styles
    └─ <style jsx> blocks for animations
```

## File Dependencies

```
NavBar.jsx
  ├─ react-router-dom (Link, useNavigate)
  ├─ lucide-react (icons)
  └─ assets/logo.svg

Sidebar.jsx
  ├─ react-router-dom (Link, useLocation)
  └─ lucide-react (icons)

CreateProjectModal.jsx
  └─ lucide-react (icons)

ProjectCardSlider.jsx
  └─ lucide-react (icons)

Layout.jsx
  ├─ react-router-dom (Outlet)
  ├─ NavBar
  ├─ Sidebar
  └─ api

UserLogPage.jsx
  ├─ react-router-dom (useOutletContext)
  ├─ ProjectCardSlider
  ├─ CreateProjectModal
  └─ api
```

## Initialization Sequence

```
1. App loads
2. Check localStorage for token
3. Route to /dashboard (if token) or /signup (if no token)
4. Layout.jsx mounts
5. Fetch user data
6. Render NavBar with user
7. Render Sidebar with user
8. UserLogPage mounts
9. Fetch projects data
10. Render ProjectCardSlider with projects
11. Listen for modal events
12. Ready for user interaction
```

This architecture ensures:
- ✅ Clean separation of concerns
- ✅ Unidirectional data flow
- ✅ Easy to test components
- ✅ Simple to add new features
- ✅ No prop drilling
- ✅ Efficient re-renders
