from fastapi import FastAPI

app = FastAPI(
    title="TrueFact News API",
    description="Backend API for the TrueFact News platform",
    version="0.1.0",
)


@app.get("/")
def home():
    return {
        "message": "Welcome to TrueFact News API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}