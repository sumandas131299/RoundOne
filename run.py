import main.app as app_module
app = app_module.create_app()

if __name__ == '__main__':
    app.run(debug=True)    