from flask import render_template,Flask

def create_app():
    app = Flask(__name__)

    from .landingRoutes import landingBp
    from .uploadRoutes import uploadBp
    from .interviewRoutes import interviewBp
    from .feedbackRoutes import feedbackBp

    app.register_blueprint(feedbackBp)
    app.register_blueprint(interviewBp)
    app.register_blueprint(landingBp)
    app.register_blueprint(uploadBp)


    
    return app