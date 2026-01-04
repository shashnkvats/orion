"""
Configuration settings for the application
"""
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # OpenAI Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-5.1")
    
    # Server Configuration
    port: int = int(os.getenv("PORT", "3000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    
    # API Configuration
    api_title: str = "Chatbot API"
    api_description: str = "Chatbot backend with OpenAI integration"
    api_version: str = "1.0.0"
    
    # PostgreSQL Configuration
    pg_user: str = os.getenv("pg_user", "")
    pg_password: str = os.getenv("pg_password", "")
    pg_host: str = os.getenv("pg_host", "")
    pg_port: int = int(os.getenv("pg_port", "5432"))
    pg_dbname: str = os.getenv("pg_dbname", "")
    
    # CORS Configuration
    cors_origins: list = ["*"]  # In production, specify your frontend domain
    
    # OpenAI Model Parameters
    temperature: float = 0.7
    max_tokens: int = 1000

    pg_uri: str = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_dbname}?sslmode=require"
    CHECKPOINT_TTL: int = 60 * 60 * 24 * 30 # 30 days

    ANONYMOUS_DAILY_LIMIT: int = 40

    class Config:
        case_sensitive = False


# Create settings instance
settings = Settings()

