import os
from flask import Blueprint, render_template, send_file, jsonify
from pymongo import MongoClient
from datetime import datetime
from io import BytesIO
from openpyxl import Workbook
from dotenv import load_dotenv

load_dotenv()

adminBp = Blueprint('admin', __name__, template_folder='templates')

# --- MONGODB SETUP ---
MONGO_URI = os.getenv("MONGO_URI") 
client = MongoClient(MONGO_URI)
db = client['mirrorInterview_db']    # Your Database Name
reviews_col = db['reviews']   # Your Collection Name

@adminBp.route('/admin/reviews')
def dashboard():
    # Fetch all records from Atlas, sorted by newest first
    reviews_cursor = reviews_col.find()
    
    data = []
    for doc in reviews_cursor:
        data.append({
            "date": doc.get('date'),
            "time": doc.get('time'),
            "career": doc.get('career'),
            "rating": doc.get('rating'),
            "comment": doc.get('comment')
        })
    
    return render_template('admin_dashboard.html', reviews=data)

@adminBp.route('/admin/download')
def download_excel():
    # 1. Create a workbook in server memory
    wb = Workbook()
    ws = wb.active
    ws.title = "Customer Reviews"
    
    # 2. Add Headers
    ws.append(["Date", "Time", "Career", "Rating", "Comment"])

    # 3. Fill with Data from MongoDB
    for doc in reviews_col.find().sort("_id", -1):
        ws.append([
            doc.get('date'),
            doc.get('time'),
            doc.get('career'),
            doc.get('rating'),
            doc.get('comment')
        ])

    # 4. Save to a Byte Stream (No physical file saved on server)
    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)

    return send_file(
        file_stream,
        as_attachment=True,
        download_name="cx_reviews_export.xlsx",
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@adminBp.route('/admin/clear-data', methods=['POST'])
def clear_data():
    try:
        reviews_col.delete_many({})
        return jsonify({"status": "success", "message": "All database records deleted."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500