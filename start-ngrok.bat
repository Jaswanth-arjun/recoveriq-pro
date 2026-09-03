@echo off
REM Starts the ngrok tunnel required for Twilio voice calls (Stage 7).
REM Twilio fetches the TwiML script from this public URL.
REM Keep this window open while testing voice calls.
"D:\Temp\opencode\ngrok\ngrok.exe" http --url=portable-debtor-unbridle.ngrok-free.dev 8000