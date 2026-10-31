# VVA — Version & Workflow Automator

**Continuous Visual Documentation, Project Intelligence & Git Workflow Automation**

VVA (Version & Workflow Automator) is a developer platform and cross-system CLI that transforms Git commit history, file diffs, and project activity into publication-quality technical documentation across Word (.docx), PowerPoint (.pptx), and PDF (.pdf) formats.

---

## 🌟 Continuous Visual Documentation & Intelligence

VVA monitors the complete lifecycle of a software project. Rather than treating documentation as a one-time static generation, VVA provides **continuous cumulative intelligence**:

1. **Continuous Incremental vs. Full Documentation**:
   - `vva docs --incremental`: Analyzes work delivered since the last release and updates documentation without redundant processing.
   - `vva docs --full`: Reanalyzes complete Git repository history from project inception and generates comprehensive master documentation.
   - **Safe Backups**: Never overwrites previous documentation without creating an automatic timestamped backup in `.vva/history/backups/`.
2. **Visual Evidence & Data Charting**:
   - Automatically renders publication-quality Matplotlib charts:
     - **Cumulative Commit Timeline & Churn**: Insertions, deletions, and development velocity over time.
     - **Contributor Distribution**: Commit breakdown across team members.
     - **Repository Architecture & Composition**: Multi-language file and component distribution.
     - **System Architecture & Workflow Diagram**: Component flow from Git collector to AI engine and document generators.
   - Collects existing application UI screenshots and diagrams from `screenshots/`, `public/assets/`, `docs/images/`, and `.vva/screenshots/`, clearly distinguishing real application screenshots from generated illustrations.
3. **Multi-Format Document Generation**:
   - **PDF Reports (ReportLab)**: Formatted executive cover page, table of contents, embedded high-resolution charts, milestone tables, and running headers/footers.
   - **Word Documents (python-docx)**: Structured tables with shaded headers, callout boxes, embedded charts, and screenshot captions.
   - **PowerPoint Decks (python-pptx)**: Professional slide deck with architecture diagrams, timeline charts, and feature summaries for viva and demos.
4. **Purpose-Driven Documentation**:
   - `--purpose technical`: System architecture, implementation details, and engineering verification.
   - `--purpose academic`: Thesis and final-year student project format with synopsis and methodology.
   - `--purpose progress`: Milestone and sprint velocity documentation.
   - `--purpose demo`: Visual presentation slide deck for stakeholder and client demonstrations.

---

## 🏗️ Architecture

```text
Developer Activity & Git Worktree
       │
       ▼
Git Repository Monitoring Daemon (vva watch)
       │
       ▼
Node.js VVA Orchestrator & CLI Router
       │
       ▼
Git Data Collector (Commit Diffs & Metadata)
       │
       ▼
Historical Project Database (.vva/history/project-history.json)
       │
       ▼
Python AI Engine (NVIDIA NIM API Client)
       │
       ▼
Visual Evidence Manager & Chart Generator (Matplotlib / Pillow)
       ├──── Commit Activity & Churn Charts
       ├──── Contributor Distribution Charts
       ├──── Repository Composition Breakdown
       ├──── System Architecture Diagrams
       └──── Application Screenshots & Visual Proof
       │
       ▼
Modular Document Generation Engine
       ├──── PDF Report (ReportLab)
       ├──── Word Document (python-docx)
       └──── PowerPoint Deck (python-pptx)
       │
       ▼
Versioned Documentation Releases & Backups (.vva/history/backups/)
```

---

## 🚀 Quickstart & Usage

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/abhirambinil-08/vva--workflow.git
cd vva--workflow

# Install dependencies and link CLI globally
npm install
npm link
```

### 2. Initialize in Any Git Repository

```bash
cd /path/to/my-project

# Run the Intelligent Setup Manager
vva init
```

The Setup Manager will:
- Detect your OS (Linux, macOS, Windows).
- Check Node.js (>= 18) and Python (>= 3.8).
- Automatically create a dedicated virtual environment (`.venv/`) and install Python packages (`openai`, `reportlab`, `python-docx`, `python-pptx`, `matplotlib`, `pillow`, `python-dotenv`).
- Configure `.vva/` directory structure.
- Check NVIDIA API credentials.

---

## 📋 CLI Commands

### Continuous Documentation (`vva docs`)
Generates comprehensive visual documentation with embedded charts, diagrams, and tables:

```bash
# Incremental update (tracks new commits since last release)
vva docs --incremental

# Full documentation regeneration across all Git history
vva docs --full

# Specific output format (pdf, docx, pptx, or all)
vva docs --format all

# Specific documentation purpose
vva docs --purpose technical
vva docs --purpose academic
vva docs --purpose demo

# Dry-run mode (synchronizes history and charts without live AI API calls)
vva docs --dry-run
```

### Continuous Watcher Daemon (`vva watch`)
Continuously monitors your project and automatically triggers documentation updates:

```bash
# Monitor new Git commits (default)
vva watch --mode commits

# Monitor active uncommitted file changes
vva watch --mode changes

# Custom polling interval (milliseconds)
vva watch --interval 3000
```

### System & Repository Diagnostics (`vva status`)
Inspects Git branch, active commit, `.venv` status, visual assets count, and last documentation release:

```bash
vva status
```

### Single-Commit Report Pipeline (`vva report`)
Generates reports focused on a specific commit:

```bash
vva report
vva report --commit abc1234
vva report --dry-run
```

---

## 🔑 NVIDIA NIM API Configuration

To enable live AI analysis:

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Configure your credentials in `.env`:
   ```env
   NVIDIA_API_KEY=nvapi-your-key-here
   NVIDIA_MODEL=openai/gpt-oss-20b
   ```
   *(Active models include: `openai/gpt-oss-20b`, `nvidia/llama-3.1-nemotron-70b-instruct`, `mistralai/mistral-large-2-instruct`).*

---

## 👥 Authors & Team Credits

- **Abhiram Binil**: Lead Orchestrator & CLI Architecture
- **Vishnu G Pillai**: AI Engine & NVIDIA NIM Integration
- **Vinay Bisht**: Document Generation Engine & Visual Intelligence
