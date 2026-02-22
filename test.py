from google import genai

client = genai.Client(api_key="AIzaSyB7q_7Qna8rMs5gJ20HAjNiGJXoXd87DOY")

response = client.models.generate_content(
    model="gemini-3-flash-preview",
    contents="Explain how AI works in a few words",
)
print(4)
print("sadfg")
print(response.text)