#!/usr/bin/env python3
"""
VVA — Continuous Multi-Format Visual Document Generation Engine
Generates publication-quality PDF reports (ReportLab), editable Word documents (python-docx),
and PowerPoint presentations (python-pptx) with embedded charts, architectural diagrams,
tables, and visual evidence.
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

# ReportLab PDF imports
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    ListFlowable,
    ListItem,
)

# Word DOCX imports
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# PowerPoint PPTX imports
from pptx import Presentation
from pptx.util import Inches as PptInches, Pt as PptPt
from pptx.dml.color import RGBColor as PptRGBColor
from pptx.enum.text import PP_ALIGN


# Color Palette
HEX_PRIMARY = "#176B68"      # Teal
HEX_SECONDARY = "#4338CA"    # Indigo
HEX_DARK = "#1E293B"         # Slate 800
HEX_MUTED = "#64748B"        # Slate 500
HEX_LIGHT = "#F8FAFC"        # Slate 50
HEX_BORDER = "#E2E8F0"       # Slate 200

COLOR_PRIMARY = colors.HexColor(HEX_PRIMARY)
COLOR_SECONDARY = colors.HexColor(HEX_SECONDARY)
COLOR_DARK = colors.HexColor(HEX_DARK)
COLOR_MUTED = colors.HexColor(HEX_MUTED)
COLOR_LIGHT = colors.HexColor(HEX_LIGHT)
COLOR_BORDER = colors.HexColor(HEX_BORDER)


def safe_name(value):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(value)).strip("_") or "vva"


def as_list(value):
    if isinstance(value, list):
        return [str(item) for item in value]
    if value:
        return [str(value)]
    return []


def load_json(path):
    with Path(path).open("r", encoding="utf-8") as file:
        data = json.load(file)
    if not isinstance(data, dict):
        raise ValueError(f"Expected a JSON object in {path}")
    return data


# ==============================================================================
# PDF GENERATOR (ReportLab)
# ==============================================================================
def create_pdf(ai, project, output_path, charts_dir=None, purpose="technical"):
    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        name="VVATitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=COLOR_PRIMARY,
        alignment=TA_LEFT,
        spaceAfter=8,
    )
    subtitle_style = ParagraphStyle(
        name="VVASubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=COLOR_MUTED,
        spaceAfter=15,
    )
    h1_style = ParagraphStyle(
        name="VVAHeading1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        textColor=COLOR_PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )
    h2_style = ParagraphStyle(
        name="VVAHeading2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=COLOR_SECONDARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True,
    )
    body_style = ParagraphStyle(
        name="VVABody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=COLOR_DARK,
        spaceAfter=6,
    )
    caption_style = ParagraphStyle(
        name="VVACaption",
        parent=styles["Italic"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=COLOR_MUTED,
        alignment=TA_CENTER,
        spaceAfter=8,
    )
    table_cell_style = ParagraphStyle(
        name="VVATableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=COLOR_DARK,
    )
    table_header_style = ParagraphStyle(
        name="VVATableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    def draw_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOR_MUTED)
        canvas.drawString(20 * mm, 12 * mm, "VVA — Version & Workflow Automator | Continuous Project Intelligence")
        canvas.drawRightString(190 * mm, 12 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(COLOR_BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(20 * mm, 16 * mm, 190 * mm, 16 * mm)
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        title=str(ai.get("title", "VVA Project Documentation")),
    )

    story = []

    # Title & Header Banner
    repo_name = project.get("repository") or project.get("repositoryName") or "Project"
    commit_ref = str(project.get("analyzedCommit") or project.get("branch") or "HEAD")[:7]
    purpose_label = purpose.replace("-", " ").title()

    story.append(Paragraph(f"VVA {purpose_label} Documentation", subtitle_style))
    story.append(Paragraph(str(ai.get("title", f"Technical Analysis — {repo_name}")), title_style))
    
    meta_info = f"<b>Repository:</b> {repo_name} &nbsp;|&nbsp; <b>Branch:</b> {project.get('branch', 'main')} &nbsp;|&nbsp; <b>Ref:</b> {commit_ref} &nbsp;|&nbsp; <b>Date:</b> {project.get('timestamp', '')[:10]}"
    story.append(Paragraph(meta_info, body_style))
    story.append(Spacer(1, 4 * mm))

    # Executive Summary Section
    story.append(Paragraph("1. Executive Summary & Purpose", h1_style))
    story.append(Paragraph(str(ai.get("summary", "No summary provided.")), body_style))
    
    if ai.get("purposeAndRationale"):
        story.append(Paragraph("<b>Purpose and Strategic Rationale:</b>", body_style))
        story.append(Paragraph(str(ai.get("purposeAndRationale")), body_style))

    story.append(Spacer(1, 4 * mm))

    # Visual Evidence & System Architecture Diagram
    if charts_dir and Path(charts_dir).is_dir():
        arch_img = Path(charts_dir) / "diagram_architecture.png"
        if arch_img.is_file():
            story.append(Paragraph("2. System Architecture & Component Workflow", h1_style))
            try:
                story.append(RLImage(str(arch_img), width=160 * mm, height=75 * mm))
                story.append(Paragraph("Figure 1: Architectural Component Flow & Intelligence Lifecycle", caption_style))
            except Exception:
                pass
            story.append(Spacer(1, 3 * mm))

        # Commit Activity Chart & Metrics
        act_img = Path(charts_dir) / "chart_commit_activity.png"
        if act_img.is_file():
            story.append(Paragraph("3. Development Activity & Evolution Metrics", h1_style))
            try:
                story.append(RLImage(str(act_img), width=160 * mm, height=75 * mm))
                story.append(Paragraph("Figure 2: Cumulative Commit Progress & Code Volume Churn", caption_style))
            except Exception:
                pass
            story.append(Spacer(1, 3 * mm))

    # Development Milestones / Commit Table
    commits = project.get("commits", [])
    if not commits and "analyzedCommit" in project:
        commits = [{
            "shortHash": str(project.get("analyzedCommit"))[:7],
            "message": project.get("commitMessage", "Work in progress"),
            "author": project.get("author", {}).get("name", "Developer") if isinstance(project.get("author"), dict) else str(project.get("author")),
            "milestone": "Current Analyzed State"
        }]

    if commits:
        story.append(Paragraph("4. Historical Development Milestones", h1_style))
        table_data = [[
            Paragraph("Commit", table_header_style),
            Paragraph("Author", table_header_style),
            Paragraph("Milestone Type", table_header_style),
            Paragraph("Commit Message", table_header_style),
        ]]

        for c in commits[:8]:  # Keep clean and scannable
            table_data.append([
                Paragraph(str(c.get("shortHash", "")), table_cell_style),
                Paragraph(str(c.get("author", "Developer")), table_cell_style),
                Paragraph(str(c.get("milestone", "Feature")), table_cell_style),
                Paragraph(str(c.get("message", ""))[:65], table_cell_style),
            ])

        t = Table(table_data, colWidths=[20 * mm, 30 * mm, 35 * mm, 75 * mm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, COLOR_LIGHT]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t)
        story.append(Spacer(1, 4 * mm))

    # Technical Changes & Components
    story.append(Paragraph("5. Technical Implementation & Subsystem Modifications", h1_style))
    tech_changes = as_list(ai.get("technicalChanges", []))
    if tech_changes:
        bullets = [ListItem(Paragraph(item, body_style)) for item in tech_changes]
        story.append(ListFlowable(bullets, bulletType="bullet"))
    else:
        story.append(Paragraph("No explicit code changes documented.", body_style))

    story.append(Spacer(1, 3 * mm))

    # Observations & Architectural Impact
    if ai.get("architecturalImpact"):
        story.append(Paragraph("6. Architectural Impact & Engineering Observations", h1_style))
        story.append(Paragraph(str(ai.get("architecturalImpact")), body_style))

    obs = as_list(ai.get("observationsAndLimitations", []))
    if obs:
        story.append(Paragraph("<b>Observations and Technical Limitations:</b>", body_style))
        obs_bullets = [ListItem(Paragraph(o, body_style)) for o in obs]
        story.append(ListFlowable(obs_bullets, bulletType="bullet"))

    doc.build(story, onFirstPage=draw_footer, onLaterPages=draw_footer)


# ==============================================================================
# DOCX GENERATOR (python-docx)
# ==============================================================================
def create_docx(ai, project, output_path, charts_dir=None, purpose="technical"):
    doc = Document()

    # Document Title & Subtitle
    repo_name = project.get("repository") or project.get("repositoryName") or "Project"
    purpose_label = purpose.replace("-", " ").title()

    title = doc.add_heading(f"VVA {purpose_label} Documentation", level=0)
    title.paragraph_format.space_after = Pt(4)

    h1 = doc.add_heading(str(ai.get("title", f"Technical Synopsis — {repo_name}")), level=1)
    h1.paragraph_format.space_after = Pt(12)

    # Metadata Paragraph
    meta = doc.add_paragraph()
    meta.add_run(f"Repository: {repo_name}  |  Branch: {project.get('branch', 'main')}  |  Generated by VVA")
    meta.runs[0].font.size = Pt(9.5)
    meta.runs[0].font.color.rgb = RGBColor(100, 116, 139)
    meta.paragraph_format.space_after = Pt(16)

    # 1. Executive Summary
    doc.add_heading("1. Executive Summary & Purpose", level=2)
    doc.add_paragraph(str(ai.get("summary", "No summary provided.")))
    if ai.get("purposeAndRationale"):
        p = doc.add_paragraph()
        run = p.add_run("Strategic Rationale: ")
        run.bold = True
        p.add_run(str(ai.get("purposeAndRationale")))

    # Embed Architecture & Charts if present
    if charts_dir and Path(charts_dir).is_dir():
        arch_img = Path(charts_dir) / "diagram_architecture.png"
        if arch_img.is_file():
            doc.add_heading("2. System Architecture & Intelligence Workflow", level=2)
            try:
                doc.add_picture(str(arch_img), width=Inches(6.2))
                cap = doc.add_paragraph("Figure 1: VVA Continuous Workflow Architecture & Subsystem Diagram")
                cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cap.runs[0].font.size = Pt(8.5)
                cap.runs[0].font.italic = True
            except Exception:
                pass

        act_img = Path(charts_dir) / "chart_commit_activity.png"
        if act_img.is_file():
            doc.add_heading("3. Development Activity & Evolution Metrics", level=2)
            try:
                doc.add_picture(str(act_img), width=Inches(6.2))
                cap = doc.add_paragraph("Figure 2: Cumulative Commit Progress & Code Volume Churn")
                cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
                cap.runs[0].font.size = Pt(8.5)
                cap.runs[0].font.italic = True
            except Exception:
                pass

    # 4. Milestones / Commits Table
    commits = project.get("commits", [])
    if not commits and "analyzedCommit" in project:
        commits = [{
            "shortHash": str(project.get("analyzedCommit"))[:7],
            "message": project.get("commitMessage", "Work in progress"),
            "author": project.get("author", {}).get("name", "Developer") if isinstance(project.get("author"), dict) else str(project.get("author")),
            "milestone": "Active Working Tree State"
        }]

    if commits:
        doc.add_heading("4. Historical Development Milestones", level=2)
        table = doc.add_table(rows=1, cols=4)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        hdr_cells = table.rows[0].cells
        hdr_cells[0].text = "Commit"
        hdr_cells[1].text = "Author"
        hdr_cells[2].text = "Milestone"
        hdr_cells[3].text = "Commit Message"

        for c in commits[:10]:
            row_cells = table.add_row().cells
            row_cells[0].text = str(c.get("shortHash", ""))
            row_cells[1].text = str(c.get("author", "Developer"))
            row_cells[2].text = str(c.get("milestone", "Feature"))
            row_cells[3].text = str(c.get("message", ""))[:70]

        doc.add_paragraph()  # Spacer

    # 5. Technical Implementation Changes
    doc.add_heading("5. Technical Implementation Details", level=2)
    for item in as_list(ai.get("technicalChanges", [])):
        doc.add_paragraph(item, style="List Bullet")

    # 6. Architectural Impact & Observations
    if ai.get("architecturalImpact") or ai.get("observationsAndLimitations"):
        doc.add_heading("6. Architectural Impact & Limitations", level=2)
        if ai.get("architecturalImpact"):
            doc.add_paragraph(str(ai.get("architecturalImpact")))
        for item in as_list(ai.get("observationsAndLimitations", [])):
            doc.add_paragraph(item, style="List Bullet")

    doc.save(str(output_path))


# ==============================================================================
# PPTX GENERATOR (python-pptx)
# ==============================================================================
def create_pptx(ai, project, output_path, charts_dir=None, purpose="technical"):
    prs = Presentation()
    repo_name = project.get("repository") or project.get("repositoryName") or "Project"
    purpose_label = purpose.replace("-", " ").title()

    # Slide 1: Title Slide
    title_slide = prs.slides.add_slide(prs.slide_layouts[0])
    title_slide.shapes.title.text = str(ai.get("title", f"VVA {purpose_label} Presentation"))
    title_slide.placeholders[1].text = (
        f"Repository: {repo_name} | Branch: {project.get('branch', 'main')}\n"
        f"Generated by VVA Continuous Intelligence Engine"
    )

    # Slide 2: Executive Summary & Strategic Rationale
    sum_slide = prs.slides.add_slide(prs.slide_layouts[1])
    sum_slide.shapes.title.text = "Executive Summary & Purpose"
    tf = sum_slide.placeholders[1].text_frame
    tf.clear()
    
    p1 = tf.paragraphs[0]
    p1.text = str(ai.get("summary", "Summary not available."))
    p1.font.size = PptPt(16)
    p1.font.color.rgb = PptRGBColor(30, 41, 59)

    if ai.get("purposeAndRationale"):
        p2 = tf.add_paragraph()
        p2.text = f"\nStrategic Rationale: {ai.get('purposeAndRationale')}"
        p2.font.size = PptPt(15)
        p2.font.bold = True
        p2.font.color.rgb = PptRGBColor(23, 107, 104)

    # Slide 3: Architecture Diagram (if available)
    if charts_dir and Path(charts_dir).is_dir():
        arch_img = Path(charts_dir) / "diagram_architecture.png"
        if arch_img.is_file():
            arch_slide = prs.slides.add_slide(prs.slide_layouts[5])  # Title only
            arch_slide.shapes.title.text = "System Architecture & Continuous Workflow"
            try:
                arch_slide.shapes.add_picture(
                    str(arch_img),
                    left=PptInches(0.8),
                    top=PptInches(1.5),
                    width=PptInches(8.4),
                )
            except Exception:
                pass

        # Slide 4: Development Activity Timeline Chart
        act_img = Path(charts_dir) / "chart_commit_activity.png"
        if act_img.is_file():
            act_slide = prs.slides.add_slide(prs.slide_layouts[5])
            act_slide.shapes.title.text = "Continuous Git Evolution & Churn Metrics"
            try:
                act_slide.shapes.add_picture(
                    str(act_img),
                    left=PptInches(0.8),
                    top=PptInches(1.5),
                    width=PptInches(8.4),
                )
            except Exception:
                pass

    # Slide 5: Key Technical Changes
    tech_slide = prs.slides.add_slide(prs.slide_layouts[1])
    tech_slide.shapes.title.text = "Key Technical Implementation Changes"
    tf = tech_slide.placeholders[1].text_frame
    tf.clear()
    for idx, item in enumerate(as_list(ai.get("technicalChanges", []))[:6]):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"• {item}"
        p.font.size = PptPt(15)
        p.font.color.rgb = PptRGBColor(45, 55, 72)

    # Slide 6: Architectural Impact & Engineering Observations
    imp_slide = prs.slides.add_slide(prs.slide_layouts[1])
    imp_slide.shapes.title.text = "Architectural Impact & Engineering Observations"
    tf = imp_slide.placeholders[1].text_frame
    tf.clear()
    if ai.get("architecturalImpact"):
        p = tf.paragraphs[0]
        p.text = str(ai.get("architecturalImpact"))
        p.font.size = PptPt(16)
        p.font.color.rgb = PptRGBColor(30, 41, 59)

    for item in as_list(ai.get("observationsAndLimitations", []))[:4]:
        p = tf.add_paragraph()
        p.text = f"• {item}"
        p.font.size = PptPt(14)
        p.font.color.rgb = PptRGBColor(100, 116, 139)

    prs.save(str(output_path))


# ==============================================================================
# CLI Entry Point
# ==============================================================================
def main():
    parser = argparse.ArgumentParser(description="VVA Continuous Visual Document Generator")
    parser.add_argument("--ai-input", required=True, help="Path to ai-response.json")
    parser.add_argument("--project-input", required=True, help="Path to project-data.json or project-history.json")
    parser.add_argument("--output-dir", required=True, help="Directory to save generated documents")
    parser.add_argument("--format", choices=["pdf", "docx", "pptx", "all"], default="all")
    parser.add_argument("--charts-dir", default=None, help="Directory containing visual charts & diagrams")
    parser.add_argument("--purpose", default="technical", help="Documentation purpose (technical, academic, demo, etc.)")
    parser.add_argument("--mode", default="commit", help="Documentation mode: commit, full, or incremental")
    args = parser.parse_args()

    ai = load_json(args.ai_input)
    project = load_json(args.project_input)

    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    repo_name = safe_name(project.get("repository") or project.get("repositoryName") or "vva")
    commit_tag = safe_name(str(project.get("analyzedCommit") or project.get("branch") or "main")[:7])
    prefix = f"{repo_name}_{commit_tag}" if args.mode in ("commit", "single") else f"{repo_name}_continuous"

    generators = {
        "pdf": (f"{prefix}_report.pdf", create_pdf),
        "docx": (f"{prefix}_synopsis.docx", create_docx),
        "pptx": (f"{prefix}_presentation.pptx", create_pptx),
    }

    formats = list(generators) if args.format == "all" else [args.format]
    results = []

    for fmt in formats:
        filename, generator = generators[fmt]
        output_path = output_dir / filename
        generator(ai, project, output_path, charts_dir=args.charts_dir, purpose=args.purpose)

        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RuntimeError(f"Document generation failed for {fmt}: {output_path}")

        results.append({
            "format": fmt,
            "filename": filename,
            "path": str(output_path),
            "sizeBytes": output_path.stat().st_size,
        })

    print(json.dumps(results))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"VVA Document Engine error: {exc}", file=sys.stderr)
        sys.exit(1)
