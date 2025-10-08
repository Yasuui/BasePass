# Contributing to BasePass

Thank you for your interest in contributing to BasePass! This document provides guidelines and instructions for contributing to the project.

## 🎯 Project Overview

BasePass is an onchain event passport system built on the Base network. It allows attendees to collect proof-of-attendance stamps via signed QR codes.

## 🚀 Getting Started

### Prerequisites

- Node.js v18+ (v22+ recommended)
- npm or yarn
- Git
- MetaMask or compatible Web3 wallet
- Basic knowledge of Solidity and React/Next.js

### Initial Setup

1. **Fork the repository**
   ```bash
   # Click 'Fork' on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/BasePass.git
   cd BasePass
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Compile and test**
   ```bash
   # Compile smart contracts
   npm run compile
   
   # Run tests
   npm test
   ```

## 📝 Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation updates

### Creating a Branch

```bash
# Create and switch to a new feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write clean, documented code**
   - Add NatSpec comments to smart contracts
   - Document complex logic with inline comments
   - Follow existing code style and conventions

2. **Test your changes**
   ```bash
   # Run all tests
   npm test
   
   # Run tests with coverage
   npm run coverage
   
   # Test on local network
   npm run node    # Terminal 1
   npm run deploy  # Terminal 2
   ```

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add descriptive commit message"
   ```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `style:` - Code style changes (formatting, etc.)
- `chore:` - Maintenance tasks

Examples:
```
feat: add batch stamp claiming function
fix: resolve signature verification issue
docs: update README with deployment instructions
test: add edge case tests for event creation
```

### Submitting a Pull Request

1. **Push your changes**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request**
   - Go to GitHub and create a Pull Request from your branch
   - Fill in the PR template with details
   - Link any related issues

3. **PR Requirements**
   - All tests must pass
   - Code must be properly commented
   - No linter errors
   - Update documentation if needed

## 🧪 Testing Guidelines

### Smart Contract Tests

- Write comprehensive tests for all new functions
- Test both success and failure cases
- Include edge cases and boundary conditions
- Aim for >90% code coverage

Example test structure:
```typescript
describe("FeatureName", function () {
  beforeEach(async function () {
    // Setup
  })

  it("Should do something successfully", async function () {
    // Test happy path
  })

  it("Should revert when conditions are not met", async function () {
    // Test failure cases
  })
})
```

### Frontend Tests

- Test user interactions
- Verify component rendering
- Test error states and loading states
- Test wallet connection flows

## 🎨 Code Style

### Solidity

- Follow the [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public/external functions
- Maximum line length: 120 characters
- Use explicit visibility modifiers
- Order: state variables, events, modifiers, constructor, functions

### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow functional programming patterns
- Prefer `const` and `let` over `var`
- Use descriptive variable names
- Add JSDoc comments for complex functions

### React/Next.js

- Use functional components with hooks
- Follow the RORO pattern (Receive an Object, Return an Object)
- Keep components small and focused
- Use Tailwind CSS for styling
- Implement proper error boundaries

## 🔐 Security

### Security Considerations

- Never commit private keys or secrets
- Always validate user inputs
- Use OpenZeppelin contracts when possible
- Follow checks-effects-interactions pattern
- Be aware of reentrancy vulnerabilities

### Reporting Security Issues

If you discover a security vulnerability, please email [SECURITY_EMAIL] instead of using the issue tracker.

## 📚 Documentation

### When to Update Documentation

- Adding new features
- Changing existing functionality
- Fixing bugs that affect usage
- Updating dependencies

### Documentation Locations

- `README.md` - Project overview and setup
- `CONTRIBUTING.md` - This file
- Code comments - Inline documentation
- `/docs` - Detailed documentation (if applicable)

## 🤝 Code Review Process

### What We Look For

1. **Functionality**
   - Does the code work as intended?
   - Are edge cases handled?

2. **Code Quality**
   - Is the code readable and maintainable?
   - Are there proper comments and documentation?

3. **Testing**
   - Are there adequate tests?
   - Do all tests pass?

4. **Security**
   - Are there any security concerns?
   - Are best practices followed?

5. **Performance**
   - Is the code optimized?
   - Are gas costs reasonable (for smart contracts)?

### Review Timeline

- We aim to review PRs within 48 hours
- Complex PRs may take longer
- We may request changes or ask questions

## 🐛 Reporting Bugs

### Before Submitting a Bug Report

1. Check if the bug has already been reported
2. Verify the bug exists in the latest version
3. Collect relevant information (error messages, screenshots, etc.)

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g., Windows 11, macOS 14]
- Node version: [e.g., v20.0.0]
- Browser: [e.g., Chrome, Safari]
```

## 💡 Feature Requests

We welcome feature suggestions! Please:

1. Check if the feature has already been requested
2. Describe the feature and its use case
3. Explain why it would be valuable
4. Consider implementation complexity

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and general discussion
- **Documentation** - Check README and code comments

## 🎉 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited for significant contributions

## 📄 License

By contributing to BasePass, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to BasePass! 🚀

