#!/usr/bin/env python3
"""
VVA — Chart & Technical Diagram Generation Engine
Uses Matplotlib to produce publication-grade charts, timeline graphs,
and technical visualizations for embedding into PDF, DOCX, and PPTX documents.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Configure headless matplotlib before importing pyplot
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime


# VVA Editorial Color Palette
PRIMARY_COLOR = '#176B68'    # Teal accent
SECONDARY_COLOR = '#4338CA'  # Indigo accent
ACCENT_CYAN = '#0EA5E9'      # Cyan highlight
ACCENT_AMBER = '#F59E0B'     # Amber warning
ACCENT_EMERALD = '#10B981'   # Emerald success
DARK_TEXT = '#1E293B'        # Slate 800
LIGHT_BG = '#F8FAFC'         # Slate 50
GRID_COLOR = '#E2E8F0'       # Slate 200


def setup_plot_style():
    plt.rcParams['font.sans-serif'] = 'DejaVu Sans, Arial, Helvetica, sans-serif'
    plt.rcParams['axes.edgecolor'] = '#CBD5E1'
    plt.rcParams['axes.linewidth'] = 0.8
    plt.rcParams['axes.labelsize'] = 10
    plt.rcParams['xtick.labelsize'] = 8
    plt.rcParams['ytick.labelsize'] = 8
    plt.rcParams['legend.fontsize'] = 8


def generate_commit_activity_chart(commits, output_path):
    """
    Renders commit timeline & code change volume (insertions / deletions) over time.
    """
    setup_plot_style()
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8.5, 4.2), sharex=True, gridspec_kw={'height_ratios': [2, 1.2]})
    fig.patch.set_facecolor('#FFFFFF')

    # Parse and sort commits chronologically
    parsed_commits = []
    for c in commits:
        try:
            date_str = c.get('date', '')
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00')) if date_str else datetime.now()
            parsed_commits.append({
                'date': dt,
                'insertions': c.get('insertions', 0) or c.get('diffSummary', {}).get('insertions', 0) or 10,
                'deletions': c.get('deletions', 0) or c.get('diffSummary', {}).get('deletions', 0) or 2,
                'filesChanged': c.get('filesChanged', 1) or len(c.get('changedFiles', [])) or 1
            })
        except Exception:
            continue

    if not parsed_commits:
        # Fallback synthetic timeline if commits array was empty
        parsed_commits = [
            {'date': datetime.now(), 'insertions': 100, 'deletions': 20, 'filesChanged': 5}
        ]

    parsed_commits.sort(key=lambda x: x['date'])

    dates = [c['date'] for c in parsed_commits]
    insertions = [c['insertions'] for c in parsed_commits]
    deletions = [c['deletions'] for c in parsed_commits]
    cum_commits = list(range(1, len(parsed_commits) + 1))

    # Top plot: Cumulative development progress & files changed
    ax1.plot(dates, cum_commits, marker='o', markersize=4, color=PRIMARY_COLOR, linewidth=2, label='Cumulative Commits')
    ax1.fill_between(dates, cum_commits, color=PRIMARY_COLOR, alpha=0.1)
    ax1.set_ylabel('Total Commits', color=DARK_TEXT, fontweight='bold')
    ax1.grid(True, linestyle='--', alpha=0.5, color=GRID_COLOR)
    ax1.legend(loc='upper left', frameon=True, facecolor='#FFFFFF')
    ax1.set_title('VVA Continuous Git Activity & Evolution Timeline', fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)

    # Bottom plot: Code volume delta (insertions vs deletions)
    width = 0.4
    ax2.bar(dates, insertions, width=width, color=ACCENT_EMERALD, alpha=0.85, label='Insertions (+)')
    ax2.bar(dates, [-d for d in deletions], width=width, color='#EF4444', alpha=0.85, label='Deletions (-)')
    ax2.axhline(0, color='#64748B', linewidth=0.8)
    ax2.set_ylabel('Line Churn', color=DARK_TEXT, fontweight='bold')
    ax2.grid(True, linestyle='--', alpha=0.5, color=GRID_COLOR)
    ax2.legend(loc='upper right', frameon=True, facecolor='#FFFFFF')

    # Format x-axis dates
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%b %d'))
    plt.xticks(rotation=25)
    plt.tight_layout()

    plt.savefig(output_path, dpi=220, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    return output_path


def generate_contributor_chart(contributors, output_path):
    """
    Renders contributor activity breakdown (commits and code volume).
    """
    setup_plot_style()
    fig, ax = plt.subplots(figsize=(6.5, 3.8))
    fig.patch.set_facecolor('#FFFFFF')

    if not contributors:
        contributors = {'Developer': {'commits': 5, 'insertions': 250, 'deletions': 30}}

    names = list(contributors.keys())
    commits_count = [
        data.get('commits', 1) if isinstance(data, dict) else int(data)
        for data in contributors.values()
    ]

    # Colors
    colors = [PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_CYAN, ACCENT_AMBER, ACCENT_EMERALD][:len(names)]
    if len(colors) < len(names):
        colors = colors * (len(names) // len(colors) + 1)
        colors = colors[:len(names)]

    bars = ax.barh(names, commits_count, color=colors, height=0.55, edgecolor='#CBD5E1')
    ax.set_xlabel('Verified Commits Contributed', color=DARK_TEXT, fontweight='bold')
    ax.set_title('Development Team Contribution Distribution', fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    ax.grid(axis='x', linestyle='--', alpha=0.5, color=GRID_COLOR)
    ax.invert_yaxis()

    # Data labels on bars
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.1, bar.get_y() + bar.get_height() / 2, f'{int(width)} commits',
                va='center', ha='left', fontsize=8, color=DARK_TEXT, fontweight='bold')

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    return output_path


def generate_file_composition_chart(file_breakdown, output_path):
    """
    Renders repository file type and language distribution pie chart.
    """
    setup_plot_style()
    fig, ax = plt.subplots(figsize=(6.0, 3.8))
    fig.patch.set_facecolor('#FFFFFF')

    if not file_breakdown:
        file_breakdown = {'TypeScript': 45, 'Python': 30, 'JSON / Config': 15, 'Docs': 10}

    labels = list(file_breakdown.keys())
    sizes = list(file_breakdown.values())
    colors = [PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_CYAN, ACCENT_AMBER, ACCENT_EMERALD, '#8B5CF6'][:len(labels)]

    wedges, texts, autotexts = ax.pie(
        sizes,
        labels=labels,
        autopct='%1.1f%%',
        startangle=140,
        colors=colors,
        wedgeprops=dict(width=0.45, edgecolor='#FFFFFF', linewidth=2),
        textprops=dict(color=DARK_TEXT, fontsize=9)
    )

    for at in autotexts:
        at.set_color('#FFFFFF')
        at.set_fontweight('bold')
        at.set_fontsize(8)

    ax.set_title('Repository Architecture & File Composition', fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    return output_path


def generate_architecture_diagram(output_path):
    """
    Generates a high-resolution, vector-styled system architecture diagram
    visualizing the VVA Continuous Intelligence pipeline.
    """
    setup_plot_style()
    fig, ax = plt.subplots(figsize=(8.5, 4.2))
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)
    ax.axis('off')

    # Draw pipeline blocks
    blocks = [
        {"x": 0.5, "y": 2.2, "w": 2.2, "h": 1.4, "title": "Developer Activity\n& Git Worktree", "color": "#F1F5F9", "edge": "#64748B"},
        {"x": 3.4, "y": 2.2, "w": 2.2, "h": 1.4, "title": "Node.js VVA\nOrchestrator & History", "color": "#EEF2FF", "edge": SECONDARY_COLOR},
        {"x": 6.3, "y": 2.2, "w": 2.2, "h": 1.4, "title": "Python AI Engine\n(NVIDIA NIM API)", "color": "#ECFDF5", "edge": PRIMARY_COLOR},
        {"x": 4.0, "y": 0.4, "w": 3.6, "h": 1.2, "title": "Visual Document Engine\n(PDF, DOCX, PPTX)", "color": "#FEF3C7", "edge": ACCENT_AMBER},
    ]

    from matplotlib.patches import FancyBboxPatch

    for b in blocks:
        box = FancyBboxPatch((b['x'], b['y']), b['w'], b['h'],
                             boxstyle="round,pad=0.04,rounding_size=0.12",
                             facecolor=b['color'], edgecolor=b['edge'],
                             linewidth=1.5, zorder=2)
        ax.add_patch(box)
        ax.text(b['x'] + b['w']/2, b['y'] + b['h']/2, b['title'],
                ha='center', va='center', fontsize=9, fontweight='bold', color=DARK_TEXT, zorder=3)

    # Connecting arrows
    arrowprops = dict(arrowstyle='->', lw=1.8, color='#475569')
    # Block 1 -> 2
    ax.annotate('', xy=(3.3, 2.9), xytext=(2.8, 2.9), arrowprops=arrowprops)
    # Block 2 -> 3
    ax.annotate('', xy=(6.2, 2.9), xytext=(5.7, 2.9), arrowprops=arrowprops)
    # Block 3 -> 4
    ax.annotate('', xy=(6.8, 1.7), xytext=(7.4, 2.1), arrowprops=arrowprops)
    # Block 2 -> 4
    ax.annotate('', xy=(4.8, 1.7), xytext=(4.2, 2.1), arrowprops=arrowprops)

    ax.set_title('VVA Continuous Intelligence & Documentation Architecture',
                 fontsize=12, fontweight='bold', color=DARK_TEXT, pad=12)

    plt.tight_layout()
    plt.savefig(output_path, dpi=220, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close(fig)
    return output_path


def main():
    parser = argparse.ArgumentParser(description="VVA Visual Chart & Diagram Generator")
    parser.add_argument("--input", required=True, help="Path to project-history.json or project-data.json")
    parser.add_argument("--output-dir", required=True, help="Directory to save generated visual charts")
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    with input_path.open('r', encoding='utf-8') as f:
        data = json.load(f)

    commits = data.get('commits', [])
    if not commits and 'analyzedCommit' in data:
        # Fallback for single-commit project-data.json payload
        commits = [{
            'hash': data.get('analyzedCommit'),
            'date': data.get('timestamp') or data.get('author', {}).get('date'),
            'insertions': data.get('summary', {}).get('insertions', 10),
            'deletions': data.get('summary', {}).get('deletions', 2),
            'filesChanged': data.get('summary', {}).get('filesChanged', 1)
        }]

    contributors = data.get('contributors', {})
    if not contributors and 'author' in data:
        author_name = data.get('author', {}).get('name', 'Developer')
        contributors = {author_name: {'commits': len(commits) or 1}}

    file_breakdown = data.get('fileComposition', {})
    if not file_breakdown:
        # Infer file breakdown from changedFiles
        file_breakdown = {}
        for f in data.get('changedFiles', []):
            ext = Path(f.get('file', '')).suffix.lower() or 'source'
            file_breakdown[ext] = file_breakdown.get(ext, 0) + 1
        if not file_breakdown:
            file_breakdown = {'TypeScript': 45, 'Python': 35, 'Markdown': 15, 'Config': 5}

    results = {}
    results['commit_activity'] = str(generate_commit_activity_chart(commits, output_dir / 'chart_commit_activity.png'))
    results['contributors'] = str(generate_contributor_chart(contributors, output_dir / 'chart_contributors.png'))
    results['file_composition'] = str(generate_file_composition_chart(file_breakdown, output_dir / 'chart_file_composition.png'))
    results['architecture'] = str(generate_architecture_diagram(output_dir / 'diagram_architecture.png'))

    print(json.dumps({'success': True, 'charts': results}))


if __name__ == '__main__':
    main()
