# Natural Language Workflow Creation Tests

This directory contains comprehensive tests for the Natural Language Workflow Creation feature, following AI Pragmatic Programmer principles with focus on test-driven development and validation.

## Test Structure

### 1. Unit Tests (`workflowGenerationService.test.ts`)
Tests the core workflow generation service in isolation:
- **Workflow Generation**: Tests successful generation from various natural language inputs
- **Error Handling**: Validates graceful handling of API failures, missing keys, and malformed responses
- **Workflow Validation**: Tests the workflow validation logic for structural correctness
- **Node Type Management**: Verifies available node types and their configurations

**Key Test Cases:**
- Simple email workflow generation
- Complex GitHub → AI → Email workflow (David's use case)
- Missing API key scenarios
- AI service errors
- Invalid JSON responses from AI
- Workflow validation (missing triggers, isolated nodes, missing config)

### 2. Component Tests (`NaturalLanguageWorkflowCreator.test.tsx`)
Tests the React component behavior and user interactions:
- **UI Rendering**: Verifies all UI elements render correctly
- **User Input**: Tests textarea input, button states, and form interactions
- **Workflow Generation**: Tests the component's integration with the service
- **Error States**: Validates error message display and recovery
- **Loading States**: Tests loading indicators and disabled states

**Key Test Cases:**
- Welcome message and initial state
- Example prompt functionality
- User input handling and validation
- Workflow generation success/error flows
- Question handling for additional user input
- Button state management (enabled/disabled)
- Keyboard shortcuts (Enter to submit)

### 3. Integration Tests (`integration.test.tsx`)
Tests the complete end-to-end workflow creation flow:
- **David's Use Case**: Full implementation of the GitHub PR → Claude → Email workflow
- **API Integration**: Tests actual service calls with mocked responses
- **Error Recovery**: Tests complete error flows and user recovery paths
- **UX Flow**: Validates the entire user experience from input to execution

**Key Test Cases:**
- Complete David's workflow creation (GitHub PR analysis with email reports)
- API key requirement and configuration flow
- Workflow generation failure and recovery
- Malformed AI response handling
- User experience optimization (loading states, feedback, etc.)

## Test Data & Scenarios

### David's Use Case (Primary Test Scenario)
```typescript
// User Input: "I need to analyze code commits and generate weekly reports"
// Expected Output: 4-node workflow (Trigger → GitHub → Claude → Gmail)
const davidsWorkflow = {
  nodes: [
    { type: 'trigger', label: 'GitHub PR Trigger' },
    { type: 'github', label: 'GitHub PR Reader' },
    { type: 'universal_agent', label: 'Claude Code Reviewer' },
    { type: 'gmail', label: 'Email Report Sender' }
  ],
  edges: 3,
  estimatedTime: 25,
  requiredPermissions: ['github.read', 'gmail.send'],
  requiredApiKeys: ['anthropic', 'github']
}
```

### Test Coverage Areas

1. **Service Layer Tests**:
   - ✅ Natural language parsing
   - ✅ Workflow generation logic
   - ✅ Error handling and validation
   - ✅ API key management
   - ✅ Node type definitions

2. **Component Layer Tests**:
   - ✅ UI rendering and interactions
   - ✅ State management
   - ✅ Event handling
   - ✅ Loading and error states
   - ✅ User input validation

3. **Integration Tests**:
   - ✅ End-to-end workflow creation
   - ✅ API integration
   - ✅ Error recovery flows
   - ✅ User experience validation

## Running Tests

```bash
# Run all natural language workflow tests
npm test -- tests/natural-language-workflow

# Run specific test file
npm test -- workflowGenerationService.test.ts

# Run with coverage
npm test -- --coverage tests/natural-language-workflow

# Run in watch mode for development
npm test -- --watch tests/natural-language-workflow
```

## Test Principles Applied

### AI Pragmatic Programmer Guidelines
1. **Plan**: Tests capture intent before implementation
2. **Prompt**: Structured test scenarios with explicit constraints
3. **Generate & Review**: Tests validate AI-generated workflows
4. **Refine**: Tests ensure iterative improvement of prompts/generation
5. **Ship**: Tests gate deployment with validation

### Test Quality Standards
- **Golden Sets**: Deterministic test cases for workflow generation
- **Adversarial Testing**: Edge cases, malformed inputs, error scenarios
- **Regression Protection**: Tests prevent breaking changes to core functionality
- **User-Centric**: Tests validate actual user workflows and pain points

## Mock Strategy

### External Dependencies
- **API Calls**: Mocked with realistic response data
- **localStorage**: Mocked for API key storage testing
- **UI Components**: Mocked to focus on logic testing
- **Icons**: Simplified test-friendly mocks

### Test Data Quality
- **Realistic Scenarios**: Based on actual user requirements (David's use case)
- **Edge Cases**: Empty inputs, malformed data, network failures
- **Comprehensive Coverage**: All major code paths and error conditions

## Future Test Enhancements

1. **Visual Regression Tests**: Ensure UI consistency
2. **Performance Tests**: Validate response times for workflow generation
3. **Accessibility Tests**: Ensure screen reader compatibility
4. **Mobile Tests**: Validate responsive behavior
5. **E2E Browser Tests**: Full browser automation with Playwright