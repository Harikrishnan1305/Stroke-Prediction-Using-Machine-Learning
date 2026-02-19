from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from typing import Optional, Union
import os
import io

class StrokePredictionReport:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.custom_styles()
    
    def custom_styles(self):
        """Create custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#3b82f6'),
            spaceAfter=12,
            spaceBefore=12
        ))
        
        self.styles.add(ParagraphStyle(
            name='RiskHigh',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.red,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='RiskMedium',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.orange,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
        
        self.styles.add(ParagraphStyle(
            name='RiskLow',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.green,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))
    
    def generate_report(self, patient_data, prediction_data, recommendations, output_path: Optional[str] = None) -> Union[io.BytesIO, str]:
        """Generate PDF report for stroke prediction"""
        
        # Create buffer or file
        buffer: Optional[io.BytesIO] = None
        if output_path is None:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        else:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            doc = SimpleDocTemplate(output_path, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
        
        # Container for elements
        elements = []
        
        # Title
        title = Paragraph("Brain Stroke Risk Assessment Report", self.styles['CustomTitle'])
        elements.append(title)
        elements.append(Spacer(1, 0.3*inch))
        
        # Report metadata
        report_date = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')
        metadata = Paragraph(f"<b>Report Generated:</b> {report_date}", self.styles['Normal'])
        elements.append(metadata)
        elements.append(Spacer(1, 0.3*inch))
        
        # Patient Information Section
        elements.append(Paragraph("Patient Information", self.styles['CustomHeading']))
        
        patient_table_data = [
            ['Name:', patient_data.get('name', 'N/A')],
            ['Age:', f"{patient_data.get('age', 'N/A')} years"],
            ['Gender:', patient_data.get('gender', 'N/A')],
            ['Patient ID:', f"#{patient_data.get('id', 'N/A')}"],
        ]
        
        if patient_data.get('email'):
            patient_table_data.append(['Email:', patient_data.get('email')])
        if patient_data.get('phone'):
            patient_table_data.append(['Phone:', patient_data.get('phone')])
        
        patient_table = Table(patient_table_data, colWidths=[2*inch, 4*inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e0e7ff')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        elements.append(patient_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Risk Assessment Section
        elements.append(Paragraph("Risk Assessment Results", self.styles['CustomHeading']))
        
        risk_level = prediction_data.get('stroke_risk', 'Unknown')
        risk_style = 'RiskLow' if risk_level == 'Low' else 'RiskMedium' if risk_level == 'Medium' else 'RiskHigh'
        
        risk_text = Paragraph(f"<b>Stroke Risk Level: {risk_level}</b>", self.styles[risk_style])
        elements.append(risk_text)
        elements.append(Spacer(1, 0.1*inch))
        
        confidence = prediction_data.get('risk_probability', 0) * 100
        confidence_text = Paragraph(f"Confidence: {confidence:.1f}%", self.styles['Normal'])
        elements.append(confidence_text)
        
        if prediction_data.get('stroke_stage'):
            stage_text = Paragraph(f"<b>Stage:</b> {prediction_data.get('stroke_stage')}", self.styles['Normal'])
            elements.append(stage_text)
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Medical Parameters Section
        elements.append(Paragraph("Medical Parameters", self.styles['CustomHeading']))
        
        params_data = [
            ['Parameter', 'Value', 'Status'],
            ['Heart Rate', f"{prediction_data.get('heart_rate', 'N/A')} bpm", self._get_status(prediction_data.get('heart_rate'), 60, 100)],
            ['Blood Pressure', prediction_data.get('blood_pressure', 'N/A'), self._get_bp_status(prediction_data)],
            ['Blood Sugar', f"{prediction_data.get('blood_sugar', 'N/A')} mg/dL", self._get_status(prediction_data.get('blood_sugar'), 70, 126)],
            ['Cholesterol', f"{prediction_data.get('cholesterol', 'N/A')} mg/dL", self._get_status(prediction_data.get('cholesterol'), 0, 200)],
            ['BMI', f"{prediction_data.get('bmi', 'N/A')}", self._get_bmi_status(prediction_data.get('bmi'))],
            ['Smoking', 'Yes' if prediction_data.get('is_smoker') else 'No', 'Risk' if prediction_data.get('is_smoker') else 'Normal'],
            ['Alcohol', 'Yes' if prediction_data.get('is_alcoholic') else 'No', 'Risk' if prediction_data.get('is_alcoholic') else 'Normal'],
        ]
        
        params_table = Table(params_data, colWidths=[2*inch, 2*inch, 2*inch])
        params_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        elements.append(params_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Recommendations Section
        elements.append(Paragraph("Medical Recommendations", self.styles['CustomHeading']))
        
        for i, rec in enumerate(recommendations, 1):
            rec_para = Paragraph(f"{i}. {rec}", self.styles['Normal'])
            elements.append(rec_para)
            elements.append(Spacer(1, 0.1*inch))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Disclaimer
        disclaimer = Paragraph(
            "<b>Disclaimer:</b> This report is generated by an AI-assisted system and should not replace professional medical advice. "
            "Please consult with a qualified healthcare provider for proper diagnosis and treatment.",
            ParagraphStyle('Disclaimer', parent=self.styles['Normal'], fontSize=9, textColor=colors.grey, alignment=TA_CENTER)
        )
        elements.append(disclaimer)
        
        # Build PDF
        doc.build(elements)
        
        # Return buffer if no output path, otherwise return the file path
        if output_path is None:
            assert buffer is not None  # Type narrowing: buffer is guaranteed to be BytesIO when output_path is None
            buffer.seek(0)
            return buffer
        else:
            return output_path
    
    def _get_status(self, value, min_normal, max_normal):
        """Get status based on normal ranges"""
        if value is None:
            return 'N/A'
        try:
            val = float(value)
            if val < min_normal or val > max_normal:
                return 'Abnormal'
            return 'Normal'
        except:
            return 'N/A'
    
    def _get_bp_status(self, prediction_data):
        """Get blood pressure status"""
        try:
            bp_str = prediction_data.get('blood_pressure', '').split('/')
            if len(bp_str) == 2:
                systolic = float(bp_str[0])
                diastolic = float(bp_str[1])
                if systolic > 140 or diastolic > 90:
                    return 'High'
                elif systolic < 90 or diastolic < 60:
                    return 'Low'
                return 'Normal'
        except:
            pass
        return 'N/A'
    
    def _get_bmi_status(self, bmi):
        """Get BMI status"""
        if bmi is None:
            return 'N/A'
        try:
            val = float(bmi)
            if val < 18.5:
                return 'Underweight'
            elif val < 25:
                return 'Normal'
            elif val < 30:
                return 'Overweight'
            else:
                return 'Obese'
        except:
            return 'N/A'
