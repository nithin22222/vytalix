Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c python flask_api_backend.py", 0, False
