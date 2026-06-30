import os
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

class ReportGenerator:
    def __init__(self, evaluation_results: dict, output_dir: str):
        self.evaluation_results = evaluation_results
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def generate(self) -> str:
        if not REPORTLAB_AVAILABLE:
            raise ImportError("reportlab is required for PDF generation. Run 'pip install reportlab'.")
            
        filename = "automl_evaluation_report.pdf"
        output_path = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        title_style = styles['Title']
        elements.append(Paragraph("AutoML Studio - Evaluation Report", title_style))
        elements.append(Spacer(1, 20))
        
        # Overview
        h2_style = styles['Heading2']
        elements.append(Paragraph("1. Overview", h2_style))
        problem_type = self.evaluation_results.get('problem_type', 'Unknown')
        best_model = self.evaluation_results.get('best_model', 'None')
        
        overview_text = f"This report summarizes the evaluation of machine learning models trained on your dataset. The detected problem type is <b>{problem_type.title()}</b>. Based on the evaluation metrics, the best performing model is <b>{best_model}</b>."
        elements.append(Paragraph(overview_text, styles['Normal']))
        elements.append(Spacer(1, 15))
        
        # Metrics Table
        elements.append(Paragraph("2. Model Comparison", h2_style))
        
        results = self.evaluation_results.get('evaluation_results', [])
        
        if results:
            if problem_type == 'regression':
                headers = ['Rank', 'Model Name', 'R-Squared', 'RMSE', 'MAE']
                data = [headers]
                for res in results:
                    metrics = res.get('metrics', {})
                    row = [
                        str(res.get('rank', '-')),
                        res.get('model_name', 'Unknown'),
                        f"{metrics.get('r2', 0):.4f}",
                        f"{metrics.get('rmse', 0):.4f}",
                        f"{metrics.get('mae', 0):.4f}"
                    ]
                    data.append(row)
            else:
                headers = ['Rank', 'Model Name', 'Accuracy', 'F1 Score', 'Precision', 'Recall']
                data = [headers]
                for res in results:
                    metrics = res.get('metrics', {})
                    row = [
                        str(res.get('rank', '-')),
                        res.get('model_name', 'Unknown'),
                        f"{metrics.get('accuracy', 0):.4f}",
                        f"{metrics.get('f1', 0):.4f}",
                        f"{metrics.get('precision', 0):.4f}",
                        f"{metrics.get('recall', 0):.4f}"
                    ]
                    data.append(row)
                    
            table = Table(data, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
            
        elements.append(Spacer(1, 20))
        
        # Conclusion
        elements.append(Paragraph("3. Conclusion", h2_style))
        conclusion = "The models have been ranked based on primary evaluation metrics (R2 for regression, Accuracy/F1 for classification). You can export the best model to make predictions on new data."
        elements.append(Paragraph(conclusion, styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        
        return filename
