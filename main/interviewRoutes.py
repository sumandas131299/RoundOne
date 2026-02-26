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
   
@interviewBp.route('/interview/s', methods=['POST'])
def save_audio():
    transcript = request.form.get('transcript')
    print(transcript)
    return jsonify({"status": "success", "message": "Audio saved successfully"}), 200


@interviewBp.route('/interview/save', methods=['POST'])
def save_interview():
   # audio = request.files.get('audio_file')
    transcript = request.form.get('transcript')
    print("transcript:", transcript)
    i_type = request.form.get('type')
    diff = request.form.get('difficulty')
    question = request.form.get('question')

    # 1. Save File Temporarily
    # filename = f"{i_type}_{int(time.time())}.wav"
    # file_path = os.path.join(os.getcwd(), filename)
    # audio.save(file_path)

           


           
    try:
        # 2. Upload to Gemini
# Change 'path' to 'file'
        # gemini_file = client.files.upload(file=file_path)

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

        # prompt = f"""
        # Listen to the answer audio for the interview question: '{question}'.
        # The interview type is {i_type} and difficulty is {diff}.
        # Evaluate based on: Answer Structure (STAR),Answer Clarity, Communication, and JD Match.
        # Return the feedback in the specified JSON format.
        # And if answer audio is not readable or transcript is not readable, then return response according to that like "You Said Nothing" and score 0 
        # and dont give any demo answer , just check and give the score.
        # overall score should be out of 10 give a motivating score.
        # """

        #CRITICAL: If transcript is empty/unreadable/only noise/only timestamps, return a score of 0 and transcript = "You Said Nothing" and STOP.


        prompt = f"""
        Evaluate {transcript} for {i_type} interview ({diff} difficulty). 
Question: "{question}"

Criteria: STAR structure, Clarity, Communication, JD Match.
Output: JSON only. Score /10.
        """


        response = client.models.generate_content(
            model="gemini-2.5-flash-lite", # Use the latest stable flash model
            contents=[ prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema
            )
        )

        # 4. Clean up
        # os.remove(file_path)
        
        # 5. Return data to frontend
        feedback_data = json.loads(response.text)
        print(feedback_data)
        return jsonify({"status": "success", "data": feedback_data})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500



