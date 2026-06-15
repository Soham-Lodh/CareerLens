from fastapi import FastAPI, HTTPException
from prediction_helper import predict, model_status
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CareerPredictorInput(BaseModel):
    age: int = Field(..., ge=16, le=40)
    gender: str
    degree_type: str
    stream: str
    year_of_study: int = Field(..., ge=1, le=6)
    college_tier: str
    urban_or_rural: str
    daily_ai_tool_usage_hrs: float = Field(..., ge=0, le=24)
    primary_ai_tools_used: str
    ai_replaces_own_thinking_score: int = Field(..., ge=1, le=10)
    ai_dependency_score: int = Field(..., ge=1, le=10)
    fear_of_job_loss_to_ai: int = Field(..., ge=1, le=10)
    career_clarity_score: int = Field(..., ge=1, le=10)
    internship_experience: int = Field(..., ge=0)
    weekly_job_application_count: int = Field(..., ge=0)
    resume_confidence_score: int = Field(..., ge=1, le=10)
    interview_anxiety_score: int = Field(..., ge=1, le=10)
    daily_study_hours: float = Field(..., ge=0, le=24)
    self_learning_hours_per_week: float = Field(..., ge=0)
    skill_development_courses_taken: int = Field(..., ge=0)
    social_media_hrs_per_day: float = Field(..., ge=0, le=24)
    sleep_hours: float = Field(..., ge=0, le=24)
    stress_level: int = Field(..., ge=1, le=10)
    motivation_score: int = Field(..., ge=1, le=10)


class CareerPredictorOutput(BaseModel):
    burnout_score: float
    career_counseling_score: float
    career_readiness_score: float


@app.get("/model_status")
def get_model_status():
    return model_status()


@app.post(
    "/predict",
    response_model=CareerPredictorOutput,
)
def predict_career(data: CareerPredictorInput):
    try:
        burnout, counseling, readiness = predict(
            **data.model_dump()
        )

        return CareerPredictorOutput(
            burnout_score=float(burnout),
            career_counseling_score=float(counseling),
            career_readiness_score=float(readiness),
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )