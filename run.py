import os

import main.app as app_module
app = app_module.create_app()

if __name__ == '__main__':
    
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port , debug=True)   