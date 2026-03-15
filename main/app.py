import datetime
import os

from flask import jsonify, render_template,Flask, request,session
from dotenv import load_dotenv
from pymongo import MongoClient

log_entry = {}
MONGO_URI = os.getenv("MONGO_URI") # Best practice: put this in your .env file
client = MongoClient(MONGO_URI)
db = client['mirrorInterview_db']

load_dotenv()
def create_app():
    app = Flask(__name__)
    sessions = db['sessions']
    from .landingRoutes import landingBp
    from .uploadRoutes import uploadBp
    from .interviewRoutes import interviewBp
    from .feedbackRoutes import feedbackBp
    from .adminRoutes import adminBp


    app.register_blueprint(adminBp)
    app.register_blueprint(feedbackBp)
    app.register_blueprint(interviewBp)
    app.register_blueprint(landingBp)
    app.register_blueprint(uploadBp)
    app.secret_key = os.getenv("SECRET_KEY")

    

    @app.route('/api/analytics/collect', methods=['POST'])
    def collect_all_metrics():
        #print("Inside collect_all_metrics" , session['user_id'])
        js_data = request.get_json()
        if not js_data: return '', 204

        user_id = session['user_id']
        
        # This represents the data for the CURRENT page visit
        current_page_data = {
            "path": js_data.get('path'),
            "load_speed_ms": js_data.get('load_speed'),
            "scroll_depth": js_data.get('scroll_depth'),
            "click_map": js_data.get('clicks'),
            "screen_width": js_data.get('screen_width'),
            "screen_height": js_data.get('screen_height'),
            "duration_sec": js_data.get('duration'),
            "timestamp": datetime.datetime.utcnow()
        }

        # Use update_one with upsert=True to handle both NEW and EXISTING users
        db.sessions.update_one(
            {"user_id": user_id},
            {
                # $push adds the new page data to the 'pages_visited' array
                "$push": {"pages_visited": current_page_data},
                
                # $setOnInsert only runs the FIRST time the user is created
                "$setOnInsert": {
                    "first_seen": datetime.datetime.utcnow(),
                    "referrer": request.referrer,
                    "user_agent": request.headers.get('User-Agent'),
                    "ip": request.headers.get('X-Forwarded-For', request.remote_addr)
                },
                
                # $set updates these every time they visit a new page
                "$set": {
                    "last_active": datetime.datetime.utcnow()
                }
            },
            upsert=True 
        )

        return '', 204
    

    @app.route('/admin/dashboard')
    def dashboard_page():
        # This simply loads the HTML file
        return render_template('analyticsDashboard.html')

    @app.route('/api/analytics-data')
    def get_analytics_data():
        try:
            # Fetch all records, excluding the MongoDB _id if you don't need it
            cursor = sessions.find({}, {'_id': 0})
            data = list(cursor)
            return jsonify(data)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app