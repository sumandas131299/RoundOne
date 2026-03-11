import os
import json
from flask import Blueprint, jsonify, render_template, request, session
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv() #loading the environment variables

uploadBp = Blueprint('upload',__name__)


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

@uploadBp.route('/upload')
def uploadIndex():
    return render_template('upload.html')

# @uploadBp.route('/upload/process', methods=['POST'])
# def process_upload():
#     i_type = request.form.get('interview_type')
#     diff = request.form.get('difficulty')
#     file = request.files.get('resume')

#     if not file:
#         return jsonify({"status": "error", "message": "No file uploaded"}), 400

#     try:
#         # 1. Temporarily save the file to upload it
#         temp_path = f"./temp_{file.filename}"
#         file.save(temp_path)

#         # 2. Upload to Gemini File API
#         # Note: PDF/Doc files are supported
#         gemini_file = client.files.upload(file=temp_path)

#         # 3. Create the prompt
#         # prompt = (
#         #     f"Based on the attached resume, generate exactly 5 interview questions "
#         #     f"for a {i_type} interview at a {diff} difficulty level. "
#         #     f"Return the output as a JSON object with a key 'questions' containing a list of strings."
#         # )

#         prompt = (
#     f"Resume: [Attached]\n"
#     f"Context: 5 {i_type} questions, {diff} difficulty.\n"
#     f"Format: JSON {{'questions': ['...']}}"
# )

#         # 4. Generate content using JSON mode for reliable parsing
#         response = client.models.generate_content(
#             model="gemini-2.5-flash-lite", # Use the latest stable flash model
#             contents=[gemini_file, prompt],
#             config=types.GenerateContentConfig(
#                 response_mime_type="application/json"
#             )
#         )

#         # 5. Clean up the temp file and parse questions
#         os.remove(temp_path)
#         data = json.loads(response.text)
#         questions_list = data.get('questions', [])
#         print("This is the response",questions_list)
#         return jsonify({
#             "status": "success",
#             "questions": questions_list # Sending the array to frontend
#         })

#     except Exception as e:
#         print(f"Error: {e}")
#         return jsonify({"status": "error", "message": str(e)}), 500



# global storage
active_interviews = {} 

@uploadBp.route('/upload/process', methods=['POST'])
def process_upload():
    session_id = session['user_id'] # In production, use flask.session or a UUID
    i_type = request.form.get('interview_type')
    diff = request.form.get('difficulty')
    file = request.files.get('resume')

    temp_path = f"./temp_{file.filename}"
    file.save(temp_path)
    gemini_file = client.files.upload(file=temp_path)

    # INITIALIZE THE CHAT WITH PERSONA AND RESUME
    system_prompt = f"""
    You are a Senior Recruiter. Conduct a {diff} {i_type} interview.
    1. Use the attached resume as context.
    2. Ask exactly 3 questions, one at a time.
    3. If the user is vague, ask a follow-up. 
    4. After the 3rd answer or user only respond 'exit==true' or if user want to end the interview, say: 'INTERVIEW_COMPLETE'.
    """

    # Start the session and store it globally
    chat_session = client.chats.create(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7
        )
    )

    # Initial "Handshake" - Send the resume to the AI so it's ready
    first_response = chat_session.send_message(["Here is my resume. Please start the interview.", gemini_file])
    
    active_interviews[session_id] = chat_session
    os.remove(temp_path)
    print("This is the response",first_response.text)
    return jsonify({
        "status": "success",
        "first_question": first_response.text # Pass the first Q to the UI
    })