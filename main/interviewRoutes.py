import os
import time

from flask import Blueprint, json, render_template, request, jsonify
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv() #loading the environment variables


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

interviewBp = Blueprint('interview', __name__)

@interviewBp.route('/interview')
def interviewIndex():
    return render_template('interview.html')

# NEW: Function to receive and save the audio in the root directory
# def save_interview():
    if 'audio_file' not in request.files:
        return jsonify({"status": "error", "message": "No file received"}), 400

    audio = request.files['audio_file']
    data_type = request.form.get('type', 'interview')

    # Save directly in the project root directory
    # filename example: interview_1700000000.wav
    filename = f"{data_type}_{int(time.time())}.wav"
    file_path = os.path.join(os.getcwd(), filename)

    audio.save(file_path)
    
    return jsonify({
        "status": "success", 
        "message": f"Saved as {filename} in project root"
    }), 200
@interviewBp.route('/interview/save', methods=['POST'])
def save_interview():
    audio = request.files.get('audio_file')
    i_type = request.form.get('type')
    diff = request.form.get('difficulty')
    question = request.form.get('question')

    # 1. Save File Temporarily
    filename = f"{i_type}_{int(time.time())}.wav"
    file_path = os.path.join(os.getcwd(), filename)
    audio.save(file_path)

    try:
        # 2. Upload to Gemini
# Change 'path' to 'file'
        gemini_file = client.files.upload(file=file_path)

        # 3. Precise Schema for your HTML
        response_schema = {
            "type": "OBJECT",
            "properties": {
                "overall_score": {"type": "NUMBER"},
                "score_label": {"type": "STRING"},
                "transcript": {"type": "STRING"},
                "categories": {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "score": {"type": "INTEGER"},
                            "percentage": {"type": "INTEGER"},
                            "status": {"type": "STRING"},
                            "feedback": {"type": "STRING"}
                        }
                    }
                }
            }
        }

        prompt = f"""
        Listen to the audio answer for the interview question: '{question}'.
        The interview type is {i_type} and difficulty is {diff}.
        Evaluate based on: Answer Structure (STAR),Answer Clarity, Communication, and JD Match.
        Return the feedback in the specified JSON format.
        And if the audio is blank or transcript is not readable, then return response according to that like "your said nothing" and score 0.
        overall score should be out of 10.
        """

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[gemini_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )

        # 4. Clean up
        os.remove(file_path)
        
        # 5. Return data to frontend
        feedback_data = json.loads(response.text)
        print(feedback_data)
        return jsonify({"status": "success", "data": feedback_data})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500



