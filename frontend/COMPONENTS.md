# Component Documentation

This document describes the purpose and usage of all components in the IOT frontend application.

---

## Component Structure

```
src/components/
├── ui/              # Basic, reusable UI building blocks
├── features/        # Complex, feature-specific components
├── ActuatorButton.jsx
└── LCDDisplay.jsx
```

---

## UI Components (`components/ui/`)

These are atomic, reusable building blocks that form the foundation of the vintage design system.

### ScreenOverlay
**Purpose**: Provides the CRT/scanline visual effect used throughout the application.

**Props**:
- `className` (string): Additional CSS classes
- `grid` (boolean): Toggle grid lines vs just scanlines (default: true)

**Used in**: Terminal, LCDDisplay, Dashboard (AI Status)

**Example**:
```jsx
<ScreenOverlay />
<ScreenOverlay grid={false} />
```

---

### VintagePanel
**Purpose**: Container component with vintage border, background, and optional header.

**Props**:
- `title` (string): Panel title (renders with border-bottom)
- `header` (ReactNode): Custom header component
- `children` (ReactNode): Panel content
- `className` (string): Additional CSS classes
- `type` (string): Panel variant - 'default' | 'inset' | 'screen'

**Used in**: Dashboard, Archives, Login

**Example**:
```jsx
<VintagePanel title="SENSOR READINGS">
  <LCDDisplay label="TEMPERATURE" value={24} unit="°C" />
</VintagePanel>
```

---

### VintageButton
**Purpose**: Standard button with vintage styling and multiple variants.

**Props**:
- `onClick` (function): Click handler
- `children` (ReactNode): Button content
- `type` (string): Button type - 'button' | 'submit' (default: 'button')
- `variant` (string): Style variant - 'primary' | 'secondary' | 'danger' (default: 'primary')
- `fullWidth` (boolean): Make button full width (default: false)
- `className` (string): Additional CSS classes

**Used in**: Login

**Example**:
```jsx
<VintageButton type="submit" variant="primary">
  Authenticate
</VintageButton>
```

---

### VintageInput
**Purpose**: Styled input field with label and error state support.

**Props**:
- `label` (string): Input label
- `value` (string): Input value
- `onChange` (function): Change handler
- `type` (string): Input type (default: 'text')
- `placeholder` (string): Placeholder text
- `error` (string): Error message to display
- `autoComplete` (string): Autocomplete attribute (default: 'off')

**Used in**: Login

**Example**:
```jsx
<VintageInput
  label="Username"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
  placeholder="ENTER ID..."
/>
```

---

## Feature Components (`components/features/`)

These are complex, feature-specific components that encapsulate complete UI patterns.

### VintageTerminal
**Purpose**: Complete terminal interface with command history, input, and CRT effects.

**Props**:
- `history` (array): Array of command history strings
- `input` (string): Current input value
- `onInputChange` (function): Input change handler
- `onCommand` (function): Command submission handler (keydown)
- `inputRef` (ref): Ref for scroll-to-bottom functionality

**Used in**: Terminal view

**Example**:
```jsx
<VintageTerminal
  history={history}
  input={input}
  onInputChange={(e) => setInput(e.target.value)}
  onCommand={handleCommand}
  inputRef={endRef}
/>
```

---

### VintageTable
**Purpose**: Data table component with custom row rendering and vintage styling.

**Props**:
- `columns` (array): Array of column header strings
- `data` (array): Array of data objects
- `renderRow` (function): Function to render each row - `(row, index) => JSX`
- `emptyMessage` (string): Message when no data (default: 'NO DATA LOGGED YET...')

**Used in**: Archives view

**Example**:
```jsx
<VintageTable
  columns={['TIMESTAMP', 'TEMP', 'HUMID', 'CO', 'STATUS']}
  data={historyData}
  renderRow={(entry, idx) => (
    <tr key={idx}>
      <td>{entry.time}</td>
      <td>{entry.temp}°C</td>
    </tr>
  )}
/>
```

---

## Other Components (`components/`)

### ActuatorButton
**Purpose**: Toggle button for hardware actuator controls with LED indicator.

**Props**:
- `label` (string): Button label
- `active` (boolean): Active/inactive state
- `onClick` (function): Click handler
- `color` (string): Color variant (default: 'vintage-coffee')

**Used in**: Dashboard

---

### LCDDisplay
**Purpose**: VFD-style display for sensor readings with warning states.

**Props**:
- `label` (string): Display label
- `value` (number): Value to display
- `unit` (string): Unit of measurement
- `warning` (boolean): Enable warning state (red, pulsing)

**Used in**: Dashboard

**Example**:
```jsx
<LCDDisplay 
  label="TEMPERATURE" 
  value={sensors.temp} 
  unit="°C" 
  warning={sensors.temp > 30} 
/>
```

---

## Design Principles

1. **UI Components**: Atomic, stateless, highly reusable
2. **Feature Components**: Complex, may contain state/logic, domain-specific
3. **Separation of Concerns**: Views handle business logic, components handle UI
4. **Vintage Theme**: All components follow the industrial/vintage design system
