# Documentation Guide

Welcome! This directory contains comprehensive documentation for the AI Application Screening Platform. Here's what to read based on your role.

## 📚 Quick Navigation

### For New Developers

1. **Start here:** [../README.md](../README.md) – Overview and quick start
2. **Then read:** [../ARCHITECTURE.md](../ARCHITECTURE.md) – System design and component overview
3. **Setup backend:** [../backend/README.md](../backend/README.md) – Backend setup and API reference
4. **Get examples:** [../API_EXAMPLES.md](../API_EXAMPLES.md) – Practical examples to test the API

### For Backend Developers

- [../backend/README.md](../backend/README.md) – API endpoints, models, testing
- [../ARCHITECTURE.md](../ARCHITECTURE.md) – System design, data flow, authentication
- [../API_EXAMPLES.md](../API_EXAMPLES.md) – Curl examples for API testing
- [../CONTRIBUTING.md](../CONTRIBUTING.md) – Coding standards, pull requests

### For DevOps / Infrastructure

- [../DEPLOYMENT.md](../DEPLOYMENT.md) – Deployment strategies, monitoring, scaling
- [../backend/.env.example](../backend/.env.example) – Environment variables template
- [../ARCHITECTURE.md](../ARCHITECTURE.md) – System architecture and components

### For Product / Business

- [../README.md](../README.md) – Features, workflows, stack overview

### For Contributors

- [../CONTRIBUTING.md](../CONTRIBUTING.md) – How to contribute, code style, testing standards
- [../backend/README.md](../backend/README.md) – Running tests, project structure

---

## 📖 Document Descriptions

### README.md (Root)
**What it covers:** High-level project overview, feature highlights, quick start instructions, project structure

**Read if:** You're new to the project and want to understand what it does

**Key sections:**
- Features for students and admins
- Quick start (5 minutes)
- Workflow description
- Technology stack

---

### ARCHITECTURE.md
**What it covers:** System design, technical architecture, component relationships, data flow

**Read if:** You want to understand how the system works internally

**Key sections:**
- System architecture diagram
- Component descriptions
- Data flow for key workflows
- Authentication mechanism
- Database schema
- Performance considerations

---

### backend/README.md
**What it covers:** Backend API reference, setup instructions, models, endpoints, testing

**Read if:** You're building or maintaining the FastAPI backend

**Key sections:**
- Installation & setup
- Project structure
- Complete API endpoint reference (with examples)
- Database models
- Authentication system
- Running tests
- Development workflow
- Error handling

---

### API_EXAMPLES.md
**What it covers:** Practical examples of API calls using curl and Python

**Read if:** You want to test or understand how to use the API

**Key sections:**
- Authentication flow examples
- Creating and submitting applications
- Admin operations
- Testing with curl and Python
- Common scenarios
- Troubleshooting

---

### CONTRIBUTING.md
**What it covers:** Guidelines for contributing, code standards, development workflow

**Read if:** You want to contribute code, fix bugs, or add features

**Key sections:**
- Setting up development environment
- Git workflow and branch naming
- Code style guide (Python, JavaScript)
- Testing requirements
- Database change procedures
- Pull request process
- Issue reporting

---

### DEPLOYMENT.md
**What it covers:** Deploying to production, monitoring, scaling, security hardening

**Read if:** You're deploying or maintaining production infrastructure

**Key sections:**
- Environment setup
- Database configuration
- Application server deployment (Docker, Gunicorn, etc.)
- Frontend deployment options
- Monitoring and logging
- Backups and disaster recovery
- Security hardening
- Performance optimization
- Scaling strategies
- Troubleshooting

---

### backend/.env.example
**What it covers:** Environment variables needed for configuration

**Read if:** You're setting up a new environment (dev, staging, prod)

**Key sections:**
- Database URL
- JWT configuration
- CORS settings
- Optional email configuration

---

## 🔄 Common Workflows

### "I want to add a new API endpoint"

1. Read: backend/README.md (Project Structure)
2. Read: ARCHITECTURE.md (API Layer)
3. Read: CONTRIBUTING.md (Development Workflow)
4. Read: backend/README.md (Testing)
5. Create route, test, update docs

### "I want to fix a bug"

1. Read: README.md (understand what it does)
2. Read: ARCHITECTURE.md (understand how it works)
3. Read: backend/README.md or API_EXAMPLES.md (reproduce the bug)
4. Read: CONTRIBUTING.md (development workflow)
5. Write test, fix code, submit PR

### "I want to deploy to production"

1. Read: DEPLOYMENT.md (all sections)
2. Read: backend/.env.example (configure environment)
3. Read: ARCHITECTURE.md (understand system components)
4. Follow deployment checklist in DEPLOYMENT.md

### "I'm new and want to understand the whole system"

1. README.md (5 min) – Overview
2. ARCHITECTURE.md (15 min) – System design
3. backend/README.md (20 min) – API & models
4. API_EXAMPLES.md (10 min) – Practical examples
5. Run locally and play with the API

---

## 🔍 Finding Specific Information

**"How do I run tests?"**
→ backend/README.md / Running Tests section

**"What are the API endpoints?"**
→ backend/README.md / API Endpoints section (or use `/docs` interactive docs)

**"How does authentication work?"**
→ ARCHITECTURE.md / Authentication & Authorization section

**"How do I set up a development environment?"**
→ backend/README.md / Quick Start section

**"What's the database schema?"**
→ ARCHITECTURE.md / Database Schema section

**"How do I deploy to AWS?"**
→ DEPLOYMENT.md / Application Server Deployment section

**"What code style should I follow?"**
→ CONTRIBUTING.md / Code Style Guide section

**"How do I test the API?"**
→ API_EXAMPLES.md (with curl examples)

---

## 📝 Keeping Documentation Updated

If you add or change features:

1. **API changes** → Update backend/README.md API Endpoints section
2. **Architecture changes** → Update ARCHITECTURE.md
3. **Setup changes** → Update backend/README.md Quick Start
4. **Deployment changes** → Update DEPLOYMENT.md
5. **Code standards changes** → Update CONTRIBUTING.md

Documentation is not optional – it's part of the code review!

---

## 🎓 Learning Resources

### For FastAPI
- [FastAPI Official Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM Guide](https://docs.sqlalchemy.org/en/20/orm/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

### For React
- [React Official Docs](https://react.dev/)
- [React Router Guide](https://reactrouter.com/)

### For Databases
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Principles](https://en.wikipedia.org/wiki/Database_design)

### For DevOps
- [Docker Guide](https://docs.docker.com/)
- [Kubernetes Overview](https://kubernetes.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 💬 Questions or Improvements?

- **Unclear documentation?** Open an issue or discussion
- **Found a typo?** Submit a PR to fix it
- **Want to add docs?** See CONTRIBUTING.md for details

---

**Last updated:** February 2026
