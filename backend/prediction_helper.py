import joblib
import pandas as pd
import numpy as np

MODEL_PATH = "artifacts/models.pkl"

artifacts = joblib.load(MODEL_PATH)

scaler = artifacts["scaler"]["scaler"]
scaler_cols = artifacts["scaler"]["cols"]

burnout_model = artifacts["model_burnout_score"]["model"]
burnout_cols = artifacts["model_burnout_score"]["cols"]

career_counseling_model = artifacts["model_seeks_career_counseling"]["model"]
career_counseling_cols = artifacts["model_seeks_career_counseling"]["cols"]

career_readiness_model = artifacts["model_overall_career_readiness_score"]["model"]
career_readiness_cols = artifacts["model_overall_career_readiness_score"]["cols"]


def predict(
    age,
    gender,
    degree_type,
    stream,
    year_of_study,
    college_tier,
    urban_or_rural,
    daily_ai_tool_usage_hrs,
    primary_ai_tools_used,
    ai_replaces_own_thinking_score,
    ai_dependency_score,
    fear_of_job_loss_to_ai,
    career_clarity_score,
    internship_experience,
    weekly_job_application_count,
    resume_confidence_score,
    interview_anxiety_score,
    daily_study_hours,
    self_learning_hours_per_week,
    skill_development_courses_taken,
    social_media_hrs_per_day,
    sleep_hours,
    stress_level,
    motivation_score,
):
    input_data = {
        "age": age,
        "year_of_study": year_of_study,
        "college_tier": (
            0 if college_tier == "Tier 3"
            else 1 if college_tier == "Tier 2"
            else 2
        ),
        "urban_or_rural": 1 if urban_or_rural == "Urban" else 0,
        "daily_ai_tool_usage_hrs": daily_ai_tool_usage_hrs,
        "ai_replaces_own_thinking_score": ai_replaces_own_thinking_score,
        "ai_dependency_score": ai_dependency_score,
        "fear_of_job_loss_to_ai": fear_of_job_loss_to_ai,
        "career_clarity_score": career_clarity_score,
        "internship_experience": internship_experience,
        "weekly_job_application_count": weekly_job_application_count,
        "resume_confidence_score": resume_confidence_score,
        "interview_anxiety_score": interview_anxiety_score,
        "daily_study_hours": daily_study_hours,
        "self_learning_hours_per_week": self_learning_hours_per_week,
        "skill_development_courses_taken": skill_development_courses_taken,
        "social_media_hrs_per_day": social_media_hrs_per_day,
        "sleep_hours": sleep_hours,
        "stress_level": stress_level,
        "motivation_score": motivation_score,
        
        #Constant values
        "uses_ai_for_assignments": 0,
        "placement_anxiety_score": 0,

        # Gender
        "gender_Male": 1 if gender == "Male" else 0,
        "gender_Non-binary": 1 if gender == "Non-binary" else 0,

        # Degree Type
        "degree_type_B.Tech/B.E.": 1 if degree_type == "B.Tech/B.E." else 0,
        "degree_type_M.Tech/M.Sc": 1 if degree_type == "M.Tech/M.Sc" else 0,
        "degree_type_MBA": 1 if degree_type == "MBA" else 0,

        # Stream
        "stream_CS/IT": 1 if stream == "CS/IT" else 0,
        "stream_Commerce/Management": 1 if stream == "Commerce/Management" else 0,
        "stream_Engineering (Non-CS)": 1 if stream == "Engineering (Non-CS)" else 0,

        # AI Tools
        "primary_ai_tools_used_Claude": 1 if primary_ai_tools_used == "Claude" else 0,
        "primary_ai_tools_used_Gemini": 1 if primary_ai_tools_used == "Gemini" else 0,
        "primary_ai_tools_used_GitHub Copilot": 1 if primary_ai_tools_used == "GitHub Copilot" else 0,
        "primary_ai_tools_used_None": 1 if primary_ai_tools_used == "None" else 0,
        "primary_ai_tools_used_Perplexity": 1 if primary_ai_tools_used == "Perplexity" else 0,
        "primary_ai_tools_used_Unknown": 1 if primary_ai_tools_used == "Unknown" else 0,
    }

    df = pd.DataFrame([input_data])

    # Scale features
    df[scaler_cols] = scaler.transform(df[scaler_cols])

    burnout_score = burnout_model.predict(df[burnout_cols])[0]
    career_counseling_score = career_counseling_model.predict(
        df[career_counseling_cols]
    )[0]
    career_readiness_score = career_readiness_model.predict(
        df[career_readiness_cols]
    )[0]

    return (
        burnout_score,
        career_counseling_score,
        career_readiness_score,
    )


def model_status():
    return {
        "model": "career_readiness",
        "status": "loaded",
    }