from flask import Blueprint,render_template

landingBp = Blueprint('landing',__name__)

@landingBp.route('/')
def landingIndex():
    return render_template('landing_page.html')