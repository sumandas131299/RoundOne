import datetime
import uuid
from .app import log_entry 
from flask import Blueprint,render_template, session ,request

landingBp = Blueprint('landing',__name__)


@landingBp.route('/')
def landingIndex():
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
        
    print(session['user_id'])
    return render_template('landing_page.html')