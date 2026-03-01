import os
from flask import Blueprint, current_app, render_template, send_file, jsonify
from openpyxl import load_workbook

adminBp = Blueprint('admin', __name__, template_folder='templates')

FILE_NAME = 'cx_reviews.xlsx'

@adminBp.route('/admin/dashboard')
def dashboard():
    data = []
    if os.path.exists(FILE_NAME):
        try:
            wb = load_workbook(FILE_NAME)
            ws = wb.active
            # Skipping the header row (min_row=2)
            for row in ws.iter_rows(min_row=2, values_only=True):
                data.append(row)
        except Exception as e:
            print(f"Error reading Excel: {e}")
    
    return render_template('admin_dashboard.html', reviews=data)

def get_excel_path():
    # This points to the main project folder safely on any server
    return os.path.join(current_app.root_path, '..', 'cx_reviews.xlsx')

@adminBp.route('/admin/download')
def download_excel():
    file_path = get_excel_path()
    
    if not os.path.exists(file_path):
        return "No feedback file has been created yet.", 404

    try:
        # 'mimetype' helps the server tell the browser it is an Excel file
        return send_file(
            file_path,
            as_attachment=True,
            download_name="cx_reviews.xlsx",
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return f"Server Error: {str(e)}", 500
    

    
@adminBp.route('/admin/clear-data', methods=['POST'])
def clear_data():
    if os.path.exists(FILE_NAME):
        os.remove(FILE_NAME)
        return jsonify({"status": "success", "message": "File deleted successfully."})
    return jsonify({"status": "error", "message": "File does not exist."}), 404