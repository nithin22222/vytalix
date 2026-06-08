"""
Vercel Serverless Entry Point
Imports the Flask app from flask_api_backend.py
"""
import sys
import os

# Add local directory to path so we can import flask_api_backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask_api_backend import app


# Vercel expects the WSGI app to be named 'app'
