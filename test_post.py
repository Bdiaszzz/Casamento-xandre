import json
import urllib.request
import urllib.parse

URL = "https://script.google.com/macros/s/AKfycbzt0Dq9oaK_dYS3Ii8BT3Ge5jej_-TeFusb6p3Muq52jY8tn4GwaP5HBVQFbdV8PjDL/exec"


def post_json():
    data = json.dumps(
        {
            "nome": "ServerTest JSON",
            "presenca": "Sim",
            "pessoas": "2",
            "mensagem": "envio_json",
            "data_envio": "agora",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("JSON POST status:", r.status)
            print(r.read().decode("utf-8", "ignore"))
    except Exception as e:
        print("JSON POST error:", type(e).__name__, e)


def post_form():
    form = {
        "nome": "ServerTest Form",
        "presenca": "Sim",
        "pessoas": "3",
        "mensagem": "envio_form",
        "data_envio": "agora",
    }
    data = urllib.parse.urlencode(form).encode("utf-8")
    req = urllib.request.Request(
        URL, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print("FORM POST status:", r.status)
            print(r.read().decode("utf-8", "ignore"))
    except Exception as e:
        print("FORM POST error:", type(e).__name__, e)


if __name__ == "__main__":
    print("Testing JSON POST...")
    post_json()
    print("\nTesting FORM POST...")
    post_form()
